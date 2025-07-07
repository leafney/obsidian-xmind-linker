import { Plugin, TFile, WorkspaceLeaf, MarkdownPostProcessorContext, Notice } from 'obsidian';
import { XMindView, XMIND_VIEW_TYPE } from './src/viewer/xmind-viewer';
import { XMindLinkerSettingTab, DEFAULT_SETTINGS } from './src/core/settings';
import { ThumbnailExtractor } from './src/file-handler/thumbnail-extractor';
import { i18n } from './src/core/i18n';
import type { XMindViewerSettings } from './src/types';

export default class XMindLinkerPlugin extends Plugin {
  settings: XMindViewerSettings;
  thumbnailExtractor: ThumbnailExtractor;
  private openedFiles: Map<string, WorkspaceLeaf> = new Map();
  private originalOpenLinkText: any;

  async onload() {
    // 加载设置
    await this.loadSettings();
    
    // 初始化国际化
    i18n.setLanguage(this.settings.language);
    
    console.log(i18n.t('messages.pluginLoaded'));

    // 初始化缩略图提取器
    this.thumbnailExtractor = new ThumbnailExtractor(
      this.app.vault,
      this.settings.thumbnailCacheDir,
      this.settings
    );

    // 加载缓存数据
    await this.thumbnailExtractor.loadCache();

    // 注册视图类型，使用自定义工厂函数处理重复问题
    this.registerView(
      XMIND_VIEW_TYPE,
      (leaf) => this.createXMindView(leaf)
    );

    // 注册文件扩展名
    this.registerExtensions(['xmind'], XMIND_VIEW_TYPE);
    

    
    // 监听工作区变化，清理已关闭的标签页
    this.registerEvent(
      this.app.workspace.on('layout-change', () => {
        this.cleanupClosedTabs();
      })
    );

    // 注册命令
    this.registerCommands();

    // 注册 Markdown 后处理器
    this.registerMarkdownPostProcessor(this.processXMindEmbeds.bind(this));

    // 注册设置面板
    this.addSettingTab(new XMindLinkerSettingTab(this.app, this));

    // 注册事件监听器
    this.registerEventListeners();

    // 重写文件打开处理，优化用户体验
    this.overrideFileOpenBehavior();
  }

  async onunload() {
    console.log(i18n.t('messages.pluginUnloaded'));
    
    // 恢复原始的 openLinkText 方法
    if (this.originalOpenLinkText) {
      this.app.workspace.openLinkText = this.originalOpenLinkText;
    }
    
    // 清理无效缓存
    if (this.thumbnailExtractor) {
      await this.thumbnailExtractor.cleanupInvalidCache();
    }
  }

  /**
   * 注册命令
   */
  private registerCommands(): void {
    // 打开 XMind 文件命令
    this.addCommand({
      id: 'open-xmind-file',
      name: i18n.t('commands.openXMindFile'),
      callback: () => {
        this.openXMindFilePicker();
      }
    });

    // 提取缩略图命令
    this.addCommand({
      id: 'extract-xmind-thumbnail',
      name: i18n.t('commands.extractThumbnail'),
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (file && file.extension === 'xmind') {
          if (!checking) {
            this.extractThumbnail(file);
          }
          return true;
        }
        return false;
      }
    });

