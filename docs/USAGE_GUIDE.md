# 📋 Obsidian XMind Viewer 完整使用指南

## 🎯 概述

Obsidian XMind Viewer 是一个功能强大的 Obsidian 插件，让你能够在 Obsidian 中无缝查看和嵌入 XMind 思维导图文件。

## 🚀 安装步骤

### 方法 1：一键安装（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/yourusername/obsidian-xmind-linker.git
cd obsidian-xmind-linker

# 2. 运行一键安装脚本
./install.sh

# 3. 按照屏幕提示完成安装
```

### 方法 2：手动安装

1. **构建插件**
   ```bash
   bun install
   bun run build
   ```

2. **复制文件到 Obsidian 插件目录**
   ```bash
   # macOS
   cp main.js manifest.json styles.css ~/Library/Application\ Support/obsidian/YourVault/.obsidian/plugins/xmind-linker/
   
   # Linux
   cp main.js manifest.json styles.css ~/.config/obsidian/YourVault/.obsidian/plugins/xmind-linker/
   
   # Windows
   cp main.js manifest.json styles.css %APPDATA%\obsidian\YourVault\.obsidian\plugins\xmind-linker\
   ```

3. **在 Obsidian 中启用插件**
   - 设置 → 第三方插件 → 关闭安全模式 → 启用 "XMind Viewer"

## 🔧 基本使用

### 1. 直接查看 XMind 文件

**步骤：**
1. 将 `.xmind` 文件放入你的 Obsidian 库
2. 在文件浏览器中双击 XMind 文件
3. 文件将在新标签页中打开，显示完整的交互式思维导图

**功能：**
- ✅ 完整的思维导图预览
- ✅ 缩放和平移操作
- ✅ 工作表切换
- ✅ 适应窗口大小

### 2. Markdown 嵌入

**语法：**
```markdown
![[your-mindmap.xmind]]
```

**示例：**
```markdown
# 项目规划文档

## 整体架构
![[architecture.xmind]]

## 功能模块分解
![[features.xmind]]

## 时间线规划
![[timeline.xmind]]
```

**效果：**
- 显示 XMind 文件的缩略图预览
- 点击缩略图打开完整预览
- 支持多个文件在同一页面嵌入

### 3. 缩略图功能

插件会自动从 XMind 文件中提取缩略图：

**自动提取：**
- 插件首次遇到 XMind 文件时自动提取缩略图
- 缩略图保存在 `.xmind-thumbnails/` 目录
- 支持缓存机制，避免重复提取

**手动提取：**
```
Ctrl+P → "提取 XMind 缩略图"
```

### 4. 悬停操作菜单

当鼠标悬停在嵌入的 XMind 文件上时：

**预览按钮：**
- 在当前窗口打开完整预览

**在 XMind 中打开按钮：**
- 使用系统默认 XMind 应用打开文件
- 需要系统中安装 XMind 软件

## ⚙️ 插件设置

访问：设置 → 插件选项 → XMind Viewer

### 设置选项

| 设置项 | 说明 | 默认值 |
|--------|------|--------|
| 启用缩略图提取 | 自动提取并缓存 XMind 文件缩略图 | ✅ 启用 |
| 默认区域 | 选择 CDN 区域以优化加载速度 | 全球 |
| 显示悬停提示 | 鼠标悬停时显示操作菜单 | ✅ 启用 |
| 启用系统集成 | 允许调用系统 XMind 应用 | ✅ 启用 |
| 缩略图缓存目录 | 存储缩略图的目录名称 | `.xmind-thumbnails` |

### 区域设置说明

**全球区域：**
- 使用国际 CDN
- 适合海外用户
- 加载速度可能受网络环境影响

**中国大陆：**
- 使用中国大陆 CDN
- 适合中国大陆用户
- 更快的加载速度

## 🎮 快捷命令

通过命令面板 (`Ctrl+P` / `Cmd+P`) 访问：

### 可用命令

| 命令 | 功能 | 使用场景 |
|------|------|----------|
| 打开 XMind 文件 | 打开文件选择器 | 快速打开 XMind 文件 |
| 提取 XMind 缩略图 | 手动提取当前文件缩略图 | 当前文件是 XMind 格式时可用 |
| 清理缩略图缓存 | 清理过期的缓存文件 | 定期维护，释放存储空间 |

## 📁 文件管理

### 缓存目录结构

```
your-vault/
├── .xmind-thumbnails/          # 缩略图缓存目录
│   ├── mindmap1_1640995200.png # 缓存的缩略图
│   ├── mindmap2_1640995300.png
│   └── ...
├── mindmaps/
│   ├── project-plan.xmind      # 你的 XMind 文件
│   ├── architecture.xmind
│   └── ...
└── notes/
    └── project-overview.md     # 包含 XMind 嵌入的笔记
