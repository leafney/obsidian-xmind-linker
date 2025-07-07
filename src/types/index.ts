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
  showHoverTooltip: boolean;
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