    // 清理缓存命令
    this.addCommand({
      id: 'cleanup-thumbnail-cache',
      name: i18n.t('commands.cleanupCache'),
      callback: async () => {
        await this.thumbnailExtractor.clearAllCache();
        new Notice('所有缓存已清理完成');
      }
    });
  }

  /**
   * 注册事件监听器
   */
  private registerEventListeners(): void {
    // 移除文件打开事件监听器，避免与文件关联冲突
    // 文件关联已经通过 registerExtensions 处理
    
    // 监听文件删除事件
    this.registerEvent(
      this.app.vault.on('delete', (file) => {
        if (file instanceof TFile && file.extension === 'xmind') {
          // 清理无效缓存
          this.thumbnailExtractor.cleanupInvalidCache();
          // 清理打开文件记录
          this.openedFiles.delete(file.path);
        }
      })
    );

    // 注意：布局变化监听已经在上面的重复视图处理中包含了

    // 监听活动文件变化，用于调试
    this.registerEvent(
      this.app.workspace.on('active-leaf-change', (leaf) => {
        if (leaf && leaf.view && leaf.view.getViewType() === XMIND_VIEW_TYPE) {
          console.log('XMind 视图变为活动状态:', leaf);
          const activeFile = this.app.workspace.getActiveFile();
          console.log('当前活动文件:', activeFile);
        }
      })
    );
  }

  /**
   * 处理 Markdown 中的 XMind 嵌入
   */
  private async processXMindEmbeds(
    element: HTMLElement,
    context: MarkdownPostProcessorContext
  ): Promise<void> {
    const embeds = element.querySelectorAll('span.internal-embed');
    
    for (let i = 0; i < embeds.length; i++) {
      const embed = embeds[i];
      const src = embed.getAttribute('src');
      if (src && src.endsWith('.xmind')) {
        await this.processXMindEmbed(embed as HTMLElement, src, context);
      }
    }
  }

  /**
   * 处理单个 XMind 嵌入
   */
  private async processXMindEmbed(
    element: HTMLElement,
    src: string,
    context: MarkdownPostProcessorContext
  ): Promise<void> {
    try {
      // 解析文件路径
      const file = this.app.metadataCache.getFirstLinkpathDest(src, context.sourcePath);
      
      if (!file || file.extension !== 'xmind') {
        element.textContent = `${i18n.t('errors.fileNotFound')}: ${src}`;
        return;
      }

      // 创建容器
      const container = element.createDiv({
        cls: 'xmind-embed-container'
      });

      // 如果启用缩略图提取，尝试显示缩略图
      if (this.settings.enableThumbnailExtraction) {
        // 显示加载状态
        if (this.settings.showThumbnailLoadingIndicator) {
          this.showLoadingIndicator(container, file);
        }

        const result = await this.thumbnailExtractor.extractThumbnail(file);
        
        // 清除加载状态
        container.empty();

        if (result.success && result.thumbnailPath) {
          // 成功提取缩略图
          this.createThumbnailElement(container, file, result.thumbnailPath);
        } else if (result.fallbackUsed && this.settings.enableThumbnailFallback) {
          // 使用fallback显示
          this.createFallbackElement(container, file);
        } else {
          // 显示错误状态
          this.createErrorElement(container, file, result.error || '未知错误');
        }
      } else {
        // 未启用缩略图提取，显示fallback
        if (this.settings.enableThumbnailFallback) {
          this.createFallbackElement(container, file);
        } else {
          container.textContent = `XMind: ${file.basename}`;
        }
      }

      // 添加悬停提示
      if (this.settings.showHoverTooltip) {
        this.addHoverTooltip(container, file);
      }

      // 清空原始内容
      element.empty();
      element.appendChild(container);

    } catch (error) {
      console.error(i18n.t('errors.processEmbedFailed'), error);
      element.textContent = `${i18n.t('errors.processEmbedFailed')}: ${error.message}`;
    }
  }

  /**
   * 显示加载指示器
   */
  private showLoadingIndicator(container: HTMLElement, file: TFile): void {
    const loadingDiv = container.createDiv({
      cls: 'xmind-thumbnail-loading'
    });

    const spinner = loadingDiv.createDiv({
      cls: 'xmind-loading-spinner'
    });

    const text = loadingDiv.createDiv({
      cls: 'xmind-loading-text',
      text: `正在提取 ${file.basename} 的缩略图...`
    });
  }

  /**
   * 创建缩略图元素
   */
  private createThumbnailElement(container: HTMLElement, file: TFile, thumbnailPath: string): void {
    const img = container.createEl('img', {
      cls: `xmind-thumbnail size-${this.getThumbnailSize()}`,
      attr: {
        src: this.app.vault.adapter.getResourcePath(thumbnailPath),
        alt: file.basename,
        style: `max-width: ${this.settings.thumbnailMaxWidth}px; max-height: ${this.settings.thumbnailMaxHeight}px;`
      }
    });

    // 添加质量指示器
    if (this.settings.thumbnailQuality !== 'medium') {
      const badge = container.createDiv({
        cls: 'xmind-quality-badge',
        text: this.settings.thumbnailQuality === 'high' ? 'HQ' : 'LQ'
      });
    }

    // 添加信息覆盖层
    const overlay = container.createDiv({
      cls: 'xmind-thumbnail-overlay',
      text: `${file.basename} • 点击查看`
    });

    // 添加点击事件
    img.addEventListener('click', () => {
      this.openXMindInViewer(file);
    });

    container.addEventListener('click', () => {
      this.openXMindInViewer(file);
    });
  }

  /**
   * 创建fallback元素
   */
  private createFallbackElement(container: HTMLElement, file: TFile): void {
    const fallbackDiv = container.createDiv({
      cls: 'xmind-fallback-container'
    });

    // 创建SVG图标
    const iconDiv = fallbackDiv.createDiv({
      cls: 'xmind-fallback-icon'
    });
    iconDiv.innerHTML = this.thumbnailExtractor.createFallbackIcon();

    const filename = fallbackDiv.createDiv({
      cls: 'xmind-fallback-filename',
      text: file.basename
    });

    const text = fallbackDiv.createDiv({
      cls: 'xmind-fallback-text',
      text: '点击查看 XMind 文件'
    });

    // 添加点击事件
    fallbackDiv.addEventListener('click', () => {
      this.openXMindInViewer(file);
    });
  }

  /**
   * 创建错误元素
   */
  private createErrorElement(container: HTMLElement, file: TFile, error: string): void {
    const errorDiv = container.createDiv({
      cls: 'xmind-thumbnail-error'
    });

    const iconDiv = errorDiv.createDiv({
      cls: 'xmind-error-icon',
      text: '⚠️'
    });

    const text = errorDiv.createDiv({
      cls: 'xmind-error-text',
      text: `缩略图提取失败: ${error}`
    });

    // 添加点击事件仍然可以打开文件
    errorDiv.addEventListener('click', () => {
      this.openXMindInViewer(file);
    });
  }

  /**
   * 获取缩略图大小级别
   */
  private getThumbnailSize(): string {
    const width = this.settings.thumbnailMaxWidth;
    if (width <= 300) return 'small';
    if (width <= 500) return 'medium';
    return 'large';
  }

  /**
   * 添加悬停提示
   */
  private addHoverTooltip(element: HTMLElement, file: TFile): void {
    let tooltip: HTMLElement | null = null;

    element.addEventListener('mouseenter', () => {
      if (tooltip) return;

      tooltip = document.body.createDiv({
        cls: 'xmind-hover-tooltip'
      });

      // 预览按钮
      const previewBtn = tooltip.createEl('button', {
        text: i18n.t('messages.viewInPlugin'),
        cls: 'xmind-tooltip-btn'
      });
      previewBtn.addEventListener('click', () => {
        this.openXMindInViewer(file);
        tooltip?.remove();
        tooltip = null;
      });

      // 系统打开按钮
      if (this.settings.enableSystemIntegration) {
        const systemBtn = tooltip.createEl('button', {
          text: i18n.t('messages.openInXMind'),
          cls: 'xmind-tooltip-btn'
        });
        systemBtn.addEventListener('click', async () => {
          await this.openInSystem(file);
          tooltip?.remove();
          tooltip = null;
        });
      }

      // 定位工具提示
      const rect = element.getBoundingClientRect();
      tooltip.style.position = 'fixed';
      tooltip.style.left = `${rect.left}px`;
      tooltip.style.top = `${rect.bottom + 5}px`;
      tooltip.style.zIndex = '1000';
    });

    element.addEventListener('mouseleave', () => {
      if (tooltip) {
        tooltip.remove();
        tooltip = null;
      }
    });
  }

  /**
   * 创建 XMind 视图的工厂函数
   */
  private createXMindView(leaf: WorkspaceLeaf): XMindView {
    console.log('创建 XMind 视图，leaf:', leaf);
    
    // 创建视图
    const view = new XMindView(leaf, this.settings);
    
    // 立即进行重复检查，尽早处理
    setTimeout(() => {
      this.checkAndHandleDuplicateViews(leaf);
    }, 20); // 减少延迟时间
    
    return view;
  }

  /**
   * 检查并处理重复视图（针对新创建的 leaf）
   */
  private checkAndHandleDuplicateViews(newLeaf: WorkspaceLeaf): void {
    // 等待视图完全初始化
    const checkRepeatedly = (attempts = 0) => {
      const newView = newLeaf.view as XMindView;
      const newFile = newView?.getFile();
      
      if (!newFile && attempts < 10) {
        // 如果文件还没有加载，继续等待
        setTimeout(() => checkRepeatedly(attempts + 1), 50);
        return;
      }
      
      if (!newFile) {
        console.log('新视图没有文件，跳过重复检查');
        return;
      }
      
      console.log('检查新创建的视图是否重复，文件:', newFile.path);
      
      // 获取所有 XMind 视图
      const allXMindLeaves = this.app.workspace.getLeavesOfType(XMIND_VIEW_TYPE);
      
      // 查找打开相同文件的其他视图（排除当前新创建的）
      const sameFileLeaves = allXMindLeaves.filter(leaf => {
        if (leaf === newLeaf) return false;
        
        const view = leaf.view as XMindView;
        const file = view?.getFile();
        return file && file.path === newFile.path;
      });
      
      if (sameFileLeaves.length > 0) {
        console.log(`发现重复视图，立即关闭新创建的视图，激活已存在的视图`);
        
        // 立即激活已存在的视图
        const existingLeaf = sameFileLeaves[0];
        
        // 先关闭新视图，再激活已存在的视图，减少视觉闪烁
        newLeaf.detach();
        this.app.workspace.setActiveLeaf(existingLeaf);
        
        // 更新记录
        this.openedFiles.set(newFile.path, existingLeaf);
      } else {
        // 没有重复，记录新视图
        this.openedFiles.set(newFile.path, newLeaf);
        console.log('新视图已记录，无重复');
      }
    };
    
    checkRepeatedly();
  }

  /**
   * 重写文件打开行为，优化用户体验
   */
  private overrideFileOpenBehavior(): void {
    // 保存原始的 openLinkText 方法
    this.originalOpenLinkText = this.app.workspace.openLinkText.bind(this.app.workspace);
    
    // 重写 openLinkText 方法
    this.app.workspace.openLinkText = async (linktext: string, sourcePath: string, newLeaf?: boolean, openViewState?: any) => {
      // 检查是否是 XMind 文件
      if (linktext.endsWith('.xmind')) {
        console.log('拦截 XMind 文件打开:', linktext);
        
        // 查找文件
        const file = this.app.metadataCache.getFirstLinkpathDest(linktext, sourcePath);
        if (file && file.extension === 'xmind') {
          // 检查是否已经有打开这个文件的视图
          const existingLeaf = this.findExistingXMindView(file);
          if (existingLeaf) {
            console.log('激活已存在的 XMind 视图，避免创建新标签页');
            this.app.workspace.setActiveLeaf(existingLeaf);
            return existingLeaf;
          }
        }
      }
      
      // 如果不是 XMind 文件或没有重复，使用原始方法
      return this.originalOpenLinkText(linktext, sourcePath, newLeaf, openViewState);
    };


  }

  /**
   * 处理重复的 XMind 视图
   */
  private handleDuplicateXMindViews(): void {
    // 获取所有 XMind 视图
    const xmindLeaves = this.app.workspace.getLeavesOfType(XMIND_VIEW_TYPE);
    
    if (xmindLeaves.length <= 1) {
      return; // 没有重复，直接返回
    }
    
    console.log('检查重复 XMind 视图，当前数量:', xmindLeaves.length);
    
    // 按文件路径分组
    const fileGroups = new Map<string, WorkspaceLeaf[]>();
    
    xmindLeaves.forEach(leaf => {
      const view = leaf.view as XMindView;
      const file = view.getFile();
      
      if (file) {
        const filePath = file.path;
        if (!fileGroups.has(filePath)) {
          fileGroups.set(filePath, []);
        }
        fileGroups.get(filePath)!.push(leaf);
      }
    });
    
    // 处理每个文件组的重复视图
    fileGroups.forEach((leaves, filePath) => {
      if (leaves.length > 1) {
        console.log(`发现文件 ${filePath} 有 ${leaves.length} 个重复视图，开始清理...`);
        
        // 保留最后一个（最新创建的），关闭其他的
        const keepLeaf = leaves[leaves.length - 1];
        const toClose = leaves.slice(0, -1);
        
        toClose.forEach(leaf => {
          console.log('关闭重复的视图:', leaf);
          leaf.detach();
        });
        
        // 更新记录
        this.openedFiles.set(filePath, keepLeaf);
        console.log(`清理完成，保留最新视图`);
      } else if (leaves.length === 1) {
        // 只有一个视图，更新记录
        this.openedFiles.set(filePath, leaves[0]);
      }
    });
  }

  /**
   * 在查看器中打开 XMind 文件
   */
  private async openXMindInViewer(file: TFile): Promise<void> {
    // 首先检查是否已经有打开这个文件的 XMind 视图
    const existingLeaf = this.findExistingXMindView(file);
    if (existingLeaf) {
      // 如果已经打开，激活现有的标签页
      this.app.workspace.setActiveLeaf(existingLeaf);
      return;
    }

    // 创建新的标签页
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.setViewState({
      type: XMIND_VIEW_TYPE,
      state: { file: file.path }
    });

    // 记录打开的文件
    this.openedFiles.set(file.path, leaf);
  }

  /**
   * 查找已经打开指定文件的 XMind 视图
   */
  private findExistingXMindView(file: TFile): WorkspaceLeaf | null {
    // 首先检查我们自己维护的记录
    const recordedLeaf = this.openedFiles.get(file.path);
    if (recordedLeaf && recordedLeaf.view && recordedLeaf.view.getViewType() === XMIND_VIEW_TYPE) {
      const view = recordedLeaf.view as XMindView;
      if (view.getFile()?.path === file.path) {
        return recordedLeaf;
      }
    }

    // 遍历所有工作区的叶子节点，查找是否有打开相同文件的 XMind 视图
    const leaves = this.app.workspace.getLeavesOfType(XMIND_VIEW_TYPE);
    for (const leaf of leaves) {
      const view = leaf.view as XMindView;
      if (view.getFile()?.path === file.path) {
        // 更新我们的记录
        this.openedFiles.set(file.path, leaf);
        return leaf;
      }
    }

    return null;
  }

  /**
   * 清理已关闭的标签页记录
   */
  private cleanupClosedTabs(): void {
    const activeLeaves = this.app.workspace.getLeavesOfType(XMIND_VIEW_TYPE);
    const activeLeafSet = new Set(activeLeaves);

    for (const [filePath, leaf] of this.openedFiles.entries()) {
      // 如果叶子节点不在活动叶子节点列表中，或者视图类型不匹配，则清理
      if (!activeLeafSet.has(leaf) || !leaf.view || leaf.view.getViewType() !== XMIND_VIEW_TYPE) {
        this.openedFiles.delete(filePath);
      }
    }
  }

  /**
   * 打开文件选择器
   */
  private async openXMindFilePicker(): Promise<void> {
    // 这里可以实现文件选择器逻辑
    // 或者直接打开文件浏览器
    console.log(i18n.t('commands.openXMindFile'));
  }

  /**
   * 提取缩略图
   */
  private async extractThumbnail(file: TFile): Promise<void> {
    try {
      const thumbnailPath = await this.thumbnailExtractor.extractThumbnail(file);
      if (thumbnailPath) {
        console.log(`${i18n.t('messages.thumbnailExtracted')}: ${thumbnailPath}`);
        // 显示成功通知
      } else {
        console.log(i18n.t('messages.fileNotFound'));
      }
    } catch (error) {
      console.error(i18n.t('errors.thumbnailExtractionFailed'), error);
    }
  }

  /**
   * 在系统默认应用中打开
   */
  private async openInSystem(file: TFile): Promise<void> {
    try {
      const { shell } = require('electron');
      const filePath = (this.app.vault.adapter as any).path.join(
        (this.app.vault.adapter as any).basePath, 
        file.path
      );
      
      // 使用 shell.openPath 打开文件
      const result = await shell.openPath(filePath);
      
      // 检查打开结果
      if (result) {
        // result 不为空字符串表示有错误
        console.error('系统打开失败:', result);
        
        // 根据错误信息判断具体原因
        let errorMessage: string;
        if (result.includes('No application') || result.includes('没有应用') || 
            result.includes('not found') || result.includes('找不到')) {
          errorMessage = i18n.t('errors.systemOpenNoApp');
        } else if (result.includes('Permission') || result.includes('权限') || 
                   result.includes('denied') || result.includes('拒绝')) {
          errorMessage = i18n.t('errors.systemOpenPermissionDenied');
        } else {
          errorMessage = `${i18n.t('errors.systemOpenFailed')}: ${result}`;
        }
        
        // 显示错误通知
        new Notice(errorMessage, 5000);
      } else {
        // 成功打开，显示成功通知
        new Notice(i18n.t('messages.systemOpenSuccess'), 3000);
      }
    } catch (error) {
      console.error('系统打开异常:', error);
      
      // 根据异常类型判断错误原因
      let errorMessage: string;
      if (error.message && error.message.includes('spawn')) {
        errorMessage = i18n.t('errors.systemOpenNoApp');
      } else if (error.message && error.message.includes('EACCES')) {
        errorMessage = i18n.t('errors.systemOpenPermissionDenied');
      } else {
        errorMessage = `${i18n.t('errors.systemOpenFailed')}: ${error.message || error}`;
      }
      
      // 显示错误通知
      new Notice(errorMessage, 5000);
    }
  }

  /**
   * 加载设置
   */
  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  /**
   * 保存设置
   */
  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    
    // 更新缩略图提取器的设置
    if (this.thumbnailExtractor) {
      this.thumbnailExtractor.updateSettings(this.settings);
    }
  }
} 