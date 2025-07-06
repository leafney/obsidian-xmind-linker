import { ItemView, WorkspaceLeaf, TFile } from 'obsidian';
import { XMindParser } from '../file-handler/xmind-parser';
import type { XMindViewerSettings } from '../types';

export const XMIND_VIEW_TYPE = 'xmind-viewer';

export class XMindView extends ItemView {
  private xmindFile: TFile | null = null;
  private settings: XMindViewerSettings;
  private viewerContainer: HTMLElement;
  private contentContainer: HTMLElement;
  private viewer: any; // XMindEmbedViewer instance
  private isLoading = false;
  private loadingProgress = 0;
  private static viewerLibLoaded = false;
  private static viewerLibPromise: Promise<any> | null = null;

  constructor(leaf: WorkspaceLeaf, settings: XMindViewerSettings) {
    super(leaf);
    this.settings = settings;
    
    console.log('XMindView 构造函数被调用');
    console.log('leaf:', leaf);
    console.log('settings:', settings);
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
    console.log('XMindView onOpen 被调用');
    console.log('当前 leaf:', this.leaf);
    console.log('当前 xmindFile:', this.xmindFile);
    
    this.containerEl.empty();
    
    // 创建查看器容器
    this.viewerContainer = this.containerEl.createDiv({
      cls: 'xmind-viewer-container'
    });

    // 创建工具栏
    this.createToolbar();

    // 创建内容容器
    this.contentContainer = this.viewerContainer.createDiv({
      cls: 'xmind-viewer-content'
    });

    // 预加载查看器库
    this.preloadViewerLibrary();

    // 检查是否有文件需要加载
    await this.checkAndLoadFile();
  }

  /**
   * 检查并加载文件
   */
  private async checkAndLoadFile(): Promise<void> {
    // 如果已经有文件，直接加载
    if (this.xmindFile) {
      console.log('已有文件，直接加载:', this.xmindFile.path);
      await this.loadXMindFile(this.xmindFile);
      return;
    }

    // 尝试从 leaf 获取文件信息（这是 Obsidian 文件关联的标准方式）
    const leafFile = (this.leaf as any).file;
    if (leafFile && leafFile instanceof TFile && leafFile.extension === 'xmind') {
      console.log('从 leaf.file 获取文件:', leafFile.path);
      await this.setXMindFile(leafFile);
      return;
    }

    // 尝试从当前活动文件获取
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile && activeFile.extension === 'xmind') {
      console.log('从活动文件获取:', activeFile.path);
      await this.setXMindFile(activeFile);
      return;
    }

    // 尝试从 leaf 的状态获取文件信息
    const state = (this.leaf as any).getViewState?.();
    if (state && state.state && state.state.file) {
      console.log('从 leaf 状态获取文件:', state.state.file);
      const file = this.app.vault.getAbstractFileByPath(state.state.file);
      if (file instanceof TFile && file.extension === 'xmind') {
        await this.setXMindFile(file);
        return;
      }
    }

    console.log('没有找到要加载的文件');
    console.log('leaf 详细信息:', this.leaf);
    console.log('leaf.file:', (this.leaf as any).file);
    console.log('activeFile:', this.app.workspace.getActiveFile());
    
