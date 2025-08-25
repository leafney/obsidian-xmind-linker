import { Plugin, TFile, WorkspaceLeaf, MarkdownPostProcessorContext, Notice, addIcon, setIcon } from 'obsidian';
import { XMindView, XMIND_VIEW_TYPE } from './src/viewer/xmind-viewer';
import { XMindLinkerSettingTab, DEFAULT_SETTINGS } from './src/core/settings';
import { ThumbnailExtractor } from './src/file-handler/thumbnail-extractor';
import { i18n } from './src/core/i18n';
import type { XMindViewerSettings, ObsidianVaultAdapter } from './src/types';

export default class XMindLinkerPlugin extends Plugin {
  settings: XMindViewerSettings;
  thumbnailExtractor: ThumbnailExtractor;

  async onload() {
    // 加载设置
    await this.loadSettings();
    
    // 初始化国际化 - 优先使用 Obsidian 的语言设置，回退到用户设置
    try {
      const obsidianLang = this.app.getLanguage?.();
      if (obsidianLang) {
        // 将 Obsidian 语言代码映射到支持的语言
        const langMap: Record<string, 'en' | 'zh-cn'> = {
          'zh': 'zh-cn',
          'zh-cn': 'zh-cn', 
          'zh-hans': 'zh-cn',
          'zh-sg': 'zh-cn',
          'en': 'en',
          'en-us': 'en',
          'en-gb': 'en'
        };
        const mappedLang = langMap[obsidianLang.toLowerCase()] || 'en';
        i18n.setLanguage(mappedLang);
      } else {
        // 回退到用户设置
        i18n.setLanguage(this.settings.language);
      }
    } catch (error) {
      // 如果 getLanguage 不可用，回退到用户设置
      i18n.setLanguage(this.settings.language);
    }
    
    // 注册自定义图标
    this.registerXMindIcon();

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

  }

  async onunload() {

    
    
    // 清理无效缓存
    if (this.thumbnailExtractor) {
      await this.thumbnailExtractor.cleanupInvalidCache();
    }
  }

  /**
   * 注册 XMind 图标
   */
  private registerXMindIcon(): void {
    addIcon('xmind-file', `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="48" height="48" rx="4" fill="currentColor" fill-opacity="0.1" stroke="currentColor" stroke-width="2"/>
      <path d="M20 32L28 24L36 32L44 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="32" cy="40" r="2" fill="currentColor"/>
      <text x="32" y="52" text-anchor="middle" font-size="8" fill="currentColor" opacity="0.7">XMind</text>
    </svg>`);
  }

