export type SupportedLanguage = 'en' | 'zh-cn';

export interface I18nTexts {
  // 设置面板
  settings: {
    title: string;
    enableThumbnailExtraction: {
      name: string;
      desc: string;
    };
    defaultRegion: {
      name: string;
      desc: string;
    };

    enableSystemIntegration: {
      name: string;
      desc: string;
    };
    thumbnailCacheDir: {
      name: string;
      desc: string;
    };
    language: {
      name: string;
      desc: string;
    };
    regionOptions: {
      global: string;
      cn: string;
    };
    languageOptions: {
      en: string;
      'zh-cn': string;
    };
    // 新增缩略图设置
    thumbnailSettings: {
      groupTitle: string;
      enableThumbnailFallback: {
        name: string;
        desc: string;
      };
      showThumbnailLoadingIndicator: {
        name: string;
        desc: string;
      };
      thumbnailMaxWidth: {
        name: string;
        desc: string;
      };
      thumbnailMaxHeight: {
        name: string;
        desc: string;
      };
      thumbnailQuality: {
        name: string;
        desc: string;
        options: {
          low: string;
          medium: string;
          high: string;
        };
      };
      maxCacheSize: {
        name: string;
        desc: string;
      };
      cacheStats: {
        name: string;
        desc: string;
        buttonText: string;
        buttonTooltip: string;
      };
    };
    otherSettings: {
      groupTitle: string;
    };
  };
  
  // 命令
  commands: {
    extractThumbnail: string;
    cleanupCache: string;
  };
  
  // 消息提示
  messages: {
    pluginLoaded: string;
    pluginUnloaded: string;
    fileNotFound: string;
    processEmbedFailed: string;
    cacheCleanupComplete: string;
    thumbnailExtracted: string;
    systemOpenFailed: string;
    systemOpenSuccess: string;
    unsupportedFile: string;
    openInXMind: string;
    extractThumbnail: string;
    viewInPlugin: string;
  };

  // 查看器界面
  viewer: {
    title: string;
    noFileSelected: string;
    loadingFile: string;
    loadingLibrary: string;
    initializingViewer: string;
    rendering: string;
    waitingForRender: string;
    loadingComplete: string;
    loadingFailed: string;
    openInSystem: string;
    fitWindow: string;
    actualSize: string;
    refresh: string;
    loadingTips: {
      firstLoad: string;
      preparingFile: string;
      initializingViewer: string;
      renderingMap: string;
      almostDone: string;
    };
    progress: {
      validating: string;
      loadingViewer: string;
      initializing: string;
      rendering: string;
      completing: string;
    };
  };
  
  // 错误信息
  errors: {
    fileNotFound: string;
    processEmbedFailed: string;
    thumbnailExtractionFailed: string;
    systemOpenFailed: string;
    systemOpenNoApp: string;
    systemOpenPermissionDenied: string;
    unsupportedFileFormat: string;
    invalidXMindFile: string;
    viewerLibraryTimeout: string;
    viewerLibraryUnavailable: string;
    viewerLibraryLoadFailed: string;
    cannotLoadViewerLibrary: string;
  };
}

