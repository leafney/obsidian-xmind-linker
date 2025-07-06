import JSZip from 'jszip';
import type { XMindData, XMindSheet, XMindTopic } from '../types';

export class XMindParser {
  /**
   * 解析 XMind 文件
   * @param buffer XMind 文件的 ArrayBuffer
   * @returns 解析后的 XMind 数据
   */
  async parseXMindFile(buffer: ArrayBuffer): Promise<XMindData> {
    try {
      const zip = await JSZip.loadAsync(buffer);
      
      // 解析内容文件
      const content = await this.parseContent(zip);
      
      // 提取缩略图
      const thumbnail = await this.extractThumbnail(zip);
      
      // 解析工作表
      const sheets = await this.parseSheets(zip);
      
      return {
        content,
        thumbnail,
        sheets
      };
    } catch (error) {
      throw new Error(`解析 XMind 文件失败: ${error.message}`);
    }
  }

  /**
   * 解析内容文件
   */
  private async parseContent(zip: JSZip): Promise<string> {
    const contentFile = zip.file('content.xml');
    if (!contentFile) {
      throw new Error('找不到 content.xml 文件');
    }
    
    return await contentFile.async('text');
  }

  /**
   * 提取缩略图
   */
  private async extractThumbnail(zip: JSZip): Promise<ArrayBuffer | undefined> {
    const thumbnailFile = zip.file('Thumbnails/thumbnail.png') || 
                         zip.file('thumbnails/thumbnail.png');
    
    if (!thumbnailFile) {
      return undefined;
    }
    
    return await thumbnailFile.async('arraybuffer');
  }

  /**
   * 解析工作表信息
   */
  private async parseSheets(zip: JSZip): Promise<XMindSheet[]> {
    const contentFile = zip.file('content.xml');
    if (!contentFile) {
      return [];
    }
    
    const contentXml = await contentFile.async('text');
    
    // 这里应该解析 XML 内容，提取工作表信息
    // 为了简化，我们返回一个默认的工作表
    return [{
      id: 'default',
      title: '默认工作表',
      rootTopic: {
        id: 'root',
        title: '中心主题'
      }
    }];
  }

  /**
   * 验证文件是否为有效的 XMind 文件
   */
  static async isValidXMindFile(buffer: ArrayBuffer): Promise<boolean> {
    try {
      const zip = await JSZip.loadAsync(buffer);
      return zip.file('content.xml') !== null;
    } catch {
      return false;
    }
  }
} 