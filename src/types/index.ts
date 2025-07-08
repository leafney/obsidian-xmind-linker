export interface XMindData {
  content: string;
  thumbnail?: ArrayBuffer;
  sheets: XMindSheet[];
}

export interface XMindSheet {
  id: string;
  title: string;
  rootTopic: XMindTopic;
}

export interface XMindTopic {
  id: string;
  title: string;
  children?: XMindTopic[];
  notes?: string;
  labels?: string[];
}

export interface XMindViewerSettings {
  enableThumbnailExtraction: boolean;
  defaultRegion: 'global' | 'cn';
  enableSystemIntegration: boolean;
  thumbnailCacheDir: string;
  language: 'en' | 'zh-cn';
  thumbnailMaxWidth: number;
  thumbnailMaxHeight: number;
  thumbnailQuality: 'low' | 'medium' | 'high';
  enableThumbnailFallback: boolean;
  showThumbnailLoadingIndicator: boolean;
  maxCacheSize: number;
}

export interface XMindEmbedOptions {
  width?: string;
  height?: string;
  showControls?: boolean;
  allowFullscreen?: boolean;
}

export interface ThumbnailCache {
  [filePath: string]: {
    thumbnailPath: string;
    lastModified: number;
    size?: number;
  };
}

export interface ThumbnailExtractionResult {
  success: boolean;
  thumbnailPath?: string;
  error?: string;
  fallbackUsed?: boolean;
}

export interface ThumbnailDisplayState {
  loading: boolean;
  error: boolean;
  fallback: boolean;
}

// 详细的缓存统计信息接口
export interface DetailedCacheStats {
  // 记录在 cache.json 中的缓存统计
  recorded: {
    count: number;
    size: number; // MB
  };
  // 实际缓存目录中的文件统计
  actual: {
    count: number;
    size: number; // MB
  };
  // 孤立的缓存文件统计（存在于目录但未记录在 cache.json 中）
  orphaned: {
    count: number;
    size: number; // MB
    files: string[]; // 孤立文件的路径列表
  };
}

// 简化的缓存统计信息接口（向后兼容）
export interface CacheStats {
  count: number;
  size: number;
} 