import { ItemView, WorkspaceLeaf, TFile } from 'obsidian';
import { XMindParser } from '../file-handler/xmind-parser';
import { i18n } from '../core/i18n';
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
    return this.xmindFile ? this.xmindFile.basename : i18n.t('viewer.title');
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

    // 创建内容容器
    this.contentContainer = this.viewerContainer.createDiv({
      cls: 'xmind-viewer-content'
    });

    // 创建工具栏（在内容容器之后，显示在底部）
    this.createToolbar();

    // 预加载查看器库
    this.preloadViewerLibrary();

    // 添加窗口大小变化监听器
    this.registerDomEvent(window, 'resize', () => {
      this.resizeViewer();
    });

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
      text: i18n.t('viewer.noFileSelected'),
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
   * 获取当前查看的 XMind 文件
   */
  getFile(): TFile | null {
    return this.xmindFile;
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
      this.updateLoadingProgress(i18n.t('viewer.progress.validating'), 40);
      if (!(await XMindParser.isValidXMindFile(buffer))) {
        throw new Error(i18n.t('errors.invalidXMindFile'));
      }
      console.log('文件验证通过');

      // 等待查看器库加载
      this.updateLoadingProgress(i18n.t('viewer.progress.loadingViewer'), 60);
      const XMindEmbedViewer = await this.getXMindEmbedViewer();
      console.log('查看器库加载完成');
      
      // 创建查看器容器（不清空 contentContainer，因为它包含 loading 界面）
      this.updateLoadingProgress(i18n.t('viewer.progress.initializing'), 80);
      
      // 创建隐藏的 viewer 容器
      const viewerContainer = this.contentContainer.createDiv({
        cls: 'xmind-viewer-content-inner'
      });
      viewerContainer.style.display = 'none'; // 先隐藏
      
      this.viewer = new XMindEmbedViewer({
        el: viewerContainer,
        region: this.settings.defaultRegion,
        width: '100%',
        height: '100%',
        styles: {
          width: '100%',
          height: '100%'
        }
      });
      console.log('查看器初始化完成');

      // 加载文件
      this.updateLoadingProgress(i18n.t('viewer.progress.rendering'), 90);
      await this.viewer.load(buffer);
      console.log('文件加载到查看器完成');

      // 添加事件监听
      this.setupViewerEvents();

      this.updateLoadingProgress(i18n.t('viewer.progress.completing'), 95);
      console.log('XMind 文件加载完成，等待渲染...');
      
      // 不再自动隐藏加载状态，等待 map-ready 事件
      // 设置一个备用超时，防止事件没有触发
      setTimeout(() => {
        if (this.contentContainer.querySelector('.xmind-loading')) {
          console.log('渲染超时，强制隐藏加载状态');
          this.hideLoadingState();
        }
      }, 10000); // 10秒超时

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
          reject(new Error(i18n.t('errors.viewerLibraryTimeout')));
        }, 30000); // 30秒超时
        
        script.onload = () => {
          clearTimeout(timeout);
          console.log('XMind 查看器库加载成功');
          XMindView.viewerLibLoaded = true;
          
          // 验证库是否正确加载
          if ((window as any).XMindEmbedViewer) {
            resolve((window as any).XMindEmbedViewer);
          } else {
            reject(new Error(i18n.t('errors.viewerLibraryUnavailable')));
          }
        };
        
        script.onerror = (error) => {
          clearTimeout(timeout);
          console.error('XMind 查看器库加载失败:', error);
          reject(new Error(i18n.t('errors.viewerLibraryLoadFailed')));
        };
        
        document.head.appendChild(script);
      });
    } catch (error) {
      console.error('加载 XMind 查看器库时发生错误:', error);
      throw new Error(i18n.t('errors.cannotLoadViewerLibrary'));
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

    // 根据进度更新提示信息
    const tipEl = this.contentContainer.querySelector('.xmind-loading-tip');
    if (tipEl) {
      let tipText = '';
      if (progress < 50) {
        tipText = i18n.t('viewer.loadingTips.preparingFile');
      } else if (progress < 80) {
        tipText = i18n.t('viewer.loadingTips.initializingViewer');
      } else if (progress < 95) {
        tipText = i18n.t('viewer.loadingTips.renderingMap');
      } else {
        tipText = i18n.t('viewer.loadingTips.almostDone');
      }
      tipEl.textContent = tipText;
    }
  }

  /**
   * 隐藏加载状态
   */
  private hideLoadingState(): void {
    const loadingEl = this.contentContainer.querySelector('.xmind-loading');
    if (loadingEl) {
      // 更新进度到100%
      const progressBar = loadingEl.querySelector('.xmind-loading-progress-bar') as HTMLElement;
      const loadingText = loadingEl.querySelector('.xmind-loading-text') as HTMLElement;
      
      if (progressBar) {
        progressBar.style.width = '100%';
      }
      
      if (loadingText) {
        loadingText.textContent = i18n.t('viewer.loadingComplete');
      }
      
      // 添加淡出动画
      (loadingEl as HTMLElement).style.opacity = '1';
      (loadingEl as HTMLElement).style.transition = 'opacity 0.5s ease-out';
      
      setTimeout(() => {
        (loadingEl as HTMLElement).style.opacity = '0';
        setTimeout(() => {
          // 移除 loading 界面
          loadingEl.remove();
          
          // 显示 viewer 容器
          const viewerContainer = this.contentContainer.querySelector('.xmind-viewer-content-inner') as HTMLElement;
          if (viewerContainer) {
            viewerContainer.style.display = 'block';
            // 添加淡入动画
            viewerContainer.style.opacity = '0';
            viewerContainer.style.transition = 'opacity 0.3s ease-in';
            setTimeout(() => {
              viewerContainer.style.opacity = '1';
            }, 50);
          }
          
          console.log('加载界面已隐藏，viewer 已显示');
          
          // 触发 viewer 重新调整大小
          this.resizeViewer();
          
          // 调整 XMind 内置工具栏位置
          this.adjustXMindToolbar();
        }, 500);
      }, 300);
    }
  }

  /**
   * 调整 XMind 内置工具栏位置
   */
  private adjustXMindToolbar(): void {
    // 延迟执行，确保 XMind 内容已完全加载
    setTimeout(() => {
      const container = this.contentContainer.querySelector('.xmind-viewer-content-inner');
      if (!container) return;

      // 查找所有可能的工具栏元素
      const toolbarSelectors = [
        '[class*="toolbar"]',
        '[class*="control"]',
        '[style*="position: fixed"]',
        '[style*="position: absolute"]',
        '[style*="bottom"]'
      ];

      toolbarSelectors.forEach(selector => {
        const elements = container.querySelectorAll(selector);
        elements.forEach((element: HTMLElement) => {
          if (element.style.bottom || element.style.position === 'fixed' || element.style.position === 'absolute') {
            element.style.bottom = '80px';
            element.style.zIndex = '999';
            console.log('调整了 XMind 工具栏位置:', element);
          }
        });
      });

      // 使用 MutationObserver 监听动态添加的工具栏
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;
              if (element.style && (element.style.position === 'fixed' || element.style.position === 'absolute')) {
                if (element.style.bottom) {
                  element.style.bottom = '80px';
                  element.style.zIndex = '999';
                  console.log('动态调整了 XMind 工具栏位置:', element);
                }
              }
            }
          });
        });
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style']
      });

      // 5秒后停止监听
      setTimeout(() => observer.disconnect(), 5000);
    }, 1000);
  }

  /**
   * 调整查看器大小
   */
  private resizeViewer(): void {
    if (!this.viewer) return;
    
    try {
      // 尝试调用 viewer 的 resize 方法
      if (typeof this.viewer.resize === 'function') {
        this.viewer.resize();
        console.log('viewer 大小已调整');
      }
      
      // 尝试调用 setFitMap 方法来适应窗口
      if (typeof this.viewer.setFitMap === 'function') {
        setTimeout(() => {
          this.viewer.setFitMap();
          console.log('viewer 已适应窗口大小');
        }, 100);
      }
    } catch (error) {
      console.log('调整 viewer 大小时发生错误:', error);
    }
  }

  /**
   * 设置查看器事件
   */
  private setupViewerEvents(): void {
    if (!this.viewer) return;

    this.viewer.addEventListener('map-ready', () => {
      console.log('XMind 地图已加载');
      // 地图准备就绪，隐藏加载状态
      this.hideLoadingState();
      
      // 确保 viewer 适应窗口大小
      setTimeout(() => {
        this.resizeViewer();
      }, 200);
    });

    this.viewer.addEventListener('zoom-change', (payload: any) => {
      console.log('缩放变化:', payload);
    });

    this.viewer.addEventListener('sheet-switch', (payload: any) => {
      console.log('工作表切换:', payload);
      // 工作表切换完成，确保加载状态已隐藏
      this.hideLoadingState();
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
        text: i18n.t('viewer.openInSystem'),
        cls: 'xmind-system-open-btn'
      });

      openSystemButton.addEventListener('click', () => {
        this.openInSystem();
      });
    }

    // 适应窗口按钮
    const fitButton = toolbar.createEl('button', {
      text: i18n.t('viewer.fitWindow'),
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
      text: i18n.t('viewer.loadingFile'),
      cls: 'xmind-loading-text'
    });
    
    // 进度条容器
    const progressContainer = loadingContainer.createDiv({
      cls: 'xmind-loading-progress'
    });
    
    // 进度条
    progressContainer.createDiv({
      cls: 'xmind-loading-progress-bar'
    });
    
    // 提示文本
    const tipContainer = loadingContainer.createDiv({
      cls: 'xmind-loading-tips'
    });
    
    tipContainer.createDiv({
      text: i18n.t('viewer.loadingTips.firstLoad'),
      cls: 'xmind-loading-tip'
    });
  }

  /**
   * 显示错误状态
   */
  private showErrorState(message: string): void {
    this.viewerContainer.empty();
    this.viewerContainer.createDiv({
      text: `${i18n.t('viewer.loadingFailed')}: ${message}`,
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
      console.error(i18n.t('errors.systemOpenFailed'), error);
    }
  }
} 