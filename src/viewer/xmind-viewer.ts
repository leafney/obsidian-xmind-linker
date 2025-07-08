import { ItemView, WorkspaceLeaf, TFile } from 'obsidian';
import { XMindParser } from '../file-handler/xmind-parser';
import { i18n } from '../core/i18n';
import type { XMindViewerSettings } from '../types';
import { Notice } from 'obsidian';

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
      await this.loadXMindFile(this.xmindFile);
      return;
    }

    // 尝试从 leaf 获取文件信息（这是 Obsidian 文件关联的标准方式）
    const leafFile = (this.leaf as any).file;
    if (leafFile && leafFile instanceof TFile && leafFile.extension === 'xmind') {
      await this.setXMindFile(leafFile);
      return;
    }

    // 尝试从当前活动文件获取
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile && activeFile.extension === 'xmind') {
      await this.setXMindFile(activeFile);
      return;
    }

    // 尝试从 leaf 的状态获取文件信息
    const state = (this.leaf as any).getViewState?.();
    if (state && state.state && state.state.file) {
      const file = this.app.vault.getAbstractFileByPath(state.state.file);
      if (file instanceof TFile && file.extension === 'xmind') {
        await this.setXMindFile(file);
        return;
      }
    }
    
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
    if (state && state.file) {
      const file = this.app.vault.getAbstractFileByPath(state.file);
      if (file instanceof TFile && file.extension === 'xmind') {
        await this.setXMindFile(file);
      }
    }
    
    // 处理直接文件关联的情况
    if (result && result.file) {
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
    await this.setXMindFile(file);
  }

  /**
   * 当文件从视图中卸载时调用
   */
  async onUnloadFile(file: TFile): Promise<void> {
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
      

      
      // 显示加载状态
      this.showLoadingState();

      // 更新窗口标题
      this.updateTitle();

      // 读取文件
      this.updateLoadingProgress('读取文件中...', 20);
      const buffer = await this.app.vault.adapter.readBinary(file.path);

      
      // 验证文件
      this.updateLoadingProgress(i18n.t('viewer.progress.validating'), 40);
      if (!(await XMindParser.isValidXMindFile(buffer))) {
        throw new Error(i18n.t('errors.invalidXMindFile'));
      }
      // 等待查看器库加载
      this.updateLoadingProgress(i18n.t('viewer.progress.loadingViewer'), 60);
      const XMindEmbedViewer = await this.getXMindEmbedViewer();
      
      // 创建查看器容器（不清空 contentContainer，因为它包含 loading 界面）
      this.updateLoadingProgress(i18n.t('viewer.progress.initializing'), 80);
      
      // 创建隐藏的 viewer 容器
      const viewerContainer = this.contentContainer.createDiv({
        cls: 'xmind-viewer-content-inner xmind-hidden'
      });
      
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

      // 加载文件
      this.updateLoadingProgress(i18n.t('viewer.progress.rendering'), 90);
      await this.viewer.load(buffer);

      // 添加事件监听
      this.setupViewerEvents();

      this.updateLoadingProgress(i18n.t('viewer.progress.completing'), 95);
      
      // 不再自动隐藏加载状态，等待 map-ready 事件
      // 设置一个备用超时，防止事件没有触发
      setTimeout(() => {
        if (this.contentContainer.querySelector('.xmind-loading')) {
          this.hideLoadingState();
        }
      }, 15000); // 15秒超时

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
        XMindView.viewerLibLoaded = true;
        return (window as any).XMindEmbedViewer;
      }
      
      // 尝试从 CDN 加载
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/xmind-embed-viewer/dist/umd/xmind-embed-viewer.js';
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(i18n.t('errors.viewerLibraryTimeout')));
        }, 30000); // 30秒超时
        
        script.onload = () => {
          clearTimeout(timeout);
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
        progressBar.classList.add('xmind-progress-100');
      }
      
      if (loadingText) {
        loadingText.textContent = i18n.t('viewer.loadingComplete');
      }
      
      // 添加淡出动画
      (loadingEl as HTMLElement).classList.add('xmind-fade-out');
      
      setTimeout(() => {
        (loadingEl as HTMLElement).classList.add('xmind-fading');
        setTimeout(() => {
          // 移除 loading 界面
          loadingEl.remove();
          
          // 显示 viewer 容器
          const viewerContainer = this.contentContainer.querySelector('.xmind-viewer-content-inner') as HTMLElement;
          if (viewerContainer) {
            viewerContainer.classList.remove('xmind-hidden');
            viewerContainer.classList.add('xmind-fade-in');
            setTimeout(() => {
              viewerContainer.classList.add('xmind-fading-in');
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
            if (element.style.position === 'fixed') {
              element.classList.add('xmind-toolbar-positioned');
            } else {
              element.classList.add('xmind-toolbar-absolute');
            }

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
                  if (element.style.position === 'fixed') {
                    element.classList.add('xmind-toolbar-positioned');
                  } else {
                    element.classList.add('xmind-toolbar-absolute');
                  }

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
      }
      
      // 尝试调用 setFitMap 方法来适应窗口
      if (typeof this.viewer.setFitMap === 'function') {
        setTimeout(() => {
          this.viewer.setFitMap();
        }, 100);
      }
    } catch (error) {
      // 调整大小失败，静默处理
    }
  }

  /**
   * 设置查看器事件
   */
  private setupViewerEvents(): void {
    if (!this.viewer) return;

    this.viewer.addEventListener('map-ready', () => {
      // 地图准备就绪，隐藏加载状态
      this.hideLoadingState();
      
      // 确保 viewer 适应窗口大小
      setTimeout(() => {
        this.resizeViewer();
      }, 200);
    });

    this.viewer.addEventListener('zoom-change', (payload: any) => {
      // 缩放变化处理
    });

    this.viewer.addEventListener('sheet-switch', (payload: any) => {
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
      const openSystemButton = this.createIconButton(
        toolbar,
        'external-link',
        i18n.t('viewer.openInSystem'),
        () => this.openInSystem()
      );
      openSystemButton.addClass('xmind-system-open-btn');
    }

    // 适应窗口按钮
    const fitButton = this.createIconButton(
      toolbar,
      'maximize-2',
      i18n.t('viewer.fitWindow'),
      () => {
        if (this.viewer && typeof this.viewer.setFitMap === 'function') {
          // 移除居中模式，恢复适应窗口
          this.removeCenterMode();
          this.viewer.setFitMap();
        }
      }
    );
    fitButton.addClass('xmind-fit-btn');

    // 100%大小按钮
    const actualSizeButton = this.createIconButton(
      toolbar,
      'eye',
      i18n.t('viewer.actualSize'),
      () => {
        if (this.viewer && typeof this.viewer.setZoomScale === 'function') {
          // 移除居中模式，只设置缩放为 100%
          this.removeCenterMode();
          this.viewer.setZoomScale(100);
          

        }
      }
    );
    actualSizeButton.addClass('xmind-actual-size-btn');

    // 100%大小并居中按钮
    const actualSizeCenterButton = this.createIconButton(
      toolbar,
      'crosshair',
      i18n.t('viewer.actualSizeCenter'),
      () => {
        if (this.viewer && typeof this.viewer.setZoomScale === 'function') {
          // 设置缩放为 100%
          this.viewer.setZoomScale(100);
          
          // 使用隐藏过渡方案进行居中
          this.centerViewContent();
          

        }
      }
    );
    actualSizeCenterButton.addClass('xmind-actual-size-center-btn');

    // 刷新按钮
    const refreshButton = this.createIconButton(
      toolbar,
      'refresh-cw',
      i18n.t('viewer.refresh'),
      () => this.refreshViewer()
    );
    refreshButton.addClass('xmind-refresh-btn');
  }

  /**
   * 创建图标按钮
   */
  private createIconButton(
    parent: HTMLElement,
    iconName: string,
    tooltip: string,
    onClick: () => void
  ): HTMLElement {
    const button = parent.createEl('button', {
      cls: 'xmind-icon-btn'
    });

    // 创建图标
    const icon = button.createEl('span', {
      cls: `xmind-icon lucide-${iconName}`
    });

    // 设置 tooltip - 使用原生 title 属性
    button.setAttribute('aria-label', tooltip);
    button.setAttribute('title', tooltip);

    // 添加点击事件
    button.addEventListener('click', onClick);

    return button;
  }

  /**
   * 刷新查看器
   */
  private refreshViewer(): void {
    if (!this.xmindFile) return;


    
    // 重新加载文件
    this.loadXMindFile(this.xmindFile);
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
   * 居中显示查看器内容（隐藏过渡方案）
   */
  private centerViewContent(): void {
    try {
      const container = this.contentContainer.querySelector('.xmind-viewer-content-inner') as HTMLElement;
      if (!container) {
        return;
      }

      if (!this.viewer) {
        return;
      }

      // 方案：隐藏过渡过程，避免闪烁
      // 1. 临时隐藏 viewer 内容
      const originalOpacity = container.style.opacity;
      container.style.transition = 'opacity 0.01s ease';
      container.style.opacity = '0';

      // 2. 执行API调用
      setTimeout(() => {
        if (typeof this.viewer.setFitMap === 'function') {
          this.viewer.setFitMap();

          // 3. 设置回100%缩放
          setTimeout(() => {
            if (typeof this.viewer.setZoomScale === 'function') {
              this.viewer.setZoomScale(100);

              // 4. 显示内容
              setTimeout(() => {
                container.style.opacity = originalOpacity || '1';
              }, 50);
            }
          }, 50);
        }
      }, 100);
      
    } catch (error) {
      console.error('居中显示失败:', error);
      // 确保在出错时恢复显示
      const container = this.contentContainer.querySelector('.xmind-viewer-content-inner') as HTMLElement;
      if (container) {
        container.style.opacity = '1';
      }
    }
  }

  /**
   * 智能居中显示（备选方案，包含API增强）
   * 这个方法会检查当前缩放状态，避免不必要的缩放变化
   */
  private centerViewContentWithAPI(): void {
    try {
      const container = this.contentContainer.querySelector('.xmind-viewer-content-inner') as HTMLElement;
      if (!container) {
        console.log('未找到内容容器，无法居中');
        return;
      }

      // 先应用 CSS 居中
      container.classList.add('centered');
      console.log('已应用居中样式');

      // 智能API调用：只有在当前缩放不是100%时才使用API增强
      if (this.viewer && typeof this.viewer.getZoomScale === 'function') {
        const currentZoom = this.viewer.getZoomScale();
        console.log('当前缩放比例:', currentZoom);
        
        // 如果当前缩放已经是100%，就不需要API调用
        if (Math.abs(currentZoom - 100) < 1) {
          console.log('缩放已经是100%，跳过API调用');
          return;
        }
      }

      // 如果需要API增强，使用更温和的方法
      if (this.viewer && typeof this.viewer.setFitMap === 'function') {
        setTimeout(() => {
          try {
            // 记录调用前的缩放
            const beforeZoom = this.viewer.getZoomScale?.() || 100;
            this.viewer.setFitMap();
            
            // 延迟恢复到100%
            setTimeout(() => {
              if (typeof this.viewer.setZoomScale === 'function') {
                this.viewer.setZoomScale(100);
                console.log(`从 ${beforeZoom}% 恢复到 100% 缩放`);
              }
            }, 50); // 减少延迟时间
          } catch (error) {
            console.log('API增强调用失败:', error);
          }
        }, 100); // 减少延迟时间
      }
      
    } catch (error) {
      console.error('智能居中显示失败:', error);
    }
  }

  /**
   * 基于事件监听的居中方法（最优化方案）
   */
  private centerViewContentEventBased(): void {
    try {
      const container = this.contentContainer.querySelector('.xmind-viewer-content-inner') as HTMLElement;
      if (!container || !this.viewer) {
        console.log('容器或viewer未准备好');
        return;
      }

      console.log('开始事件驱动的居中操作');

      // 设置事件监听器，监听缩放变化
      let zoomChangeCount = 0;
      const targetZoomChanges = 2; // 预期的缩放变化次数

      const zoomChangeHandler = (event: any) => {
        zoomChangeCount++;
        console.log(`缩放变化 ${zoomChangeCount}/${targetZoomChanges}:`, event);

        if (zoomChangeCount === targetZoomChanges) {
          // 移除事件监听器
          this.viewer.removeEventListener('zoom-change', zoomChangeHandler);
          console.log('居中操作完成（事件驱动）');
        }
      };

      // 添加临时事件监听器
      this.viewer.addEventListener('zoom-change', zoomChangeHandler);

      // 执行居中操作
      if (typeof this.viewer.setFitMap === 'function') {
        this.viewer.setFitMap();
        
        // 短暂延迟后设置100%
        setTimeout(() => {
          if (typeof this.viewer.setZoomScale === 'function') {
            this.viewer.setZoomScale(100);
          }
        }, 30);
      }

      // 设置超时清理，防止事件监听器泄漏
      setTimeout(() => {
        if (zoomChangeCount < targetZoomChanges) {
          this.viewer.removeEventListener('zoom-change', zoomChangeHandler);
          console.log('事件监听器已超时清理');
        }
      }, 2000);
      
    } catch (error) {
      console.error('事件驱动居中失败:', error);
    }
  }

  /**
   * 快速切换方案（最小化闪烁）
   */
  private centerViewContentFastSwitch(): void {
    try {
      if (!this.viewer) {
        console.log('viewer 未初始化');
        return;
      }

      console.log('开始快速切换居中操作');

      // 使用最短延迟进行快速切换
      if (typeof this.viewer.setFitMap === 'function' && typeof this.viewer.setZoomScale === 'function') {
        // 立即调用setFitMap
        this.viewer.setFitMap();
        
        // 使用requestAnimationFrame确保在下一帧立即设置100%
        requestAnimationFrame(() => {
          this.viewer.setZoomScale(100);
          console.log('快速切换完成');
        });
      }
      
    } catch (error) {
      console.error('快速切换居中失败:', error);
    }
  }

  /**
   * 移除居中显示模式
   */
  private removeCenterMode(): void {
    try {
      const container = this.contentContainer.querySelector('.xmind-viewer-content-inner') as HTMLElement;
      if (container) {
        container.classList.remove('centered');
        console.log('已移除居中样式');
      }
    } catch (error) {
      console.error('移除居中模式失败:', error);
    }
  }
} 