```

### 缓存管理

**自动清理：**
- 插件启动时检查过期缓存
- 源文件删除时自动清理对应缓存

**手动清理：**
```
Ctrl+P → "清理缩略图缓存"
```

## 🎨 实际使用场景

### 场景 1：项目管理

```markdown
# 项目 Alpha 开发计划

## 1. 项目架构
![[alpha-architecture.xmind]]

系统采用微服务架构，包含以下核心模块：
- 用户服务
- 订单服务  
- 支付服务
- 通知服务

## 2. 开发时间线
![[alpha-timeline.xmind]]

项目分为三个阶段：
- 第一阶段：基础功能开发 (4周)
- 第二阶段：高级功能开发 (6周)
- 第三阶段：测试和优化 (2周)

## 3. 团队分工
![[alpha-team.xmind]]
```

### 场景 2：学习笔记

```markdown
# 计算机科学学习笔记

## 数据结构与算法

### 基础数据结构
![[data-structures-basic.xmind]]

### 高级算法
![[algorithms-advanced.xmind]]

### 算法复杂度分析
![[complexity-analysis.xmind]]

## 系统设计

### 分布式系统
![[distributed-systems.xmind]]

### 数据库设计
![[database-design.xmind]]
```

### 场景 3：会议记录

```markdown
# 产品规划会议 - 2024年第一季度

**会议时间：** 2024-01-15 14:00-16:00  
**参与人员：** 产品团队、开发团队、设计团队

## 会议议程
![[meeting-agenda-q1.xmind]]

## 讨论要点
![[discussion-points.xmind]]

## 决策结果
![[decisions-made.xmind]]

## 行动计划
![[action-plan-q1.xmind]]

## 下次会议安排
- **时间：** 2024-01-29 14:00
- **议题：** 第一季度进展回顾
```

## 🔍 高级技巧

### 1. 批量处理 XMind 文件

```markdown
<!-- 在一个页面中展示多个相关的思维导图 -->
# 产品设计全览

## 用户体验设计
![[ux-design.xmind]]

## 界面设计
![[ui-design.xmind]]

## 交互设计
![[interaction-design.xmind]]

## 用户研究
![[user-research.xmind]]
```

### 2. 结合其他插件

**与 Dataview 插件结合：**
```markdown
# 项目思维导图索引

```dataview
LIST
FROM "mindmaps"
WHERE file.extension = "xmind"
SORT file.name ASC
```

**与 Templater 插件结合：**
```markdown
# 会议记录模板

**会议主题：** <% tp.system.prompt("会议主题") %>
**会议时间：** <% tp.date.now() %>

## 会议思维导图
![[<% tp.system.prompt("思维导图文件名") %>.xmind]]
```

### 3. 组织结构建议

```
your-vault/
├── 01-Projects/
│   ├── project-a/
│   │   ├── architecture.xmind
│   │   ├── timeline.xmind
│   │   └── project-a-overview.md
│   └── project-b/
├── 02-Learning/
│   ├── computer-science/
│   │   ├── algorithms.xmind
│   │   ├── data-structures.xmind
│   │   └── cs-notes.md
├── 03-Meetings/
│   ├── 2024-q1/
│   │   ├── meeting-01-15.xmind
│   │   └── meeting-notes.md
└── 99-Templates/
    ├── project-template.md
    └── meeting-template.md
```

