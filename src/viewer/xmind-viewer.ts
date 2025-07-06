import { ItemView, WorkspaceLeaf, TFile } from 'obsidian';
import { XMindParser } from '../file-handler/xmind-parser';
import type { XMindViewerSettings } from '../types';

export const XMIND_VIEW_TYPE = 'xmind-viewer';

export class XMindView extends ItemView {
  private xmindFile: TFile | null = null;
  private settings: XMindViewerSettings;
  private viewerContainer: HTMLElement;
  private viewer: any; // XMindEmbedViewer instance

  constructor(leaf: WorkspaceLeaf, settings: XMindViewerSettings) {
    super(leaf);
    this.settings = settings;
  }

  getViewType(): string {
    return XMIND_VIEW_TYPE;
  }

  getDisplayText(): string {
    return this.xmindFile ? this.xmindFile.basename : 'XMind Viewer';
  }

  getIcon(): string {
    return 'brain';
  }

  async onOpen(): Promise<void> {
    this.containerEl.empty();
    
    // 创建查看器容器
    this.viewerContainer = this.containerEl.createDiv({
      cls: 'xmind-viewer-container'
    });

    // 创建工具栏
    this.createToolbar();

    // 如果有文件，加载它
    if (this.xmindFile) {
      await this.loadXMindFile(this.xmindFile);
    }
  }

  async onClose(): Promise<void> {
    // 清理查看器
    if (this.viewer) {
      this.viewer = null;
    }
  }

  /**
   * 设置要查看的 XMind 文件
   */
  async setXMindFile(file: TFile): Promise<void> {
    this.xmindFile = file;
    
    if (this.viewerContainer) {
      await this.loadXMindFile(file);
    }
  }

  /**
   * 加载 XMind 文件
   */
  private async loadXMindFile(file: TFile): Promise<void> {
    try {
      // 显示加载状态
      this.showLoadingState();

      // 读取文件
      const buffer = await this.app.vault.adapter.readBinary(file.path);
      
      // 验证文件
      if (!(await XMindParser.isValidXMindFile(buffer))) {
        throw new Error('无效的 XMind 文件');
      }

      // 动态导入 xmind-embed-viewer
      const XMindEmbedViewer = await this.loadXMindEmbedViewer();
      
      // 清空容器
      this.viewerContainer.empty();
      
      // 创建查看器
      this.viewer = new XMindEmbedViewer({
        el: this.viewerContainer,
        region: this.settings.defaultRegion
      });

      // 加载文件
      await this.viewer.load(buffer);

      // 添加事件监听
      this.setupViewerEvents();

    } catch (error) {
      this.showErrorState(error.message);
    }
  }

  /**
   * 动态加载 XMind Embed Viewer
   */
  private async loadXMindEmbedViewer(): Promise<any> {
    try {
      // 尝试从 CDN 加载
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/xmind-embed-viewer/dist/umd/xmind-embed-viewer.js';
      
      return new Promise((resolve, reject) => {
        script.onload = () => {
          resolve((window as any).XMindEmbedViewer);
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });
    } catch (error) {
      throw new Error('无法加载 XMind 查看器库');
    }
  }

  /**
   * 设置查看器事件
   */
  private setupViewerEvents(): void {
    if (!this.viewer) return;

    this.viewer.addEventListener('map-ready', () => {
      console.log('XMind 地图已加载');
    });

    this.viewer.addEventListener('zoom-change', (payload: any) => {
      console.log('缩放变化:', payload);
    });

    this.viewer.addEventListener('sheet-switch', (payload: any) => {
      console.log('工作表切换:', payload);
    });
  }

  /**
   * 创建工具栏
   */
  private createToolbar(): void {
    const toolbar = this.containerEl.createDiv({
      cls: 'xmind-viewer-toolbar'
    });

    // 系统打开按钮
    if (this.settings.enableSystemIntegration) {
      const openSystemButton = toolbar.createEl('button', {
        text: '在 XMind 中打开',
        cls: 'xmind-system-open-btn'
      });

      openSystemButton.addEventListener('click', () => {
        this.openInSystem();
      });
    }

    // 适应窗口按钮
    const fitButton = toolbar.createEl('button', {
      text: '适应窗口',
      cls: 'xmind-fit-btn'
    });

    fitButton.addEventListener('click', () => {
      if (this.viewer) {
        this.viewer.setFitMap();
      }
    });
  }

  /**
   * 显示加载状态
   */
  private showLoadingState(): void {
    this.viewerContainer.empty();
    this.viewerContainer.createDiv({
      text: '正在加载 XMind 文件...',
      cls: 'xmind-loading'
    });
  }

  /**
   * 显示错误状态
   */
  private showErrorState(message: string): void {
    this.viewerContainer.empty();
    this.viewerContainer.createDiv({
      text: `加载失败: ${message}`,
      cls: 'xmind-error'
    });
  }

  /**
   * 在系统默认应用中打开
   */
  private async openInSystem(): Promise<void> {
    if (!this.xmindFile) return;

    try {
      const { shell } = require('electron');
      const filePath = this.app.vault.adapter.getFullPath(this.xmindFile.path);
      await shell.openPath(filePath);
    } catch (error) {
      console.error('无法打开系统应用:', error);
    }
  }
} 