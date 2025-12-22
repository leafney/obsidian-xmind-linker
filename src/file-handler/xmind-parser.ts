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
    const contentFile = zip.file('content.json') || zip.file('content.xml');
    if (!contentFile) {
      throw new Error('找不到 content.json 或 content.xml 文件');
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
    const jsonFile = zip.file('content.json');
    if (jsonFile) {
      const jsonContent = await jsonFile.async('text');
      const sheetsData = JSON.parse(jsonContent); // Let it throw if invalid
      if (!Array.isArray(sheetsData)) {
        throw new Error('content.json is not a valid sheet array.');
      }
      return sheetsData.map((sheet: any) => ({
        id: sheet.id,
        title: sheet.title,
        rootTopic: sheet.rootTopic || null // Handle missing rootTopic gracefully
      }));
    }

    const xmlFile = zip.file('content.xml');
    if (xmlFile) {
      // XML parsing is not implemented. Return empty array instead of default sheet.
      return [];
    }
    
    return [];
  }

  /**
   * 验证文件是否为有效的 XMind 文件
   */
  static async isValidXMindFile(buffer: ArrayBuffer): Promise<boolean> {
    try {
      const zip = await JSZip.loadAsync(buffer);
      return zip.file('content.xml') !== null || zip.file('content.json') !== null;
    } catch {
      return false;
    }
  }
} 