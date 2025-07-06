# XMind 查看器调试测试指南

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

### 下一步
如果这个修复有效，我们将继续修复其他问题：
2. 预览窗口大小问题
3. 重复打开窗口问题
4. 窗口标题显示问题

请测试后告诉我具体的控制台输出内容！ 