  /**
   * 注册命令
   */
  private registerCommands(): void {
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
        }
      })
    );

    // 注意：布局变化监听已经在上面的重复视图处理中包含了

    // 监听活动文件变化，用于调试
    this.registerEvent(
      this.app.workspace.on('active-leaf-change', (leaf) => {
        if (leaf && leaf.view && leaf.view.getViewType() === XMIND_VIEW_TYPE) {
          const activeFile = this.app.workspace.getActiveFile();
          // 处理活动文件变化
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
        alt: file.basename
      }
    });
    
    // 使用 CSS 自定义属性设置动态样式
    img.style.setProperty('--thumbnail-max-width', `${this.settings.thumbnailMaxWidth}px`);
    img.style.setProperty('--thumbnail-max-height', `${this.settings.thumbnailMaxHeight}px`);

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
    // 使用 Obsidian 的 setIcon API
    setIcon(iconDiv, 'xmind-file');

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
   * 创建 XMind 视图的工厂函数
   */
  private createXMindView(leaf: WorkspaceLeaf): XMindView {
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
      if (!newLeaf.view || newLeaf.view.getViewType() !== XMIND_VIEW_TYPE) {
        if (attempts < 10) {
          setTimeout(() => checkRepeatedly(attempts + 1), 50);
          return;
        }
        return;
      }
      
      const newView = this.getXMindView(newLeaf);
      const newFile = newView?.getFile();
      
      if (!newFile && attempts < 10) {
        // 如果文件还没有加载，继续等待
        setTimeout(() => checkRepeatedly(attempts + 1), 50);
        return;
      }
      
      if (!newFile) {
        return;
      }
      
      // 获取所有 XMind 视图
      const allXMindLeaves = this.app.workspace.getLeavesOfType(XMIND_VIEW_TYPE);
      
      // 查找打开相同文件的其他视图（排除当前新创建的）
      const sameFileLeaves = allXMindLeaves.filter(leaf => {
        if (leaf === newLeaf) return false;
        if (!leaf.view || leaf.view.getViewType() !== XMIND_VIEW_TYPE) return false;
        
        const view = this.getXMindView(leaf);
        const file = view?.getFile();
        return file && file.path === newFile.path;
      });
      
      if (sameFileLeaves.length > 0) {
        // 立即激活已存在的视图
        const existingLeaf = sameFileLeaves[0];
        
        // 先关闭新视图，再激活已存在的视图，减少视觉闪烁
        newLeaf.detach();
        this.app.workspace.setActiveLeaf(existingLeaf);
        
      } else {
      }
    };
    
    checkRepeatedly();
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
    
    // 按文件路径分组
    const fileGroups = new Map<string, WorkspaceLeaf[]>();
    
    xmindLeaves.forEach(leaf => {
      if (!leaf.view || leaf.view.getViewType() !== XMIND_VIEW_TYPE) return;
      
      const view = this.getXMindView(leaf);
      const file = view?.getFile();
      
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
        // 保留最后一个（最新创建的），关闭其他的
        const keepLeaf = leaves[leaves.length - 1];
        const toClose = leaves.slice(0, -1);
        
        toClose.forEach(leaf => {
          leaf.detach();
        });
        
      } else if (leaves.length === 1) {
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

    // 创建新的标签页 - 使用 true 参数强制在新标签页打开
    const leaf = this.app.workspace.getLeaf(true);
    await leaf.setViewState({
      type: XMIND_VIEW_TYPE,
      state: { file: file.path }
    });

  }

  /**
   * 安全获取 XMind 视图，处理 DeferredView 情况
   */
  private getXMindView(leaf: WorkspaceLeaf): XMindView | null {
    if (!leaf.view || leaf.view.getViewType() !== XMIND_VIEW_TYPE) {
      return null;
    }
    
    // 检查是否是 DeferredView，如果是则返回 null
    // DeferredView 在视图实际显示之前不会是真正的 XMindView
    if (leaf.view.constructor.name === 'DeferredView') {
      return null;
    }
    
    return leaf.view as XMindView;
  }

  /**
   * 查找已经打开指定文件的 XMind 视图
   */
  private findExistingXMindView(file: TFile): WorkspaceLeaf | null {
    // 遍历所有工作区的叶子节点，查找是否有打开相同文件的 XMind 视图
    const leaves = this.app.workspace.getLeavesOfType(XMIND_VIEW_TYPE);
    for (const leaf of leaves) {
      if (leaf.view?.getViewType() === XMIND_VIEW_TYPE) {
        const view = this.getXMindView(leaf);
        if (view?.getFile()?.path === file.path) {
          return leaf;
        }
      }
    }

    return null;
  }




  /**
   * 提取缩略图
   */
  private async extractThumbnail(file: TFile): Promise<void> {
    try {
      const thumbnailPath = await this.thumbnailExtractor.extractThumbnail(file);
      if (thumbnailPath) {
        // 缩略图提取成功
      } else {
        // 文件未找到
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
      const adapter = this.app.vault.adapter as unknown as ObsidianVaultAdapter;
      const filePath = adapter.path.join(
        adapter.basePath, 
        file.path
      );
      
      // 使用 Obsidian API 打开文件（跨平台兼容）
      await this.app.openWithDefaultApp(filePath);
      
      // 成功打开，显示成功通知
      new Notice(i18n.t('messages.systemOpenSuccess'), 3000);
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