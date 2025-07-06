import { App, PluginSettingTab, Setting } from 'obsidian';
import type XMindLinkerPlugin from '../../main';
import type { XMindViewerSettings } from '../types';
import { i18n, type SupportedLanguage } from './i18n';

export const DEFAULT_SETTINGS: XMindViewerSettings = {
  enableThumbnailExtraction: true,
  defaultRegion: 'global',
  showHoverTooltip: true,
  enableSystemIntegration: true,
  thumbnailCacheDir: '.xmind-thumbnails',
  language: 'en'
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
      .setName(i18n.t('settings.showHoverTooltip.name'))
      .setDesc(i18n.t('settings.showHoverTooltip.desc'))
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showHoverTooltip)
        .onChange(async (value) => {
          this.plugin.settings.showHoverTooltip = value;
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

    new Setting(containerEl)
      .setName(i18n.t('settings.thumbnailCacheDir.name'))
      .setDesc(i18n.t('settings.thumbnailCacheDir.desc'))
      .addText(text => text
        .setPlaceholder('.xmind-thumbnails')
        .setValue(this.plugin.settings.thumbnailCacheDir)
        .onChange(async (value) => {
          this.plugin.settings.thumbnailCacheDir = value || '.xmind-thumbnails';
          await this.plugin.saveSettings();
        }));
  }
} 