    // 显示提示信息
    this.contentContainer.createDiv({
      text: '请选择一个 XMind 文件进行预览',
      cls: 'xmind-no-file'
    });
  }

  /**
   * 获取视图状态
   */
  getState(): any {
    return {
      file: this.xmindFile?.path || null
    };
  }

  /**
   * 设置视图状态
   */
  async setState(state: any, result: any): Promise<void> {
    console.log('XMindView setState 被调用:', state, result);
    
    if (state && state.file) {
      const file = this.app.vault.getAbstractFileByPath(state.file);
      if (file instanceof TFile && file.extension === 'xmind') {
        console.log('通过 setState 设置文件:', file.path);
        await this.setXMindFile(file);
      }
    }
    
    // 处理直接文件关联的情况
    if (result && result.file) {
      console.log('通过 result 获取文件:', result.file);
      const file = this.app.vault.getAbstractFileByPath(result.file);
      if (file instanceof TFile && file.extension === 'xmind') {
        await this.setXMindFile(file);
      }
    }
  }

  async onClose(): Promise<void> {
    // 清理查看器
    if (this.viewer) {
      this.viewer = null;
    }
  }

  /**
   * 当文件被加载到视图中时调用（Obsidian 文件关联机制）
   */
  async onLoadFile(file: TFile): Promise<void> {
    console.log('XMindView onLoadFile 被调用:', file.path);
    await this.setXMindFile(file);
  }

  /**
   * 当文件从视图中卸载时调用
   */
  async onUnloadFile(file: TFile): Promise<void> {
    console.log('XMindView onUnloadFile 被调用:', file.path);
    this.xmindFile = null;
    if (this.viewer) {
      this.viewer = null;
    }
    this.contentContainer.empty();
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
   * 预加载查看器库
   */
  private async preloadViewerLibrary(): Promise<void> {
    if (!XMindView.viewerLibLoaded && !XMindView.viewerLibPromise) {
      XMindView.viewerLibPromise = this.loadXMindEmbedViewer();
    }
  }

  /**
   * 加载 XMind 文件
   */
  private async loadXMindFile(file: TFile): Promise<void> {
    if (this.isLoading) return;
    
    try {
      this.isLoading = true;
      
      console.log('开始加载 XMind 文件:', file.path);
      
      // 显示加载状态
      this.showLoadingState();

      // 更新窗口标题
      this.updateTitle();

      // 读取文件
      this.updateLoadingProgress('读取文件中...', 20);
      const buffer = await this.app.vault.adapter.readBinary(file.path);
      console.log('文件读取完成，大小:', buffer.byteLength);
      
      // 验证文件
      this.updateLoadingProgress('验证文件格式...', 40);
      if (!(await XMindParser.isValidXMindFile(buffer))) {
        throw new Error('无效的 XMind 文件');
      }
      console.log('文件验证通过');

      // 等待查看器库加载
      this.updateLoadingProgress('加载查看器...', 60);
      const XMindEmbedViewer = await this.getXMindEmbedViewer();
      console.log('查看器库加载完成');
      
      // 清空内容容器
      this.contentContainer.empty();
      
      // 创建查看器
      this.updateLoadingProgress('初始化查看器...', 80);
      this.viewer = new XMindEmbedViewer({
        el: this.contentContainer,
        region: this.settings.defaultRegion
      });
      console.log('查看器初始化完成');

      // 加载文件
      this.updateLoadingProgress('渲染思维导图...', 90);
      await this.viewer.load(buffer);
      console.log('文件加载到查看器完成');

      // 添加事件监听
      this.setupViewerEvents();

      this.updateLoadingProgress('完成', 100);
      
      // 延迟一点再隐藏加载状态
      setTimeout(() => {
        this.hideLoadingState();
        console.log('XMind 文件加载完成');
      }, 300);

    } catch (error) {
      console.error('加载 XMind 文件失败:', error);
      this.showErrorState(error.message);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * 获取 XMind Embed Viewer (使用缓存)
   */
  private async getXMindEmbedViewer(): Promise<any> {
    if (XMindView.viewerLibLoaded) {
      return (window as any).XMindEmbedViewer;
    }
    
    if (XMindView.viewerLibPromise) {
      return await XMindView.viewerLibPromise;
    }
    
    return await this.loadXMindEmbedViewer();
  }

  /**
   * 动态加载 XMind Embed Viewer
   */
  private async loadXMindEmbedViewer(): Promise<any> {
    try {
      // 检查是否已经加载
      if ((window as any).XMindEmbedViewer) {
        console.log('XMind 查看器库已存在');
        XMindView.viewerLibLoaded = true;
        return (window as any).XMindEmbedViewer;
      }

      console.log('开始加载 XMind 查看器库...');
      
      // 尝试从 CDN 加载
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/xmind-embed-viewer/dist/umd/xmind-embed-viewer.js';
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('加载 XMind 查看器库超时'));
        }, 30000); // 30秒超时
        
        script.onload = () => {
          clearTimeout(timeout);
          console.log('XMind 查看器库加载成功');
          XMindView.viewerLibLoaded = true;
          
          // 验证库是否正确加载
          if ((window as any).XMindEmbedViewer) {
            resolve((window as any).XMindEmbedViewer);
          } else {
            reject(new Error('XMind 查看器库加载后不可用'));
          }
        };
        
        script.onerror = (error) => {
          clearTimeout(timeout);
          console.error('XMind 查看器库加载失败:', error);
          reject(new Error('无法从 CDN 加载 XMind 查看器库'));
        };
        
        document.head.appendChild(script);
      });
    } catch (error) {
      console.error('加载 XMind 查看器库时发生错误:', error);
      throw new Error('无法加载 XMind 查看器库');
    }
  }

  /**
   * 更新窗口标题
   */
  private updateTitle(): void {
    // 标题会自动通过 getDisplayText() 方法更新
    // 这里不需要手动设置
  }

  /**
   * 更新加载进度
   */
  private updateLoadingProgress(message: string, progress: number): void {
    this.loadingProgress = progress;
    const loadingEl = this.contentContainer.querySelector('.xmind-loading-text');
    const progressBar = this.contentContainer.querySelector('.xmind-loading-progress-bar');
    
    if (loadingEl) {
      loadingEl.textContent = message;
    }
    
    if (progressBar) {
      (progressBar as HTMLElement).style.width = `${progress}%`;
    }
  }

  /**
   * 隐藏加载状态
   */
  private hideLoadingState(): void {
    const loadingEl = this.contentContainer.querySelector('.xmind-loading');
    if (loadingEl) {
      loadingEl.remove();
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
    this.contentContainer.empty();
    
    const loadingContainer = this.contentContainer.createDiv({
      cls: 'xmind-loading'
    });
    
    // 加载动画
    loadingContainer.createDiv({
      cls: 'xmind-loading-spinner'
    });
    
    // 加载文本
    loadingContainer.createDiv({
      text: '正在加载 XMind 文件...',
      cls: 'xmind-loading-text'
    });
    
    // 进度条
    const progressContainer = loadingContainer.createDiv({
      cls: 'xmind-loading-progress'
    });
    
    progressContainer.createDiv({
      cls: 'xmind-loading-progress-bar'
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
      const filePath = (this.app.vault.adapter as any).path.join(
        (this.app.vault.adapter as any).basePath, 
        this.xmindFile.path
      );
      await shell.openPath(filePath);
    } catch (error) {
      console.error('无法打开系统应用:', error);
    }
  }
} 