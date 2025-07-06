# 🚀 插件打包、安装和测试指南

## 📦 第一步：打包插件

### 1.1 安装依赖

```bash
# 确保你在项目根目录
cd obsidian-xmind-linker

# 使用 Bun 安装依赖
bun install

# 如果没有安装 Bun，可以先安装
curl -fsSL https://bun.sh/install | bash
```

### 1.2 构建插件

```bash
# 构建生产版本
bun run build

# 检查构建结果
ls -la main.js manifest.json styles.css
```

**构建成功后，你应该看到以下文件：**
- `main.js` - 插件主要逻辑
- `manifest.json` - 插件配置文件
- `styles.css` - 样式文件

## 🔧 第二步：安装到 Obsidian

### 2.1 找到 Obsidian 插件目录

**Windows:**
```
C:\Users\{用户名}\AppData\Roaming\obsidian\{库名}\.obsidian\plugins\
```

**macOS:**
```
/Users/{用户名}/Library/Application Support/obsidian/{库名}/.obsidian/plugins/
```

**Linux:**
```
~/.config/obsidian/{库名}/.obsidian/plugins/
```

### 2.2 创建插件目录

```bash
# 在你的 Obsidian 库中创建插件目录
mkdir -p /path/to/your-vault/.obsidian/plugins/xmind-linker
```

### 2.3 复制文件

```bash
# 复制构建好的文件到插件目录
cp main.js manifest.json styles.css /path/to/your-vault/.obsidian/plugins/xmind-linker/
```

**或者使用符号链接（推荐开发者）：**
```bash
# 创建符号链接，方便开发调试
ln -s /path/to/obsidian-xmind-linker /path/to/your-vault/.obsidian/plugins/xmind-linker
```

## ⚙️ 第三步：在 Obsidian 中启用插件

### 3.1 打开 Obsidian 设置

1. 打开 Obsidian
2. 点击左下角的设置图标 ⚙️
3. 或使用快捷键 `Ctrl+,` (Windows/Linux) 或 `Cmd+,` (Mac)

### 3.2 启用第三方插件

1. 在左侧菜单中找到 **"第三方插件"**
2. 如果显示 **"安全模式"** 已启用，点击 **"关闭安全模式"**
3. 点击 **"已安装插件"** 选项卡

### 3.3 找到并启用插件

1. 在插件列表中找到 **"XMind Viewer"**
2. 点击插件右侧的开关按钮启用
3. 插件状态应该显示为 **"已启用"**

## 🧪 第四步：测试插件功能

### 4.1 准备测试文件

首先，你需要一些 XMind 文件来测试：