// 英文语言包
const EN_TEXTS: I18nTexts = {
  settings: {
    title: 'XMind Linker Settings',
    enableThumbnailExtraction: {
      name: 'Enable Thumbnail Extraction',
      desc: 'Automatically extract thumbnails from XMind files for preview'
    },
    defaultRegion: {
      name: 'Default Region',
      desc: 'Choose the default region for XMind viewer (affects loading speed)'
    },
    enableSystemIntegration: {
      name: 'Enable System Integration',
      desc: 'Allow opening XMind files with system default application'
    },
    thumbnailCacheDir: {
      name: 'Thumbnail Cache Directory',
      desc: 'Directory name for storing extracted thumbnails'
    },
    language: {
      name: 'Language',
      desc: 'Choose the interface language'
    },
    regionOptions: {
      global: 'Global',
      cn: 'China Mainland'
    },
    languageOptions: {
      en: 'English',
      'zh-cn': '简体中文'
    },
    // 新增缩略图设置
    thumbnailSettings: {
      groupTitle: 'Thumbnail Settings',
      enableThumbnailFallback: {
        name: 'Enable Thumbnail Fallback',
        desc: 'Show default icon when thumbnail extraction fails'
      },
      showThumbnailLoadingIndicator: {
        name: 'Show Loading Indicator',
        desc: 'Display loading animation during thumbnail extraction'
      },
      thumbnailMaxWidth: {
        name: 'Thumbnail Max Width',
        desc: 'Maximum width for extracted thumbnails (pixels)'
      },
      thumbnailMaxHeight: {
        name: 'Thumbnail Max Height',
        desc: 'Maximum height for extracted thumbnails (pixels)'
      },
      thumbnailQuality: {
        name: 'Thumbnail Quality',
        desc: 'Quality level for extracted thumbnails',
        options: {
          low: 'Low (Faster)',
          medium: 'Medium (Balanced)',
          high: 'High (Clearer)'
        }
      },
      maxCacheSize: {
        name: 'Max Cache Size',
        desc: 'Maximum size for thumbnail cache (MB)'
      },
      cacheStats: {
        name: 'Cache Statistics',
        desc: 'Current cache: {count} files, {size} MB',
        buttonText: 'Clear All Cache',
        buttonTooltip: 'Delete all cached thumbnails'
      }
    },
    otherSettings: {
      groupTitle: 'Other Settings'
    }
  },
  commands: {
    extractThumbnail: 'Extract XMind Thumbnail',
    cleanupCache: 'Clean Thumbnail Cache'
  },
  messages: {
    pluginLoaded: 'XMind Linker plugin loaded',
    pluginUnloaded: 'XMind Linker plugin unloaded',
    fileNotFound: 'XMind file not found',
    processEmbedFailed: 'Failed to process XMind embed',
    cacheCleanupComplete: 'Cache cleanup completed',
    thumbnailExtracted: 'Thumbnail extracted successfully',
    systemOpenFailed: 'Failed to open with system application',
    systemOpenSuccess: 'Opened with system application',
    unsupportedFile: 'Unsupported file format',
    openInXMind: 'Open in XMind',
    extractThumbnail: 'Extract Thumbnail',
    viewInPlugin: 'View in Plugin'
  },
  viewer: {
    title: 'XMind Viewer',
    noFileSelected: 'Please select an XMind file to preview',
    loadingFile: 'Loading XMind file...',
    loadingLibrary: 'Loading XMind viewer library...',
    initializingViewer: 'Initializing viewer...',
    rendering: 'Rendering mind map...',
    waitingForRender: 'Waiting for rendering to complete...',
    loadingComplete: 'Loading complete!',
    loadingFailed: 'Loading failed',
    openInSystem: 'Open in XMind',
    fitWindow: 'Fit Window',
    actualSize: '100% Size',
    refresh: 'Refresh',
    loadingTips: {
      firstLoad: 'First load may take some time...',
      preparingFile: 'Preparing file and resources...',
      initializingViewer: 'Initializing viewer...',
      renderingMap: 'Rendering mind map...',
      almostDone: 'Almost done, please wait...'
    },
    progress: {
      validating: 'Validating file format...',
      loadingViewer: 'Loading viewer...',
      initializing: 'Initializing viewer...',
      rendering: 'Rendering mind map...',
      completing: 'Waiting for rendering to complete...'
    }
  },
  errors: {
    fileNotFound: 'Cannot find XMind file',
    processEmbedFailed: 'Failed to process XMind embed',
    thumbnailExtractionFailed: 'Failed to extract thumbnail',
    systemOpenFailed: 'Failed to open with system application',
    systemOpenNoApp: 'No system application found to open XMind file',
    systemOpenPermissionDenied: 'Permission denied to open XMind file with system application',
    unsupportedFileFormat: 'Unsupported file format',
    invalidXMindFile: 'Invalid XMind file',
    viewerLibraryTimeout: 'XMind viewer library loading timeout',
    viewerLibraryUnavailable: 'XMind viewer library unavailable after loading',
    viewerLibraryLoadFailed: 'Cannot load XMind viewer library from CDN',
    cannotLoadViewerLibrary: 'Cannot load XMind viewer library'
  }
};

