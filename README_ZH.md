# Obsidian XMind Linker

在 Obsidian 中查看 XMind 文件，并支持连接 XMind 软件打开进行编辑。

## 🌟 核心功能

- **📖 文件查看**: 在 Obsidian 中直接查看 XMind 思维导图
- **🔗 软件连接**: 一键连接 XMind 软件进行编辑
- **📄 笔记嵌入**: 在 Markdown 中嵌入 XMind 文件，使用 `![[file.xmind]]` 语法
- **⚡ 无缝切换**: 查看与编辑之间的流畅工作流程
- **🖼️ 缩略图预览**: 自动提取缩略图快速预览
- **🌐 多语言支持**: 支持英文和简体中文界面

## 📦 安装方法

### 方法一：社区插件商店（即将推出）

1. 打开 Obsidian 设置
2. 进入 社区插件 → 浏览
3. 搜索 "XMind Linker"
4. 安装并启用插件

### 方法二：手动安装

1. 下载最新版本文件
2. 解压到 Obsidian 插件目录：`{vault}/.obsidian/plugins/xmind-linker/`
3. 在 Obsidian 设置中启用插件

### 方法三：开发版本

1. 克隆仓库到插件目录
2. 安装依赖并构建

```bash
# 克隆仓库
git clone https://github.com/leafney/obsidian-xmind-linker.git

# 进入目录
cd obsidian-xmind-linker

# 安装依赖（使用 Bun）
bun install

# 构建插件
bun run build
```

## 🚀 使用方法

### 1. 查看 XMind 文件
- 在 Obsidian 文件管理器中双击 `.xmind` 文件
- 或使用命令面板：`Ctrl+P` → "打开 XMind 文件"

### 2. 在笔记中嵌入
```markdown
# 我的思维导图

![[项目规划.xmind]]

点击查看或悬停显示操作选项
```

### 3. 连接 XMind 软件编辑
- 悬停在嵌入的文件上查看快速操作
- 点击"在 XMind 中打开"启动外部编辑器
- 在 XMind 中编辑完成后返回 Obsidian 查看

## ⚙️ 设置选项

在 Obsidian 设置 → 插件选项 → XMind Linker 中配置：

- **语言**: 选择界面语言（English/简体中文），支持自动检测
- **系统集成**: 启用连接 XMind 软件功能
- **悬停操作**: 悬停时显示操作菜单
- **缩略图缓存**: 自动提取缩略图加快预览

## 🛠️ 技术实现

### 核心技术
- **XMind 文件解析**: 原生支持 `.xmind` 格式（ZIP 包结构）
- **系统集成**: 跨平台调用 XMind 软件
- **交互式预览**: 基于 [xmind-embed-viewer](https://github.com/xmindltd/xmind-embed-viewer) 的完整预览功能
- **智能缓存**: 缩略图提取和缓存机制

## 🔧 开发指南

### 环境要求

- Node.js 16+
- Bun 1.0+
- Obsidian 0.15.0+

### 开发流程

```bash
# 安装依赖
bun install

# 开发模式（监听文件变化）
bun run dev

# 构建生产版本
bun run build

# 运行测试
bun test
```

### 调试技巧

1. 在 Obsidian 中启用开发者工具：`Ctrl+Shift+I`
2. 查看控制台输出了解插件状态
3. 使用 `console.log` 进行调试

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [xmind-embed-viewer](https://github.com/xmindltd/xmind-embed-viewer) - xmind核心预览功能
- [Obsidian](https://obsidian.md/) - 强大的知识管理工具
- [Cursor](https://cursor.sh/) - AI 驱动的代码编辑器，为本项目的开发提供了强大支持
- [obsidian-xmind-viewer](https://github.com/Ssentiago/obsidian-xmind-viewer) - 优秀的开源项目，为本项目提供了宝贵的设计思路和技术灵感


## 📞 支持

如果您遇到问题或有建议：

1. 查看 [Issues](https://github.com/leafney/obsidian-xmind-linker/issues)
2. 创建新的 Issue
3. 参与讨论

## 📚 文档

- **[English Documentation](README.md)** - 英文文档
- **[安装指南](docs/INSTALL.md)** - 详细安装说明
- **[使用指南](docs/USAGE_GUIDE.md)** - 全面的使用文档
- **[部署指南](docs/DEPLOYMENT.md)** - 开发和部署指南

---

**享受在 Obsidian 中使用 XMind 思维导图的乐趣！** 🎉 