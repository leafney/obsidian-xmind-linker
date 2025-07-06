# Obsidian XMind Viewer Plugin

一个强大的 Obsidian 插件，支持在 Obsidian 中查看和嵌入 XMind 思维导图文件。

## 🌟 功能特性

- **📁 文件支持**: 直接在 Obsidian 中打开和查看 `.xmind` 文件
- **🖼️ 嵌入预览**: 在 Markdown 中使用 `![[file.xmind]]` 语法嵌入 XMind 文件
- **🔍 缩略图提取**: 自动提取 XMind 文件中的缩略图用于快速预览
- **🖱️ 交互式预览**: 基于 [xmind-embed-viewer](https://github.com/xmindltd/xmind-embed-viewer) 的完整交互式预览
- **⚡ 悬停操作**: 鼠标悬停显示快捷操作菜单
- **🔗 系统集成**: 一键使用系统默认 XMind 应用打开文件
- **🌍 多区域支持**: 支持全球和中国大陆 CDN 加速
- **⚙️ 自定义设置**: 丰富的配置选项满足不同需求

## 📦 安装方法

### 方法一：手动安装

1. 下载最新的 release 文件
2. 解压到 Obsidian 插件目录: `{vault}/.obsidian/plugins/obsidian-xmind-viewer/`
3. 在 Obsidian 设置中启用插件

### 方法二：开发版本

1. 克隆仓库到插件目录
2. 安装依赖并构建

```bash
# 克隆仓库
git clone https://github.com/yourusername/obsidian-xmind-viewer.git

# 进入目录
cd obsidian-xmind-viewer

# 安装依赖 (使用 Bun)
bun install

# 构建插件
bun run build
```

## 🚀 使用方法

### 1. 直接查看 XMind 文件

- 在 Obsidian 文件浏览器中双击 `.xmind` 文件
- 或使用命令面板: `Ctrl+P` → "打开 XMind 文件"

### 2. 在 Markdown 中嵌入

```markdown
# 我的思维导图

这是一个嵌入的 XMind 文件:

![[我的思维导图.xmind]]

可以点击预览或悬停查看操作选项。
```

### 3. 缩略图预览

启用缩略图提取后，插件会自动提取 XMind 文件中的缩略图，你可以直接在 Markdown 中使用:

```markdown
![[我的思维导图.xmind]]
```

### 4. 快捷命令

- **提取缩略图**: `Ctrl+P` → "提取 XMind 缩略图"
- **清理缓存**: `Ctrl+P` → "清理缩略图缓存"
- **系统打开**: 在预览界面点击"在 XMind 中打开"

## ⚙️ 设置选项

在 Obsidian 设置 → 插件选项 → XMind Viewer 中可以配置:

- **启用缩略图提取**: 自动提取并缓存 XMind 文件缩略图
- **默认区域**: 选择 CDN 区域（全球/中国大陆）
- **显示悬停提示**: 鼠标悬停时显示操作菜单
- **启用系统集成**: 允许调用系统 XMind 应用
- **缩略图缓存目录**: 设置缓存目录名称

## 🛠️ 技术实现

### 核心技术栈

- **TypeScript**: 主要开发语言
- **xmind-embed-viewer**: XMind 文件预览核心库
- **JSZip**: 用于解析 XMind 文件（ZIP 格式）
- **Obsidian API**: 深度集成 Obsidian 功能

### 架构设计

```
obsidian-xmind-viewer/
├── src/
│   ├── core/           # 核心逻辑
│   ├── file-handler/   # 文件处理
│   ├── viewer/         # 预览组件
│   ├── ui/             # 用户界面
│   └── types/          # 类型定义
├── main.ts             # 插件入口
└── styles.css          # 样式文件
```

### 关键特性

1. **ZIP 文件解析**: XMind 文件本质上是 ZIP 包，包含 XML 数据和缩略图
2. **动态加载**: 按需加载 xmind-embed-viewer 库
3. **缓存机制**: 智能缓存缩略图，避免重复提取
4. **事件驱动**: 基于 Obsidian 事件系统的响应式设计

## 🔧 开发指南

### 环境要求

- Node.js 16+
- Bun 1.0+
- Obsidian 0.15.0+

### 开发流程

```bash
# 安装依赖
bun install

# 开发模式 (监听文件变化)
bun run dev

# 构建生产版本
bun run build

# 运行测试
bun test
```

### 调试技巧

1. 在 Obsidian 中启用开发者工具: `Ctrl+Shift+I`
2. 查看控制台输出了解插件运行状态
3. 使用 `console.log` 进行调试

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送到分支: `git push origin feature/amazing-feature`
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [xmind-embed-viewer](https://github.com/xmindltd/xmind-embed-viewer) - 核心预览功能
- [Obsidian](https://obsidian.md/) - 强大的知识管理工具
- 所有贡献者和用户的支持

## 📞 支持

如果你遇到问题或有建议，请：

1. 查看 [Issues](https://github.com/yourusername/obsidian-xmind-viewer/issues)
2. 创建新的 Issue
3. 加入讨论区交流

---

**享受在 Obsidian 中使用 XMind 思维导图的乐趣！** 🎉 