// 中文语言包
const ZH_CN_TEXTS: I18nTexts = {
  settings: {
    title: 'XMind Linker 设置',
    enableThumbnailExtraction: {
      name: '启用缩略图提取',
      desc: '自动提取 XMind 文件中的缩略图用于预览'
    },
    defaultRegion: {
      name: '默认区域',
      desc: '选择 XMind 查看器的默认区域（影响加载速度）'
    },
    enableSystemIntegration: {
      name: '启用系统集成',
      desc: '允许通过系统默认应用打开 XMind 文件'
    },
    thumbnailCacheDir: {
      name: '缩略图缓存目录',
      desc: '存储提取的缩略图的目录名称'
    },
    language: {
      name: '语言',
      desc: '选择界面语言'
    },
    regionOptions: {
      global: '全球',
      cn: '中国大陆'
    },
    languageOptions: {
      en: 'English',
      'zh-cn': '简体中文'
    },
    // 新增缩略图设置
    thumbnailSettings: {
      groupTitle: '缩略图设置',
      enableThumbnailFallback: {
        name: '启用缩略图备用方案',
        desc: '当缩略图提取失败时显示默认图标'
      },
      showThumbnailLoadingIndicator: {
        name: '显示加载指示器',
        desc: '在缩略图提取过程中显示加载动画'
      },
      thumbnailMaxWidth: {
        name: '缩略图最大宽度',
        desc: '提取的缩略图的最大宽度（像素）'
      },
      thumbnailMaxHeight: {
        name: '缩略图最大高度',
        desc: '提取的缩略图的最大高度（像素）'
      },
      thumbnailQuality: {
        name: '缩略图质量',
        desc: '提取的缩略图的质量级别',
        options: {
          low: '低（更快速）',
          medium: '中（平衡）',
          high: '高（更清晰）'
        }
      },
      maxCacheSize: {
        name: '最大缓存大小',
        desc: '缩略图缓存的最大大小（MB）'
      },
      cacheStats: {
        name: '缓存统计',
        desc: '当前缓存: {count} 个文件, {size} MB',
        buttonText: '清理所有缓存',
        buttonTooltip: '删除所有缓存的缩略图'
      }
    },
    otherSettings: {
      groupTitle: '其他设置'
    }
  },
  commands: {
    extractThumbnail: '提取 XMind 缩略图',
    cleanupCache: '清理缩略图缓存'
  },
  messages: {
    pluginLoaded: '加载 XMind Linker 插件',
    pluginUnloaded: '卸载 XMind Linker 插件',
    fileNotFound: '未找到 XMind 文件',
    processEmbedFailed: '处理 XMind 嵌入失败',
    cacheCleanupComplete: '缓存清理完成',
    thumbnailExtracted: '缩略图提取成功',
    systemOpenFailed: '使用系统应用打开失败',
    systemOpenSuccess: '使用系统应用打开成功',
    unsupportedFile: '不支持的文件格式',
    openInXMind: '在 XMind 中打开',
    extractThumbnail: '提取缩略图',
    viewInPlugin: '在插件中查看'
  },
  viewer: {
    title: 'XMind 查看器',
    noFileSelected: '请选择一个 XMind 文件进行预览',
    loadingFile: '正在加载 XMind 文件...',
    loadingLibrary: '正在加载 XMind 查看器库...',
    initializingViewer: '正在初始化查看器...',
    rendering: '正在渲染思维导图...',
    waitingForRender: '等待渲染完成...',
    loadingComplete: '加载完成！',
    loadingFailed: '加载失败',
    openInSystem: '在 XMind 中打开',
    fitWindow: '适应窗口',
    actualSize: '100%大小',
    refresh: '刷新',
    loadingTips: {
      firstLoad: '首次加载可能需要一些时间...',
      preparingFile: '正在准备文件和资源...',
      initializingViewer: '正在初始化查看器...',
      renderingMap: '正在渲染思维导图...',
      almostDone: '即将完成，请稍候...'
    },
    progress: {
      validating: '验证文件格式...',
      loadingViewer: '加载查看器...',
      initializing: '初始化查看器...',
      rendering: '渲染思维导图...',
      completing: '等待渲染完成...'
    }
  },
  errors: {
    fileNotFound: '无法找到 XMind 文件',
    processEmbedFailed: '处理 XMind 嵌入失败',
    thumbnailExtractionFailed: '缩略图提取失败',
    systemOpenFailed: '使用系统应用打开失败',
    systemOpenNoApp: '没有找到可以打开 XMind 文件的系统应用',
    systemOpenPermissionDenied: '没有权限使用系统应用打开 XMind 文件',
    unsupportedFileFormat: '不支持的文件格式',
    invalidXMindFile: '无效的 XMind 文件',
    viewerLibraryTimeout: '加载 XMind 查看器库超时',
    viewerLibraryUnavailable: 'XMind 查看器库加载后不可用',
    viewerLibraryLoadFailed: '无法从 CDN 加载 XMind 查看器库',
    cannotLoadViewerLibrary: '无法加载 XMind 查看器库'
  }
};

