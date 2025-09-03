import { ItemView, WorkspaceLeaf, TFile } from 'obsidian';
import { XMindParser } from '../file-handler/xmind-parser';
import { i18n } from '../core/i18n';
import { SystemUtils } from '../utils/system-utils';
import type { XMindViewerSettings, XMindEmbedViewer, XMindEmbedViewerConstructor, WorkspaceLeafExtended, ViewState, ViewResult, ObsidianVaultAdapter, ObsidianWindow } from '../types';
import type { ViewStateResult } from 'obsidian';
import { Notice } from 'obsidian';
import * as XMindEmbedViewerLib from 'xmind-embed-viewer';

export const XMIND_VIEW_TYPE = 'xmind-viewer';

export class XMindView extends ItemView {
  private xmindFile: TFile | null = null;
  private settings: XMindViewerSettings;
  private viewerContainer: HTMLElement;
  private contentContainer: HTMLElement;
  private viewer: XMindEmbedViewer | null = null;
  private isLoading = false;
  private loadingProgress = 0;
  private static viewerLibLoaded = false;
  private static viewerLibPromise: Promise<XMindEmbedViewer> | null = null;
  private eventHandlers: { [key: string]: (...args: any[]) => void } = {};

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
    const leafExtended = this.leaf as WorkspaceLeafExtended;
    const leafFile = leafExtended.file;
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
    const state = leafExtended.getViewState?.();
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
  getState(): ViewState {
    return {
      file: this.xmindFile?.path || null
    };
  }

  /**
   * 设置视图状态
   */
  async setState(state: unknown, result: ViewStateResult): Promise<void> {
    const viewState = state as ViewState;
    const viewResult = result as ViewResult;
    
    if (viewState && viewState.file) {
      const file = this.app.vault.getAbstractFileByPath(viewState.file);
      if (file instanceof TFile && file.extension === 'xmind') {
        await this.setXMindFile(file);
      }
    }
    
    // 处理直接文件关联的情况
    if (viewResult && viewResult.file) {
      const file = this.app.vault.getAbstractFileByPath(viewResult.file);
      if (file instanceof TFile && file.extension === 'xmind') {
        await this.setXMindFile(file);
      }
    }
    
    // 调用父类方法
    return super.setState(state, result);
  }

