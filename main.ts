import { Plugin, TFile, WorkspaceLeaf, MarkdownPostProcessorContext } from 'obsidian';
import { XMindView, XMIND_VIEW_TYPE } from './src/viewer/xmind-viewer';
import { XMindViewerSettingTab, DEFAULT_SETTINGS } from './src/core/settings';
import { ThumbnailExtractor } from './src/file-handler/thumbnail-extractor';
import type { XMindViewerSettings } from './src/types';

export default class XMindViewerPlugin extends Plugin {
  settings: XMindViewerSettings;
  thumbnailExtractor: ThumbnailExtractor;
  private openedFiles: Map<string, WorkspaceLeaf> = new Map();

  async onload() {
    console.log('加载 XMind Viewer 插件');

    // 加载设置
    await this.loadSettings();

    // 初始化缩略图提取器
    this.thumbnailExtractor = new ThumbnailExtractor(
      this.app.vault,
      this.settings.thumbnailCacheDir
    );

    // 注册视图类型
    this.registerView(
      XMIND_VIEW_TYPE,
      (leaf) => new XMindView(leaf, this.settings)
    );

    // 注册文件扩展名
    this.registerExtensions(['xmind'], XMIND_VIEW_TYPE);

    // 注册命令
    this.registerCommands();

    // 注册 Markdown 后处理器
    this.registerMarkdownPostProcessor(this.processXMindEmbeds.bind(this));

    // 注册设置面板
    this.addSettingTab(new XMindViewerSettingTab(this.app, this));

    // 注册事件监听器
    this.registerEventListeners();
  }

  async onunload() {
    console.log('卸载 XMind Viewer 插件');
    
    // 清理缓存
    if (this.thumbnailExtractor) {
      await this.thumbnailExtractor.cleanupCache();
    }
  }

  /**
   * 注册命令
   */
  private registerCommands(): void {
    // 打开 XMind 文件命令
    this.addCommand({
      id: 'open-xmind-file',
      name: '打开 XMind 文件',
      callback: () => {
        this.openXMindFilePicker();
      }
    });

    // 提取缩略图命令
    this.addCommand({
      id: 'extract-xmind-thumbnail',
      name: '提取 XMind 缩略图',
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
      name: '清理缩略图缓存',
      callback: async () => {
        await this.thumbnailExtractor.cleanupCache();
        // 显示通知
        // this.app.workspace.trigger('notice', '缓存清理完成');
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
          // 清理相关缓存
          this.thumbnailExtractor.cleanupCache();
        }
      })
    );

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
        element.textContent = `无法找到 XMind 文件: ${src}`;
        return;
      }

      // 创建容器
      const container = element.createDiv({
        cls: 'xmind-embed-container'
      });

      // 如果启用缩略图提取，尝试显示缩略图
      if (this.settings.enableThumbnailExtraction) {
        const thumbnailPath = await this.thumbnailExtractor.extractThumbnail(file);
        if (thumbnailPath) {
          const img = container.createEl('img', {
            cls: 'xmind-thumbnail',
            attr: {
              src: this.app.vault.adapter.getResourcePath(thumbnailPath),
              alt: file.basename
            }
          });

          // 添加点击事件
          img.addEventListener('click', () => {
            this.openXMindInViewer(file);
          });
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
      console.error('处理 XMind 嵌入失败:', error);
      element.textContent = `处理 XMind 嵌入失败: ${error.message}`;
    }
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
        text: '预览',
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
          text: '在 XMind 中打开',
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
   * 在查看器中打开 XMind 文件
   */
  private async openXMindInViewer(file: TFile): Promise<void> {
    // 检查是否已经打开了这个文件
    const existingLeaf = this.openedFiles.get(file.path);
    if (existingLeaf && existingLeaf.view) {
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

    // 监听标签页关闭事件
    this.registerEvent(
      this.app.workspace.on('layout-change', () => {
        // 清理已关闭的标签页
        this.cleanupClosedTabs();
      })
    );

    // 由于我们已经在 setState 中处理了文件加载，这里不需要再次调用
    // const view = leaf.view as XMindView;
    // if (view) {
    //   await view.setXMindFile(file);
    // }
  }

  /**
   * 清理已关闭的标签页记录
   */
  private cleanupClosedTabs(): void {
    for (const [filePath, leaf] of this.openedFiles.entries()) {
      if (!leaf.view || leaf.view.getViewType() !== XMIND_VIEW_TYPE) {
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
    console.log('打开 XMind 文件选择器');
  }

  /**
   * 提取缩略图
   */
  private async extractThumbnail(file: TFile): Promise<void> {
    try {
      const thumbnailPath = await this.thumbnailExtractor.extractThumbnail(file);
      if (thumbnailPath) {
        console.log(`缩略图已提取: ${thumbnailPath}`);
        // 显示成功通知
      } else {
        console.log('该文件没有缩略图');
      }
    } catch (error) {
      console.error('提取缩略图失败:', error);
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
      await shell.openPath(filePath);
    } catch (error) {
      console.error('无法打开系统应用:', error);
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
  }
} 