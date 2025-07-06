import { App, PluginSettingTab, Setting } from 'obsidian';
import type XMindLinkerPlugin from '../../main';
import type { XMindViewerSettings } from '../types';

export const DEFAULT_SETTINGS: XMindViewerSettings = {
  enableThumbnailExtraction: true,
  defaultRegion: 'global',
  showHoverTooltip: true,
  enableSystemIntegration: true,
  thumbnailCacheDir: '.xmind-thumbnails'
};

export class XMindLinkerSettingTab extends PluginSettingTab {
  plugin: XMindLinkerPlugin;

  constructor(app: App, plugin: XMindLinkerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl('h2', { text: 'XMind Linker 设置' });

    new Setting(containerEl)
      .setName('启用缩略图提取')
      .setDesc('自动提取 XMind 文件中的缩略图用于预览')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableThumbnailExtraction)
        .onChange(async (value) => {
          this.plugin.settings.enableThumbnailExtraction = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('默认区域')
      .setDesc('选择 XMind 查看器的默认区域（影响加载速度）')
      .addDropdown(dropdown => dropdown
        .addOption('global', '全球')
        .addOption('cn', '中国大陆')
        .setValue(this.plugin.settings.defaultRegion)
        .onChange(async (value: 'global' | 'cn') => {
          this.plugin.settings.defaultRegion = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('显示悬停提示')
      .setDesc('鼠标悬停在嵌入的 XMind 文件上时显示操作提示')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showHoverTooltip)
        .onChange(async (value) => {
          this.plugin.settings.showHoverTooltip = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('启用系统集成')
      .setDesc('允许通过系统默认应用打开 XMind 文件')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableSystemIntegration)
        .onChange(async (value) => {
          this.plugin.settings.enableSystemIntegration = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('缩略图缓存目录')
      .setDesc('存储提取的缩略图的目录名称')
      .addText(text => text
        .setPlaceholder('.xmind-thumbnails')
        .setValue(this.plugin.settings.thumbnailCacheDir)
        .onChange(async (value) => {
          this.plugin.settings.thumbnailCacheDir = value || '.xmind-thumbnails';
          await this.plugin.saveSettings();
        }));
  }
} 