  async onClose(): Promise<void> {
    // 清理查看器
    if (this.viewer) {
      // 移除所有事件监听器
      try {
        if (this.eventHandlers['map-ready']) {
          this.viewer.removeEventListener('map-ready', this.eventHandlers['map-ready']);
        }
        if (this.eventHandlers['zoom-change']) {
          this.viewer.removeEventListener('zoom-change', this.eventHandlers['zoom-change']);
        }
        if (this.eventHandlers['sheet-switch']) {
          this.viewer.removeEventListener('sheet-switch', this.eventHandlers['sheet-switch']);
        }
      } catch (error) {
        // 忽略清理错误
      }
      
      this.viewer = null;
    }
    
    // 清理事件处理器
    this.eventHandlers = {};
    
    // 清理可能的 window 全局引用
    if (typeof window !== 'undefined') {
      const obsidianWindow = window as ObsidianWindow;
      if (obsidianWindow.XMindEmbedViewer) {
        try {
          delete obsidianWindow.XMindEmbedViewer;
        } catch (error) {
          // 在某些环境下可能无法删除，静默处理
        }
      }
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
      this.updateLoadingProgress(i18n.t('viewer.loadingFile'), 20);
      const buffer = await this.app.vault.adapter.readBinary(file.path);

      
      // 验证文件
      this.updateLoadingProgress(i18n.t('viewer.progress.validating'), 40);
      if (!(await XMindParser.isValidXMindFile(buffer))) {
        throw new Error(i18n.t('errors.invalidXMindFile'));
      }
      // 等待查看器库加载
      this.updateLoadingProgress(i18n.t('viewer.progress.loadingViewer'), 60);
      const XMindEmbedViewerLib = await this.getXMindEmbedViewer();
      
      // 创建查看器容器（不清空 contentContainer，因为它包含 loading 界面）
      this.updateLoadingProgress(i18n.t('viewer.progress.initializing'), 80);
      
      // 创建隐藏的 viewer 容器
      const viewerContainer = this.contentContainer.createDiv({
        cls: 'xmind-viewer-content-inner xmind-hidden'
      });
      
      this.viewer = new XMindEmbedViewerLib.XMindEmbedViewer({
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
      return XMindEmbedViewerLib;
    }
    
    if (XMindView.viewerLibPromise) {
      return await XMindView.viewerLibPromise;
    }
    
    return await this.loadXMindEmbedViewer();
  }

  /**
   * 加载 XMind Embed Viewer（使用本地依赖）
   */
  private async loadXMindEmbedViewer(): Promise<any> {
    try {
      // 使用本地导入的库
      XMindView.viewerLibLoaded = true;
      return XMindEmbedViewerLib;
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
    const progressBar = this.contentContainer.querySelector('.xmind-loading-progress-bar') as HTMLElement;
    
    if (loadingEl) {
      loadingEl.textContent = message;
    }
    
    if (progressBar) {
      // 移除所有进度类
      progressBar.className = progressBar.className.replace(/xmind-progress-\d+/g, '');
      // 添加对应的进度类
      const progressClass = `xmind-progress-${Math.round(progress / 5) * 5}`;
      progressBar.classList.add(progressClass);
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
          // 检查是否可能是工具栏元素，避免直接访问 style 属性
          if (element.className.includes('toolbar') || 
              element.className.includes('control') || 
              element.hasAttribute('style')) {
            // 添加工具栏调整类，让CSS处理定位
            element.classList.add('xmind-toolbar-adjusted');
          }
        });
      });

      // 使用 MutationObserver 监听动态添加的工具栏
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;
              // 检查是否可能是工具栏元素，避免直接访问样式属性
              if (element.className.includes('toolbar') || 
                  element.className.includes('control') || 
                  element.hasAttribute('style')) {
                // 添加工具栏调整类，让CSS处理定位
                element.classList.add('xmind-toolbar-adjusted');
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

    // 使用存储的事件处理器，以便正确移除
    this.eventHandlers['map-ready'] = () => {
      // 地图准备就绪，隐藏加载状态
      this.hideLoadingState();
      
      // 确保 viewer 适应窗口大小
      setTimeout(() => {
        this.resizeViewer();
      }, 200);
    };

    this.eventHandlers['zoom-change'] = (payload: any) => {
      // 缩放变化处理
    };

    this.eventHandlers['sheet-switch'] = (payload: any) => {
      // 工作表切换完成，确保加载状态已隐藏
      this.hideLoadingState();
    };

    // 添加事件监听器
    this.viewer.addEventListener('map-ready', this.eventHandlers['map-ready']);
    this.viewer.addEventListener('zoom-change', this.eventHandlers['zoom-change']);
    this.viewer.addEventListener('sheet-switch', this.eventHandlers['sheet-switch']);
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
        if (this.viewer) {
          // 使用无闪烁的最优方案
          this.centerViewContentNoFlicker();
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
   * 智能打开XMind文件（优先使用XMind应用，备选系统默认应用）
   */
  private async openInSystem(): Promise<void> {
    if (!this.xmindFile) return;

    // 显示检测中的提示
    let detectingNotice = new Notice(i18n.t('messages.xmindAppDetecting'), 0);
    
    try {
      const adapter = this.app.vault.adapter as unknown as ObsidianVaultAdapter;
      const filePath = adapter.path.join(
        adapter.basePath, 
        this.xmindFile.path
      );
      
      // 检测XMind应用
      const xmindApp = await SystemUtils.detectXMindApp();
      detectingNotice.hide();
      
      if (xmindApp.found) {
        // 找到XMind应用，使用XMind打开
        const appDescription = SystemUtils.getXMindAppDescription(xmindApp);
        new Notice(`${i18n.t('messages.xmindAppFound')}: ${appDescription}`, 2000);
        
        // 显示正在用XMind打开的提示
        const openingNotice = new Notice(i18n.t('messages.openingWithXMind'), 0);
        
        try {
          const success = await SystemUtils.openWithXMind(filePath);
          openingNotice.hide();
          
          if (success) {
            new Notice(i18n.t('messages.xmindOpenSuccess'), 3000);
            return;
          } else {
            throw new Error('XMind打开失败');
          }
        } catch (xmindError) {
          openingNotice.hide();
          console.warn('XMind打开失败，尝试系统默认应用:', xmindError);
          new Notice(i18n.t('messages.xmindOpenFailed'), 3000);
        }
      } else {
        // 未找到XMind应用
        new Notice(i18n.t('messages.xmindAppNotFound'), 3000);
      }
      
      // 使用系统默认应用作为备选方案
      new Notice(i18n.t('messages.openingWithSystemApp'), 2000);
      await this.app.openWithDefaultApp(filePath);
      
      // 成功打开，显示成功通知
      new Notice(i18n.t('messages.systemOpenSuccess'), 3000);
      
    } catch (error) {
      // 隐藏所有之前的通知
      detectingNotice?.hide();
      
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
   * 100%大小并居中显示
   */
  private centerViewContentNoFlicker(): void {
    try {
      if (!this.viewer) {
        return;
      }

      // 检查是否已经是100%缩放，避免不必要的操作
      if (typeof this.viewer.getZoomScale === 'function') {
        const currentZoom = this.viewer.getZoomScale();
        if (Math.abs(currentZoom - 100) < 1) {
          // 已经是100%，只需要居中
          if (typeof this.viewer.setFitMap === 'function') {
            this.viewer.setFitMap();
            // 立即恢复到100%
            setTimeout(() => this.viewer.setZoomScale(100), 1);
          }
          return;
        }
      }

      // 使用单次API调用实现居中和缩放
      if (typeof this.viewer.setFitMap === 'function' && typeof this.viewer.setZoomScale === 'function') {
        // 同步调用，最小化视觉变化
        this.viewer.setFitMap();
        this.viewer.setZoomScale(100);
      }
      
    } catch (error) {
      console.error('无闪烁居中失败:', error);
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
      }
    } catch (error) {
      console.error('移除居中模式失败:', error);
    }
  }
} 