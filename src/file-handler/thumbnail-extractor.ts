import { TFile, Vault } from 'obsidian';
import { XMindParser } from './xmind-parser';
import type { ThumbnailCache, ThumbnailExtractionResult, XMindViewerSettings } from '../types';

export class ThumbnailExtractor {
  private vault: Vault;
  private cacheDir: string;
  private cache: ThumbnailCache = {};
  private settings: XMindViewerSettings;

  constructor(vault: Vault, cacheDir: string, settings: XMindViewerSettings) {
    this.vault = vault;
    this.cacheDir = cacheDir;
    this.settings = settings;
  }

  /**
   * 提取并缓存 XMind 文件的缩略图
   */
  async extractThumbnail(file: TFile): Promise<ThumbnailExtractionResult> {
    try {
      const filePath = file.path;
      const lastModified = file.stat.mtime;

      // 检查缓存
      if (this.cache[filePath] && this.cache[filePath].lastModified >= lastModified) {
        const cachedPath = this.cache[filePath].thumbnailPath;
        if (await this.vault.adapter.exists(cachedPath)) {
          return {
            success: true,
            thumbnailPath: cachedPath
          };
        }
      }

      // 读取 XMind 文件
      const buffer = await this.vault.adapter.readBinary(filePath);
      
      // 解析并提取缩略图
      const parser = new XMindParser();
      const xmindData = await parser.parseXMindFile(buffer);

      if (!xmindData.thumbnail) {
        return {
          success: false,
          error: '文件中不包含缩略图',
          fallbackUsed: this.settings.enableThumbnailFallback
        };
      }

      // 确保缓存目录存在
      await this.ensureCacheDir();

      // 生成缩略图文件名
      const thumbnailFileName = this.generateThumbnailName(file);
      const thumbnailPath = `${this.cacheDir}/${thumbnailFileName}`;

      // 保存缩略图
      await this.vault.adapter.writeBinary(thumbnailPath, xmindData.thumbnail);

      // 获取文件大小用于缓存管理
      const fileSize = await this.getFileSize(thumbnailPath);

      // 更新缓存
      this.cache[filePath] = {
        thumbnailPath,
        lastModified,
        size: fileSize
      };

      // 检查缓存大小限制
      await this.manageCacheSize();

      // 保存缓存数据
      await this.saveCache();

      return {
        success: true,
        thumbnailPath
      };
    } catch (error) {
      console.error('提取缩略图失败:', error);
      return {
        success: false,
        error: error.message,
        fallbackUsed: this.settings.enableThumbnailFallback
      };
    }
  }

  /**
   * 生成缩略图文件名
   */
  private generateThumbnailName(file: TFile): string {
    const baseName = file.basename;
    const timestamp = file.stat.mtime;
    // 根据质量设置添加后缀
    const qualitySuffix = this.settings.thumbnailQuality === 'high' ? '_hq' : 
                         this.settings.thumbnailQuality === 'low' ? '_lq' : '';
    return `${baseName}_${timestamp}${qualitySuffix}.png`;
  }

  /**
   * 获取文件大小
   */
  private async getFileSize(filePath: string): Promise<number> {
    try {
      const stat = await this.vault.adapter.stat(filePath);
      return stat?.size || 0;
    } catch {
      return 0;
    }
  }

  /**
   * 管理缓存大小
   */
  private async manageCacheSize(): Promise<void> {
    const maxSizeBytes = this.settings.maxCacheSize * 1024 * 1024; // 转换为字节
    let totalSize = 0;

    // 计算当前缓存总大小
    for (const cacheEntry of Object.values(this.cache)) {
      totalSize += cacheEntry.size || 0;
    }

    if (totalSize > maxSizeBytes) {
      // 按最后修改时间排序，删除最旧的文件
      const sortedEntries = Object.entries(this.cache)
        .sort(([,a], [,b]) => a.lastModified - b.lastModified);

      for (const [filePath, cacheEntry] of sortedEntries) {
        if (totalSize <= maxSizeBytes) break;

        try {
          if (await this.vault.adapter.exists(cacheEntry.thumbnailPath)) {
            await this.vault.adapter.remove(cacheEntry.thumbnailPath);
          }
          totalSize -= cacheEntry.size || 0;
          delete this.cache[filePath];
                 } catch (error) {
           console.error('删除缓存文件失败:', error);
         }
       }

       // 如果删除了文件，保存更新后的缓存
       if (Object.keys(this.cache).length < sortedEntries.length) {
         await this.saveCache();
       }
     }
  }

  /**
   * 确保缓存目录存在
   */
  private async ensureCacheDir(): Promise<void> {
    if (!(await this.vault.adapter.exists(this.cacheDir))) {
      await this.vault.adapter.mkdir(this.cacheDir);
    }
  }

