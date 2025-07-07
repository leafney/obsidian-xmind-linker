# 🚀 快速开始指南

## 方法一：一键安装（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/yourusername/obsidian-xmind-linker.git
cd obsidian-xmind-linker

# 2. 运行一键安装脚本
./install.sh

# 3. 按照提示完成安装
```

## 方法二：手动安装

### 步骤 1：构建插件

```bash
# 安装 Bun (如果还没有)
curl -fsSL https://bun.sh/install | bash

# 安装依赖
bun install

# 构建插件
bun run build
```

### 步骤 2：复制到 Obsidian

```bash
# 找到你的 Obsidian 库目录，例如：
# macOS: ~/Library/Application Support/obsidian/MyVault/.obsidian/plugins/
# Linux: ~/.config/obsidian/MyVault/.obsidian/plugins/
# Windows: %APPDATA%\obsidian\MyVault\.obsidian\plugins\

# 创建插件目录
mkdir -p "/path/to/your/vault/.obsidian/plugins/xmind-linker"

# 复制文件
cp main.js manifest.json styles.css "/path/to/your/vault/.obsidian/plugins/xmind-linker/"
```

### 步骤 3：启用插件

1. 打开 Obsidian
2. 设置 → 第三方插件
3. 关闭安全模式
4. 启用 "XMind Viewer" 插件

## 🧪 测试插件

### 1. 准备测试文件

下载或创建一个 XMind 文件，放入你的 Obsidian 库中。

### 2. 测试基本功能

**直接打开：**
- 在文件浏览器中双击 `.xmind` 文件

**Markdown 嵌入：**
```markdown
# 我的思维导图

![[test.xmind]]
```

**悬停操作：**
- 鼠标悬停在嵌入的 XMind 文件上
- 点击"预览"或"在 XMind 中打开"

### 3. 配置设置

设置 → 插件选项 → XMind Viewer

- ✅ 启用缩略图提取
- 🌍 选择默认区域
- 🖱️ 启用悬停提示
- 🔗 启用系统集成

## 🎯 使用场景

### 场景 1：项目管理
```markdown
# 项目规划

## 整体架构
![[project-architecture.xmind]]

## 功能模块
![[feature-modules.xmind]]
```

### 场景 2：学习笔记
```markdown
# 计算机科学学习

## 数据结构
![[data-structures.xmind]]

## 算法分析
![[algorithms.xmind]]
```

### 场景 3：会议记录
```markdown
# 团队会议

## 讨论要点
![[meeting-discussion.xmind]]

## 行动计划
![[action-plan.xmind]]
```

## 🔧 常见问题

### Q: 插件无法加载？
**A:** 检查 Obsidian 控制台 (`Ctrl+Shift+I`) 是否有错误信息

### Q: XMind 文件无法预览？
**A:** 确保网络连接正常，能够访问 CDN

### Q: 缩略图不显示？
**A:** 检查 XMind 文件是否包含缩略图，在设置中启用缩略图提取

### Q: 系统集成不工作？
**A:** 确保系统中安装了 XMind 应用，并在设置中启用系统集成

## 🎉 完成！

现在你可以在 Obsidian 中愉快地使用 XMind 文件了！

**更多帮助：**
- 📖 查看 [DEPLOYMENT.md](DEPLOYMENT.md) 获取详细说明
- 🐛 遇到问题？查看 [GitHub Issues](https://github.com/yourusername/obsidian-xmind-linker/issues)
- 💡 有建议？欢迎提交 PR 或创建 Issue 