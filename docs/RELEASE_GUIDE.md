# 发布指南

## 自动化发布流程

本项目使用 GitHub Actions 实现自动化发布，当推送 Git 标签时会自动触发构建和发布流程。

## 发布步骤

### 1. 准备发布

确保所有代码已提交并推送到 main 分支：

```bash
git status
git add .
git commit -m "feat: 准备发布新版本"
git push origin main
```

### 2. 创建并推送标签

```bash
# 创建标签（可以使用 v 前缀，如 v1.0.1 或直接 1.0.1）
git tag v1.0.1

# 推送标签到远程仓库
git push origin v1.0.1
```

### 3. 自动构建和发布

推送标签后，GitHub Actions 会自动：

1. 从标签名中提取版本号（自动去掉 v 前缀）
2. 更新 `manifest.json` 中的版本号
3. 更新 `versions.json` 文件
4. 安装依赖
5. 构建插件
6. 创建 GitHub Release
7. 上传构建文件：
   - `main.js` - 插件主文件
   - `manifest.json` - 插件清单
   - `styles.css` - 样式文件

## 发布文件说明

发布完成后，用户可以从 GitHub Releases 页面下载以下文件：

- **main.js** - 插件的主要代码文件
- **manifest.json** - 包含插件元信息的清单文件
- **styles.css** - 插件的样式文件

用户需要将这些文件放置到 Obsidian 插件目录：`{vault}/.obsidian/plugins/xmind-linker/`

## 版本号规范

使用语义化版本控制：

- **v1.0.0** - 主版本号（重大更改）
- **v1.1.0** - 次版本号（新功能）
- **v1.0.1** - 补丁版本号（Bug 修复）

## 版本处理机制

- **支持 v 前缀**：可以使用 `v1.0.1` 或 `1.0.1` 格式的标签
- **自动处理**：GitHub Actions 会自动去掉 v 前缀并更新相关文件
- **文件更新**：自动更新 `manifest.json` 和 `versions.json` 中的版本号

## 注意事项

1. 可以继续使用习惯的 v 前缀标签（如 v1.0.1）
2. 推送标签前请确保代码已经测试通过
3. 发布后检查 GitHub Releases 页面确认文件正确上传
4. `manifest.json` 中的版本号会被自动更新，无需手动修改

## 故障排除

如果发布失败：

1. 检查 GitHub Actions 日志
2. 确认标签格式正确（支持 v1.0.1 或 1.0.1 格式）
3. 检查构建脚本是否正常运行
4. 确认版本号格式符合语义化版本控制规范

删除错误的标签：

```bash
# 删除本地标签
git tag -d v1.0.1

# 删除远程标签
git push origin :refs/tags/v1.0.1
``` 