1. **下载示例 XMind 文件**
   - 从 [XMind 官网](https://www.xmind.net/) 下载示例文件
   - 或者创建一个简单的思维导图并保存为 `.xmind` 格式

2. **将 XMind 文件放入 Obsidian 库**
   ```bash
   # 将 XMind 文件复制到你的 Obsidian 库中
   cp /path/to/your-xmind-file.xmind /path/to/your-vault/
   ```

### 4.2 测试基本功能

#### 测试 1：直接打开 XMind 文件
1. 在 Obsidian 文件浏览器中找到 `.xmind` 文件
2. 双击文件，应该会在新的标签页中打开 XMind 预览
3. 检查是否能看到思维导图内容

#### 测试 2：Markdown 嵌入功能
1. 创建一个新的 Markdown 文件
2. 输入以下内容：
   ```markdown
   # XMind 测试
   
   这是一个嵌入的 XMind 文件：
   
   ![[your-xmind-file.xmind]]
   
   应该能看到缩略图预览。
   ```
3. 切换到预览模式，检查是否显示缩略图

#### 测试 3：悬停提示功能
1. 在预览模式下，将鼠标悬停在嵌入的 XMind 文件上
2. 应该会显示操作提示菜单
3. 包含"预览"和"在 XMind 中打开"按钮

#### 测试 4：系统集成功能
1. 点击悬停菜单中的"在 XMind 中打开"
2. 应该会调用系统默认的 XMind 应用打开文件
3. （需要系统中安装了 XMind 应用）

### 4.3 测试插件设置

1. 打开 Obsidian 设置
2. 找到 **"插件选项"** → **"XMind Viewer"**
3. 测试各种设置选项：
   - 启用/禁用缩略图提取
   - 切换默认区域（全球/中国大陆）
   - 启用/禁用悬停提示
   - 启用/禁用系统集成

### 4.4 测试命令功能

1. 打开命令面板 `Ctrl+P` (Windows/Linux) 或 `Cmd+P` (Mac)
2. 搜索 "XMind" 相关命令：
   - **"打开 XMind 文件"**
   - **"提取 XMind 缩略图"**
   - **"清理缩略图缓存"**
3. 测试每个命令是否正常工作

## 🐛 第五步：故障排除

### 5.1 插件无法加载

**检查控制台错误：**
1. 在 Obsidian 中按 `Ctrl+Shift+I` (Windows/Linux) 或 `Cmd+Opt+I` (Mac)
2. 查看 Console 标签页是否有错误信息
3. 常见错误及解决方案：

```javascript
// 错误：找不到模块
// 解决：检查 node_modules 是否正确安装
bun install

// 错误：语法错误
// 解决：重新构建插件
bun run build
```

### 5.2 XMind 文件无法预览

**可能的原因和解决方案：**

1. **网络问题**
   ```bash
   # 检查网络连接，确保能访问 CDN
   curl -I https://unpkg.com/xmind-embed-viewer/dist/umd/xmind-embed-viewer.js
   ```

2. **文件格式问题**
   - 确保是有效的 XMind 文件
   - 尝试在 XMind 应用中打开文件验证

3. **权限问题**
   ```bash
   # 检查文件权限
   ls -la your-xmind-file.xmind
   ```

### 5.3 缩略图提取失败

**检查步骤：**
1. 确保 XMind 文件包含缩略图
2. 检查缓存目录权限
3. 查看控制台错误信息

```javascript
// 在控制台中手动测试
console.log('Testing thumbnail extraction...');
```

### 5.4 系统集成不工作

**检查项目：**
1. 确保系统中安装了 XMind 应用
2. 检查操作系统兼容性
3. 验证 Electron API 可用性

## 📋 第六步：完整测试清单

### ✅ 基本功能测试
- [ ] 插件成功加载
- [ ] 直接打开 XMind 文件
- [ ] Markdown 中嵌入 XMind 文件
- [ ] 缩略图正确显示
- [ ] 悬停提示菜单显示
- [ ] 点击预览按钮工作
- [ ] 系统集成功能工作

### ✅ 设置功能测试
- [ ] 插件设置面板可以打开
- [ ] 各种设置选项可以修改
- [ ] 设置保存后生效
- [ ] 重启 Obsidian 后设置保持

### ✅ 命令功能测试
- [ ] 所有命令都能在命令面板中找到
- [ ] 命令执行正常
- [ ] 命令快捷键工作（如果有）

### ✅ 错误处理测试
- [ ] 无效 XMind 文件的错误提示
- [ ] 网络错误的处理
- [ ] 权限错误的处理

## 🎯 第七步：性能测试

### 7.1 大文件测试
```bash
# 测试大型 XMind 文件（>10MB）
# 观察加载时间和内存使用
```

### 7.2 多文件测试
```bash
# 在一个 Markdown 文件中嵌入多个 XMind 文件
# 检查性能和稳定性
```

### 7.3 长时间使用测试
```bash
# 长时间使用插件，观察是否有内存泄漏
# 检查缓存清理是否正常工作
```

## 📊 第八步：生产环境部署

### 8.1 创建发布包

```bash
# 创建发布目录
mkdir release

# 复制必要文件
cp main.js manifest.json styles.css release/

# 创建压缩包
cd release
zip -r obsidian-xmind-linker-v1.0.0.zip .
```

### 8.2 版本管理

```bash
# 更新版本号
npm version patch

# 提交更改
git add .
git commit -m "Release v1.0.0"
git tag v1.0.0
git push origin main --tags
```

### 8.3 GitHub Release

1. 在 GitHub 仓库中创建新的 Release
2. 上传 `obsidian-xmind-linker-v1.0.0.zip`
3. 填写 Release Notes

## 📝 第九步：文档和支持

### 9.1 用户文档

创建用户友好的文档：
- 安装指南
- 使用教程
- 常见问题解答
- 故障排除指南

### 9.2 开发者文档

为其他开发者提供：
- API 文档
- 扩展指南
- 贡献指南
- 代码规范

---

## 🎉 恭喜！

如果你完成了以上所有步骤，你的 Obsidian XMind Viewer 插件应该已经成功安装并可以正常使用了！

**遇到问题？**
- 检查控制台错误信息
- 查看 GitHub Issues
- 联系开发者获取支持

**想要贡献？**
- Fork 仓库
- 提交 Pull Request
- 报告 Bug 或建议新功能 