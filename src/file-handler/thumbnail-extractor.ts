import { TFile, Vault } from 'obsidian';
import { XMindParser } from './xmind-parser';
import type { ThumbnailCache } from '../types';

export class ThumbnailExtractor {
  private vault: Vault;
  private cacheDir: string;
  private cache: ThumbnailCache = {};

  constructor(vault: Vault, cacheDir: string) {
    this.vault = vault;
    this.cacheDir = cacheDir;
  }

  /**
   * 提取并缓存 XMind 文件的缩略图
   */
  async extractThumbnail(file: TFile): Promise<string | null> {
    try {
      const filePath = file.path;
      const lastModified = file.stat.mtime;

      // 检查缓存
      if (this.cache[filePath] && this.cache[filePath].lastModified >= lastModified) {
        const cachedPath = this.cache[filePath].thumbnailPath;
        if (await this.vault.adapter.exists(cachedPath)) {
          return cachedPath;
        }
      }

      // 读取 XMind 文件
      const buffer = await this.vault.adapter.readBinary(filePath);
      
      // 解析并提取缩略图
      const parser = new XMindParser();
      const xmindData = await parser.parseXMindFile(buffer);

      if (!xmindData.thumbnail) {
        return null;
      }

      // 确保缓存目录存在
      await this.ensureCacheDir();

      // 生成缩略图文件名
      const thumbnailFileName = this.generateThumbnailName(file);
      const thumbnailPath = `${this.cacheDir}/${thumbnailFileName}`;

      // 保存缩略图
      await this.vault.adapter.writeBinary(thumbnailPath, xmindData.thumbnail);

      // 更新缓存
      this.cache[filePath] = {
        thumbnailPath,
        lastModified
      };

      return thumbnailPath;
    } catch (error) {
      console.error('提取缩略图失败:', error);
      return null;
    }
  }

  /**
   * 生成缩略图文件名
   */
  private generateThumbnailName(file: TFile): string {
    const baseName = file.basename;
    const timestamp = file.stat.mtime;
    return `${baseName}_${timestamp}.png`;
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

      const files = await this.vault.adapter.list(this.cacheDir);
      
      for (const filePath of Object.keys(this.cache)) {
        if (!(await this.vault.adapter.exists(filePath))) {
          // 源文件已删除，删除缓存
          const thumbnailPath = this.cache[filePath].thumbnailPath;
          if (await this.vault.adapter.exists(thumbnailPath)) {
            await this.vault.adapter.remove(thumbnailPath);
          }
          delete this.cache[filePath];
        }
      }
    } catch (error) {
      console.error('清理缓存失败:', error);
    }
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): { count: number; size: number } {
    return {
      count: Object.keys(this.cache).length,
      size: 0 // 可以后续实现文件大小统计
    };
  }
} 