  /**
   * 清理过期的缓存文件
   */
  async cleanupCache(): Promise<void> {
    try {
      if (!(await this.vault.adapter.exists(this.cacheDir))) {
        return;
      }

      const filesToDelete: string[] = [];

      for (const [filePath, cacheEntry] of Object.entries(this.cache)) {
        if (!(await this.vault.adapter.exists(filePath))) {
          // 源文件已删除，标记缓存文件删除
          filesToDelete.push(filePath);
          if (await this.vault.adapter.exists(cacheEntry.thumbnailPath)) {
            await this.vault.adapter.remove(cacheEntry.thumbnailPath);
          }
        }
      }

      // 清理缓存记录
      filesToDelete.forEach(filePath => {
        delete this.cache[filePath];
      });

      // 保存更新后的缓存数据
      await this.saveCache();

    } catch (error) {
      console.error('清理缓存失败:', error);
    }
  }

  /**
   * 清理所有缓存文件
   */
  async clearAllCache(): Promise<void> {
    try {
      if (!(await this.vault.adapter.exists(this.cacheDir))) {
        // 缓存目录不存在，直接清空内存缓存
        this.cache = {};
        return;
      }

      // 删除所有缓存文件
      for (const cacheEntry of Object.values(this.cache)) {
        try {
          if (await this.vault.adapter.exists(cacheEntry.thumbnailPath)) {
            await this.vault.adapter.remove(cacheEntry.thumbnailPath);
          }
        } catch (error) {
          console.error(`删除缓存文件失败: ${cacheEntry.thumbnailPath}`, error);
        }
      }

      // 删除缓存配置文件
      const cacheConfigPath = `${this.cacheDir}/cache.json`;
      if (await this.vault.adapter.exists(cacheConfigPath)) {
        await this.vault.adapter.remove(cacheConfigPath);
      }

      // 注意：不删除缓存目录本身，只清理其中的文件

      // 清空内存中的缓存
      this.cache = {};

      console.log('所有缓存已清理完成');
    } catch (error) {
      console.error('清理所有缓存失败:', error);
      throw error;
    }
  }

  /**
   * 清理无效的缓存文件（源文件已删除的缓存）
   */
  async cleanupInvalidCache(): Promise<void> {
    try {
      if (!(await this.vault.adapter.exists(this.cacheDir))) {
        return;
      }

      const filesToDelete: string[] = [];

      for (const [filePath, cacheEntry] of Object.entries(this.cache)) {
        if (!(await this.vault.adapter.exists(filePath))) {
          // 源文件已删除，标记缓存文件删除
          filesToDelete.push(filePath);
          if (await this.vault.adapter.exists(cacheEntry.thumbnailPath)) {
            await this.vault.adapter.remove(cacheEntry.thumbnailPath);
          }
        }
      }

      // 清理缓存记录
      filesToDelete.forEach(filePath => {
        delete this.cache[filePath];
      });

      // 保存更新后的缓存数据
      await this.saveCache();

    } catch (error) {
      console.error('清理无效缓存失败:', error);
    }
  }

  /**
   * 创建fallback图标的SVG
   */
  createFallbackIcon(): string {
    return `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="48" height="48" rx="4" fill="var(--background-secondary)" stroke="var(--text-muted)" stroke-width="2"/>
      <path d="M20 32L28 24L36 32L44 24" stroke="var(--text-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="32" cy="40" r="2" fill="var(--text-accent)"/>
      <text x="32" y="52" text-anchor="middle" font-size="8" fill="var(--text-muted)">XMind</text>
    </svg>`;
  }

  /**
   * 更新设置
   */
  updateSettings(settings: XMindViewerSettings): void {
    this.settings = settings;
  }

  /**
   * 更新缓存目录
   */
  updateCacheDir(newCacheDir: string): void {
    this.cacheDir = newCacheDir;
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): { count: number; size: number } {
    const totalSize = Object.values(this.cache).reduce((sum, entry) => sum + (entry.size || 0), 0);
    return {
      count: Object.keys(this.cache).length,
      size: Math.round(totalSize / 1024 / 1024 * 100) / 100 // MB，保留两位小数
    };
  }

  /**
   * 加载缓存数据（从持久化存储）
   */
  async loadCache(): Promise<void> {
    try {
      if (await this.vault.adapter.exists(`${this.cacheDir}/cache.json`)) {
        const cacheData = await this.vault.adapter.read(`${this.cacheDir}/cache.json`);
        this.cache = JSON.parse(cacheData);
      }
    } catch (error) {
      console.error('加载缓存数据失败:', error);
      this.cache = {};
    }
  }

  /**
   * 保存缓存数据（到持久化存储）
   */
  async saveCache(): Promise<void> {
    try {
      await this.ensureCacheDir();
      await this.vault.adapter.write(`${this.cacheDir}/cache.json`, JSON.stringify(this.cache, null, 2));
    } catch (error) {
      console.error('保存缓存数据失败:', error);
    }
  }
} 