// 语言包映射
const LANGUAGE_TEXTS: Record<SupportedLanguage, I18nTexts> = {
  'en': EN_TEXTS,
  'zh-cn': ZH_CN_TEXTS
};

/**
 * 国际化管理器
 */
export class I18nManager {
  private currentLanguage: SupportedLanguage = 'en';
  private texts: I18nTexts = EN_TEXTS;

  constructor(language?: SupportedLanguage) {
    if (language) {
      this.setLanguage(language);
    } else {
      // 自动检测语言
      this.detectLanguage();
    }
  }

  /**
   * 设置语言
   */
  setLanguage(language: SupportedLanguage): void {
    this.currentLanguage = language;
    this.texts = LANGUAGE_TEXTS[language];
  }

  /**
   * 获取当前语言
   */
  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  /**
   * 获取翻译文本
   */
  t(key: string): string {
    const keys = key.split('.');
    let result: any = this.texts;
    
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }
    
    return typeof result === 'string' ? result : key;
  }

  /**
   * 自动检测语言
   */
  private detectLanguage(): void {
    // 检测 Obsidian 的语言设置
    const obsidianLang = (window as any).moment?.locale?.() || 'en';
    
    // 检测浏览器语言
    const browserLang = navigator.language.toLowerCase();
    
    // 语言映射
    const langMap: Record<string, SupportedLanguage> = {
      'zh': 'zh-cn',
      'zh-cn': 'zh-cn',
      'zh-hans': 'zh-cn',
      'zh-sg': 'zh-cn',
      'en': 'en',
      'en-us': 'en',
      'en-gb': 'en'
    };
    
    // 优先使用 Obsidian 语言设置
    let detectedLang: SupportedLanguage = 'en';
    
    if (obsidianLang && langMap[obsidianLang]) {
      detectedLang = langMap[obsidianLang];
    } else if (browserLang && langMap[browserLang]) {
      detectedLang = langMap[browserLang];
    } else {
      // 检查是否包含中文字符
      for (const [key, value] of Object.entries(langMap)) {
        if (browserLang.includes(key)) {
          detectedLang = value;
          break;
        }
      }
    }
    
    this.setLanguage(detectedLang);
  }

  /**
   * 获取所有支持的语言
   */
  getSupportedLanguages(): Array<{code: SupportedLanguage, name: string}> {
    return [
      { code: 'en', name: this.texts.settings.languageOptions.en },
      { code: 'zh-cn', name: this.texts.settings.languageOptions['zh-cn'] }
    ];
  }
}

// 导出全局实例
export const i18n = new I18nManager(); 