## 🐛 故障排除

### 常见问题及解决方案

#### 1. 插件无法加载

**症状：** 插件列表中显示但无法启用

**解决方案：**
1. 检查控制台错误：`Ctrl+Shift+I` → Console
2. 重新构建插件：`bun run build`
3. 检查文件权限
4. 重启 Obsidian

#### 2. XMind 文件无法预览

**症状：** 点击文件后显示加载错误

**可能原因及解决方案：**

**网络问题：**
```bash
# 测试网络连接
curl -I https://unpkg.com/xmind-embed-viewer/dist/umd/xmind-embed-viewer.js
```

**文件格式问题：**
- 确保文件是有效的 XMind 格式
- 尝试在 XMind 应用中打开验证

**权限问题：**
```bash
# 检查文件权限
ls -la your-file.xmind
```

#### 3. 缩略图不显示

**症状：** Markdown 中嵌入显示空白

**解决方案：**
1. 检查 XMind 文件是否包含缩略图
2. 手动提取缩略图：`Ctrl+P` → "提取 XMind 缩略图"
3. 检查缓存目录权限
4. 清理并重新生成缓存

#### 4. 系统集成不工作

**症状：** "在 XMind 中打开" 按钮无响应

**解决方案：**
1. 确保系统中安装了 XMind 应用
2. 检查插件设置中是否启用系统集成
3. 在不同操作系统上验证兼容性

#### 5. 性能问题

**症状：** 大文件加载缓慢或卡顿

**优化方案：**
1. 减小 XMind 文件大小
2. 避免在单页面嵌入过多文件
3. 定期清理缓存
4. 调整区域设置以优化网络加载

### 调试模式

**启用详细日志：**
1. 打开开发者工具：`Ctrl+Shift+I`
2. 在 Console 中运行：
   ```javascript
   // 启用调试模式
   window.xmindViewerDebug = true;
   
   // 查看插件状态
   console.log(app.plugins.plugins['xmind-linker']);
   ```

## 📈 性能优化

### 最佳实践

1. **文件大小管理**
   - 保持 XMind 文件在 10MB 以下
   - 定期清理不必要的内容

2. **缓存管理**
   - 定期运行缓存清理命令
   - 监控缓存目录大小

3. **网络优化**
   - 根据地理位置选择合适的区域设置
   - 在网络较差时考虑本地化部署

4. **使用模式**
   - 避免在单个页面嵌入过多 XMind 文件
   - 使用链接而不是嵌入来引用大型文件

## 🔄 更新和维护

### 插件更新

1. **检查更新**
   - 定期查看 GitHub 仓库的新版本
   - 关注 Release Notes 了解新功能

2. **更新步骤**
   ```bash
   git pull origin main
   bun install
   bun run build
   ./install.sh
   ```

3. **备份设置**
   - 更新前备份插件设置
   - 记录自定义配置

### 数据备份

**重要文件：**
- XMind 源文件
- 缩略图缓存（可选）
- 插件设置

**备份建议：**
```bash
# 备份 XMind 文件
cp -r mindmaps/ backup/mindmaps-$(date +%Y%m%d)/

# 备份缓存（可选）
cp -r .xmind-thumbnails/ backup/thumbnails-$(date +%Y%m%d)/
```

---

## 🎉 结语

Obsidian XMind Viewer 插件让你能够在知识管理工作流中无缝集成思维导图，提升笔记的视觉表达力和组织结构。

**需要帮助？**
- 📖 查看 [README.md](README.md) 了解项目概述
- 🚀 查看 [DEPLOYMENT.md](DEPLOYMENT.md) 了解详细部署信息
- 🐛 遇到问题？在 [GitHub Issues](https://github.com/yourusername/obsidian-xmind-linker/issues) 中反馈
- 💡 有建议？欢迎提交 Pull Request

**享受使用 XMind 与 Obsidian 的完美结合！** 🎨✨ 