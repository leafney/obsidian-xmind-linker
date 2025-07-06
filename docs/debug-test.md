# XMind Linker 调试测试指南

## 问题1：点击文件后无法立即预览查看到 XMind 文件的内容

### 最新修复内容 (v2)
1. **添加 onLoadFile 方法**: 实现 Obsidian 文件关联的标准接口
2. **移除冲突的事件监听器**: 避免与文件关联机制冲突
3. **增强文件检测**: 多种方式尝试获取文件信息
4. **详细调试日志**: 添加完整的调试信息输出

### 测试步骤
1. 安装插件：
   ```bash
   ./install.sh
   ```

2. 在 Obsidian 中启用插件

3. 准备测试文件：确保有一个有效的 .xmind 文件

4. **重要**: 打开 Obsidian 开发者工具（`Ctrl+Shift+I`）查看控制台

5. 测试直接点击文件：
   - 在左侧文件浏览器中点击 .xmind 文件
   - 观察右侧是否出现预览窗口
   - **关键**: 查看控制台输出

### 预期的调试日志输出

#### 直接点击文件时应该看到：
```
XMindView 构造函数被调用
leaf: [WorkspaceLeaf object]
settings: [XMindViewerSettings object]
XMindView onOpen 被调用
当前 leaf: [WorkspaceLeaf object]
当前 xmindFile: null
XMindView onLoadFile 被调用: your-file.xmind
开始加载 XMind 文件: your-file.xmind
文件读取完成，大小: [文件大小]
文件验证通过
开始加载 XMind 查看器库...
XMind 查看器库加载成功
查看器库加载完成
查看器初始化完成
文件加载到查看器完成
XMind 文件加载完成
```

#### 如果 onLoadFile 没有被调用，会看到：
```
XMindView 构造函数被调用
XMindView onOpen 被调用
当前 xmindFile: null
从 leaf.file 获取文件: your-file.xmind  (或其他获取方式)
开始加载 XMind 文件: your-file.xmind
[后续加载日志...]
```

#### 如果都失败，会看到：
```
XMindView 构造函数被调用
XMindView onOpen 被调用
当前 xmindFile: null
没有找到要加载的文件
leaf 详细信息: [详细信息]
leaf.file: [文件信息]
activeFile: [活动文件信息]
```

### 故障排除

#### 情况1：看到 "onLoadFile 被调用" 但文件加载失败
- **原因**: 文件加载过程中出错
- **检查**: 查看后续的错误日志
- **解决**: 检查文件格式、网络连接等

#### 情况2：没有看到 "onLoadFile 被调用"
- **原因**: Obsidian 文件关联机制问题
- **检查**: 查看 "从 leaf.file 获取文件" 或其他获取方式
- **解决**: 可能需要手动触发

#### 情况3：完全没有日志输出
- **原因**: 插件没有正确加载或视图没有创建
- **检查**: 确认插件已启用，查看 Obsidian 插件设置
- **解决**: 重启 Obsidian，重新安装插件

### 对比测试

**嵌入预览点击（应该正常工作）**:
1. 在 Markdown 文档中添加 `![[your-file.xmind]]`
2. 点击预览按钮
3. 应该看到正常的加载日志和内容

**直接文件点击（我们要修复的）**:
1. 在文件浏览器中点击 .xmind 文件
2. 现在应该也看到类似的加载日志和内容

## ✅ 问题1已解决：加载优化

### 最新修复内容 (v4) - 重要修复
**问题诊断**: Loading 界面没有显示的原因是在创建 viewer 时错误地清空了包含 loading 界面的容器。

**修复方案**:
1. **容器管理优化**: 创建隐藏的 viewer 容器，避免清空 loading 界面
2. **智能显示切换**: loading 完成后隐藏 loading 界面，显示 viewer 容器
3. **优雅的过渡动画**: loading 淡出 + viewer 淡入
4. **关于 iframe 警告**: `iframe-controller.ts:21 Unrecognized feature: 'allowfullscreen'` 来自 xmind-embed-viewer 库内部，不影响功能

### 技术改进
1. **智能加载状态管理**: 等待 `map-ready` 事件才隐藏加载界面
2. **美化加载界面**: 更大的加载动画、渐变进度条、动态提示
3. **优雅的完成动画**: 显示"加载完成"并淡出
4. **智能超时处理**: 10秒超时保护，防止界面卡住

### 优化效果
- **更好的视觉反馈**: 用户能清楚看到加载进度
- **减少等待焦虑**: 动态提示告诉用户当前在做什么
- **完美的时机**: 只有在内容真正渲染完成后才隐藏加载界面
- **备用保护**: 即使事件没触发也有超时保护

### 预期体验
1. 点击 XMind 文件 → 立即显示美观的加载界面
2. 进度条逐步推进，提示信息动态更新
3. 文件加载完成后显示"等待渲染完成..."
4. 思维导图渲染完成后显示"加载完成！"并淡出
5. 最终显示完整的 XMind 内容

## ✅ 问题2已解决：预览窗口大小优化

### 最新优化内容 (v5)
1. **容器样式优化**: 
   - 改用 `position: absolute` 占满整个 Obsidian 窗口
   - 移除边框和圆角，实现无缝显示
   - 优化 flexbox 布局确保内容占满空间

2. **XMind Viewer 配置优化**:
   - 添加 `width: '100%'` 和 `height: '100%'` 配置
   - 强制所有内部元素占满容器 (`!important` 样式)
   - 移除可能的边距和填充

3. **动态大小调整**:
   - 监听窗口 resize 事件
   - 地图加载完成后自动调用 `setFitMap()`
   - 添加 `resizeViewer()` 方法处理大小变化

4. **样式强化**:
   - 针对 iframe、canvas、svg 等元素强制全尺寸
   - 确保 XMind 内容完全填充容器
   - 优化 box-sizing 为 border-box

### 预期效果
- XMind 预览占满整个 Obsidian 窗口
- 随着窗口大小变化自动调整
- 无边框、无间隙的沉浸式体验

## ✅ 问题2.1已解决：工具栏布局优化

### 最新优化内容 (v7) - 精确修复
**问题**: 内容占满窗口后，工具栏被遮挡，XMind 内置工具栏与 Obsidian 底部菜单冲突。

**解决方案**:
1. **工具栏绝对定位**:
   - 使用 `position: absolute` 固定在底部左侧
   - 设置 `bottom: 0` 确保显示在最底部
   - 左对齐 (`justify-content: flex-start`) 显示按钮

2. **内容区域调整**:
   - 内容高度改为 `calc(100% - 60px)` 为工具栏留出空间
   - 避免内容与工具栏重叠

3. **XMind 内置工具栏调整**:
   - CSS 强制设置 `bottom: 80px` 上移工具栏
   - JavaScript 动态监听和调整工具栏位置
   - 使用 MutationObserver 监听动态添加的元素

4. **样式强化**:
   - 提高 z-index 到 1001 确保显示在最上层
   - 更广泛的选择器覆盖各种工具栏元素

### 预期效果
- "在 XMind 中打开" 和 "适应窗口" 按钮显示在底部左侧
- XMind 内置工具栏上移 80px，不与 Obsidian 菜单冲突
- 所有工具栏都清晰可见，无遮挡

### 下一步
继续修复剩余问题：
3. ⏳ **重复打开窗口问题** - 防止同一文件打开多次
4. ⏳ **窗口标题显示问题** - 正确显示文件名

请测试新的工具栏布局效果！ 