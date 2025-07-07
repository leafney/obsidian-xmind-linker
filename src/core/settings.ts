import { App, PluginSettingTab, Setting } from 'obsidian';
import type XMindLinkerPlugin from '../../main';
import type { XMindViewerSettings } from '../types';
import { i18n, type SupportedLanguage } from './i18n';
import { Notice } from 'obsidian';

export const DEFAULT_SETTINGS: XMindViewerSettings = {
  enableThumbnailExtraction: true,
  defaultRegion: 'global',
  enableSystemIntegration: true,
  thumbnailCacheDir: '.xmind-thumbnails',
  language: 'en',
  thumbnailMaxWidth: 600,
  thumbnailMaxHeight: 400,
  thumbnailQuality: 'medium',
  enableThumbnailFallback: true,
  showThumbnailLoadingIndicator: true,
  maxCacheSize: 50 // 50MB
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

    containerEl.createEl('h2', { text: i18n.t('settings.title') });

    // 语言设置 - 放在最前面
    new Setting(containerEl)
      .setName(i18n.t('settings.language.name'))
      .setDesc(i18n.t('settings.language.desc'))
      .addDropdown(dropdown => {
        dropdown
          .addOption('en', i18n.t('settings.languageOptions.en'))
          .addOption('zh-cn', i18n.t('settings.languageOptions.zh-cn'))
          .setValue(this.plugin.settings.language)
          .onChange(async (value: SupportedLanguage) => {
            this.plugin.settings.language = value;
            await this.plugin.saveSettings();
            
            // 更新 i18n 语言并重新渲染设置面板
            i18n.setLanguage(value);
            this.display();
          });
      });

    // 缩略图设置分组
    containerEl.createEl('h3', { text: i18n.t('settings.thumbnailSettings.groupTitle') });

    new Setting(containerEl)
      .setName(i18n.t('settings.enableThumbnailExtraction.name'))
      .setDesc(i18n.t('settings.enableThumbnailExtraction.desc'))
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableThumbnailExtraction)
        .onChange(async (value) => {
          this.plugin.settings.enableThumbnailExtraction = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(i18n.t('settings.thumbnailSettings.enableThumbnailFallback.name'))
      .setDesc(i18n.t('settings.thumbnailSettings.enableThumbnailFallback.desc'))
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableThumbnailFallback)
        .onChange(async (value) => {
          this.plugin.settings.enableThumbnailFallback = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(i18n.t('settings.thumbnailSettings.showThumbnailLoadingIndicator.name'))
      .setDesc(i18n.t('settings.thumbnailSettings.showThumbnailLoadingIndicator.desc'))
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showThumbnailLoadingIndicator)
        .onChange(async (value) => {
          this.plugin.settings.showThumbnailLoadingIndicator = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(i18n.t('settings.thumbnailSettings.thumbnailMaxWidth.name'))
      .setDesc(i18n.t('settings.thumbnailSettings.thumbnailMaxWidth.desc'))
      .addSlider(slider => slider
        .setLimits(200, 800, 50)
        .setValue(this.plugin.settings.thumbnailMaxWidth)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.thumbnailMaxWidth = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(i18n.t('settings.thumbnailSettings.thumbnailMaxHeight.name'))
      .setDesc(i18n.t('settings.thumbnailSettings.thumbnailMaxHeight.desc'))
      .addSlider(slider => slider
        .setLimits(150, 600, 50)
        .setValue(this.plugin.settings.thumbnailMaxHeight)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.thumbnailMaxHeight = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(i18n.t('settings.thumbnailSettings.thumbnailQuality.name'))
      .setDesc(i18n.t('settings.thumbnailSettings.thumbnailQuality.desc'))
      .addDropdown(dropdown => dropdown
        .addOption('low', i18n.t('settings.thumbnailSettings.thumbnailQuality.options.low'))
        .addOption('medium', i18n.t('settings.thumbnailSettings.thumbnailQuality.options.medium'))
        .addOption('high', i18n.t('settings.thumbnailSettings.thumbnailQuality.options.high'))
        .setValue(this.plugin.settings.thumbnailQuality)
        .onChange(async (value: 'low' | 'medium' | 'high') => {
          this.plugin.settings.thumbnailQuality = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(i18n.t('settings.thumbnailSettings.maxCacheSize.name'))
      .setDesc(i18n.t('settings.thumbnailSettings.maxCacheSize.desc'))
      .addSlider(slider => slider
        .setLimits(10, 100, 10)
        .setValue(this.plugin.settings.maxCacheSize)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.maxCacheSize = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(i18n.t('settings.thumbnailCacheDir.name'))
      .setDesc(i18n.t('settings.thumbnailCacheDir.desc'))
      .addText(text => text
        .setPlaceholder('.xmind-thumbnails')
        .setValue(this.plugin.settings.thumbnailCacheDir)
        .onChange(async (value) => {
          this.plugin.settings.thumbnailCacheDir = value || '.xmind-thumbnails';
          await this.plugin.saveSettings();
          // 更新缩略图提取器的缓存目录
          if (this.plugin.thumbnailExtractor) {
            this.plugin.thumbnailExtractor.updateCacheDir(this.plugin.settings.thumbnailCacheDir);
          }
        }));

    // 缓存管理设置
    const cacheStats = this.plugin.thumbnailExtractor?.getCacheStats() || { count: 0, size: 0 };
    
    new Setting(containerEl)
      .setName(i18n.t('settings.thumbnailSettings.cacheStats.name'))
      .setDesc(i18n.t('settings.thumbnailSettings.cacheStats.desc').replace('{count}', cacheStats.count.toString()).replace('{size}', cacheStats.size.toString()))
      .addButton(button => button
        .setButtonText(i18n.t('settings.thumbnailSettings.cacheStats.buttonText'))
        .setTooltip(i18n.t('settings.thumbnailSettings.cacheStats.buttonTooltip'))
        .onClick(async () => {
          try {
            if (this.plugin.thumbnailExtractor) {
              await this.plugin.thumbnailExtractor.clearAllCache();
              // 刷新显示
              this.display();
              // 显示成功消息
              new Notice(i18n.t('messages.cacheCleanupComplete'));
            } else {
              new Notice('缩略图提取器未初始化');
            }
          } catch (error) {
            console.error('清理缓存失败:', error);
            new Notice(`清理缓存失败: ${error.message}`);
          }
        }));

    // 其他设置分组
    containerEl.createEl('h3', { text: i18n.t('settings.otherSettings.groupTitle') });

    new Setting(containerEl)
      .setName(i18n.t('settings.defaultRegion.name'))
      .setDesc(i18n.t('settings.defaultRegion.desc'))
      .addDropdown(dropdown => dropdown
        .addOption('global', i18n.t('settings.regionOptions.global'))
        .addOption('cn', i18n.t('settings.regionOptions.cn'))
        .setValue(this.plugin.settings.defaultRegion)
        .onChange(async (value: 'global' | 'cn') => {
          this.plugin.settings.defaultRegion = value;
          await this.plugin.saveSettings();
        }));



    new Setting(containerEl)
      .setName(i18n.t('settings.enableSystemIntegration.name'))
      .setDesc(i18n.t('settings.enableSystemIntegration.desc'))
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableSystemIntegration)
        .onChange(async (value) => {
          this.plugin.settings.enableSystemIntegration = value;
          await this.plugin.saveSettings();
        }));
  }
} 