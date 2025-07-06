# 安装和使用指南

## 🚀 快速开始

### 1. 安装依赖

确保你已经安装了 [Bun](https://bun.sh/)：

```bash
# 安装 Bun (如果还没有安装)
curl -fsSL https://bun.sh/install | bash

# 安装项目依赖
bun install
```

### 2. 构建插件

```bash
# 开发模式 (监听文件变化)
bun run dev

# 或者构建生产版本
bun run build
```

### 3. 安装到 Obsidian

#### 方法一：开发模式
1. 在你的 Obsidian 库中创建插件目录: `.obsidian/plugins/xmind-linker/`
2. 将构建好的文件复制到该目录：
   - `main.js`
   - `manifest.json`
   - `styles.css`

#### 方法二：符号链接 (推荐开发者)
```bash
# 在 Obsidian 插件目录中创建符号链接
ln -s /path/to/obsidian-xmind-linker /path/to/your-vault/.obsidian/plugins/xmind-linker
```

### 4. 启用插件

1. 打开 Obsidian
2. 进入 设置 → 第三方插件
3. 关闭安全模式
4. 在插件列表中找到 "XMind Viewer" 并启用

## 🔧 开发环境设置

### 目录结构

```
obsidian-xmind-linker/
├── src/                    # 源代码
│   ├── core/              # 核心逻辑
│   ├── file-handler/      # 文件处理
│   ├── viewer/            # 预览组件
│   ├── ui/                # 用户界面
│   └── types/             # 类型定义
├── main.ts                # 插件入口
├── manifest.json          # 插件配置
├── package.json           # 项目配置
├── tsconfig.json          # TypeScript配置
├── esbuild.config.mjs     # 构建配置
└── styles.css             # 样式文件
```

### 调试方法

1. **启用开发者工具**
   - 在 Obsidian 中按 `Ctrl+Shift+I` (Windows/Linux) 或 `Cmd+Opt+I` (Mac)

2. **查看控制台输出**
   - 所有 `console.log` 输出都会显示在控制台中

3. **热重载**
   - 使用 `bun run dev` 启动开发模式
   - 修改代码后会自动重新构建
   - 在 Obsidian 中按 `Ctrl+R` 重新加载插件

### 测试 XMind 文件

1. 准备一些测试用的 `.xmind` 文件
2. 将它们放在你的 Obsidian 库中
3. 尝试以下操作：
   - 直接打开 XMind 文件
   - 在 Markdown 中嵌入: `![[test.xmind]]`
   - 测试悬停提示和系统集成功能

## 🛠️ 常见问题

### Q: 插件无法加载
**A:** 检查以下几点：
1. 确保 `main.js` 文件存在且没有语法错误
2. 检查 `manifest.json` 格式是否正确
3. 在开发者工具中查看是否有错误信息

### Q: XMind 文件无法预览
**A:** 可能的原因：
1. 网络问题，无法加载 xmind-embed-viewer 库
2. XMind 文件格式不支持
3. 检查控制台是否有错误信息

### Q: 缩略图提取失败
**A:** 检查：
1. XMind 文件是否包含缩略图
2. 缓存目录是否有写入权限
3. 文件是否已损坏

### Q: 系统集成不工作
**A:** 确保：
1. 系统中已安装 XMind 应用
2. 在插件设置中启用了系统集成
3. 操作系统支持 `shell.openPath` API

## 📚 扩展开发

### 添加新功能

1. 在 `src/` 目录中创建新的模块
2. 在 `main.ts` 中注册新功能
3. 更新类型定义 (`src/types/index.ts`)
4. 添加相应的样式 (`styles.css`)

### 自定义设置

1. 在 `src/types/index.ts` 中扩展 `XMindViewerSettings` 接口
2. 在 `src/core/settings.ts` 中添加新的设置项
3. 在 `DEFAULT_SETTINGS` 中设置默认值

### 添加新的命令

```typescript
// 在 main.ts 的 registerCommands 方法中
this.addCommand({
  id: 'your-command-id',
  name: '你的命令名称',
  callback: () => {
    // 命令逻辑
  }
});
```

## 🎯 发布准备

### 构建发布版本

```bash
# 构建生产版本
bun run build

# 检查构建输出
ls -la main.js manifest.json styles.css
```

### 版本管理

```bash
# 更新版本号
npm version patch  # 或 minor, major

# 这会自动更新 manifest.json 和 versions.json
```

### 发布到 GitHub

1. 创建 GitHub Release
2. 上传以下文件：
   - `main.js`
   - `manifest.json`
   - `styles.css`

---

**祝你开发愉快！** 🚀 