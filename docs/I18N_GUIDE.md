# 多语言功能指南 / Multi-Language Guide

## 🌐 概述 / Overview

XMind Linker 插件支持多语言界面，目前支持英文和简体中文两种语言。插件会自动检测 Obsidian 的语言设置，并提供手动切换选项。

The XMind Linker plugin supports multi-language interfaces, currently supporting English and Simplified Chinese. The plugin automatically detects Obsidian's language settings and provides manual switching options.

## 🎯 支持的语言 / Supported Languages

- **English** - 英文（默认语言 / Default Language）
- **简体中文** - Simplified Chinese

## 🔧 语言设置 / Language Settings

### 自动检测 / Automatic Detection

插件启动时会自动检测以下语言设置：
The plugin automatically detects the following language settings on startup:

1. **Obsidian 语言设置** / Obsidian Language Settings
2. **浏览器语言设置** / Browser Language Settings
3. **系统语言设置** / System Language Settings

### 手动切换 / Manual Switching

1. 打开 Obsidian 设置 / Open Obsidian Settings
2. 导航到 "插件选项" → "XMind Linker" / Navigate to "Plugin Options" → "XMind Linker"
3. 在 "语言" 下拉菜单中选择所需语言 / Select desired language from "Language" dropdown
4. 设置会立即生效 / Settings take effect immediately

## 🌟 国际化功能 / Internationalization Features

### 界面文本 / Interface Text

所有用户界面文本都已国际化，包括：
All user interface text has been internationalized, including:

- ⚙️ **设置面板** / Settings Panel
- 🎮 **命令面板** / Command Palette
- 📄 **查看器界面** / Viewer Interface
- 💬 **提示消息** / Notification Messages
- ❌ **错误信息** / Error Messages
- 🔄 **加载状态** / Loading States

### 动态切换 / Dynamic Switching

- 语言切换后，设置面板会立即更新 / Settings panel updates immediately after language switch
- 新打开的查看器会使用新语言 / Newly opened viewers use the new language
- 命令名称会在下次重启后更新 / Command names update after next restart

## 🛠️ 开发者信息 / Developer Information

### 语言文件结构 / Language File Structure

```typescript
interface I18nTexts {
  settings: {
    title: string;
    language: { name: string; desc: string };
    // ... 其他设置项
  };
  commands: {
    openXMindFile: string;
    extractThumbnail: string;
    cleanupCache: string;
  };
  viewer: {
    title: string;
    loadingFile: string;
    // ... 查看器相关文本
  };
  messages: {
    pluginLoaded: string;
    // ... 消息提示
  };
  errors: {
    fileNotFound: string;
    // ... 错误信息
  };
}
```

### 添加新语言 / Adding New Languages

1. 在 `src/core/i18n.ts` 中添加新的语言代码类型
2. 创建新的语言包对象
3. 更新 `LANGUAGE_TEXTS` 映射
4. 更新语言检测逻辑
5. 测试所有功能

## 📋 语言映射 / Language Mapping

| Obsidian/Browser | Plugin Language | 说明 / Description |
|------------------|-----------------|-------------------|
| `en`, `en-us`, `en-gb` | `en` | 英文 / English |
| `zh`, `zh-cn`, `zh-hans` | `zh-cn` | 简体中文 / Simplified Chinese |
| Other | `en` | 默认英文 / Default to English |

## 🐛 故障排除 / Troubleshooting

### 语言未正确检测 / Language Not Detected Correctly

1. 检查 Obsidian 的语言设置 / Check Obsidian's language settings
2. 手动在插件设置中选择语言 / Manually select language in plugin settings
3. 重启 Obsidian / Restart Obsidian

### 部分文本未翻译 / Partial Text Not Translated

1. 检查控制台是否有翻译键缺失的警告 / Check console for missing translation key warnings
2. 报告问题到 GitHub Issues / Report issue to GitHub Issues

### 切换语言后未生效 / Language Switch Not Effective

1. 刷新当前页面或重新打开标签页 / Refresh current page or reopen tabs
2. 重启 Obsidian / Restart Obsidian
3. 检查设置是否正确保存 / Check if settings are saved correctly

## 🔄 更新日志 / Changelog

### v1.1.0
- ✅ 添加多语言支持 / Added multi-language support
- ✅ 支持英文和简体中文 / Support for English and Simplified Chinese
- ✅ 自动语言检测 / Automatic language detection
- ✅ 动态语言切换 / Dynamic language switching
- ✅ 全面的界面国际化 / Comprehensive interface internationalization

## 🤝 贡献翻译 / Contributing Translations

欢迎为插件贡献新的语言翻译！
Welcome to contribute new language translations for the plugin!

1. Fork 项目仓库 / Fork the project repository
2. 复制英文语言包并翻译 / Copy English language pack and translate
3. 测试翻译的准确性 / Test translation accuracy
4. 提交 Pull Request / Submit Pull Request

### 翻译指南 / Translation Guidelines

- 保持术语一致性 / Maintain terminology consistency
- 考虑上下文和用户体验 / Consider context and user experience
- 测试在不同界面尺寸下的显示效果 / Test display effects at different interface sizes
- 遵循目标语言的本地化习惯 / Follow localization practices of target language

---

**需要帮助？** / **Need Help?**

如果您在使用多语言功能时遇到问题，请：
If you encounter issues with multi-language features, please:

1. 查看此文档 / Check this documentation
2. 搜索 [GitHub Issues](https://github.com/yourusername/obsidian-xmind-linker/issues)
3. 创建新的 Issue 并提供详细信息 / Create new Issue with detailed information 