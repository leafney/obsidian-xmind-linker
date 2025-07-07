# 📋 XMind Linker 发布检查清单

## 🚀 快速发布指南

### 1. 发布准备
```bash
# 运行自动化发布脚本
./scripts/prepare-release.sh 1.0.1

# 或手动执行以下步骤：
git status                    # 确保工作目录干净
git checkout main            # 切换到主分支
bun install                  # 安装依赖
bun test                     # 运行测试
bun run build               # 构建项目
```

### 2. 版本发布
```bash
# 自动发布（推荐）
./scripts/prepare-release.sh 1.0.1

# 手动发布
git add .
git commit -m "chore: bump version to 1.0.1"
git tag v1.0.1
git push origin main
git push origin v1.0.1
```

### 3. 验证发布
- [ ] 访问 [GitHub Actions](../../actions) 查看构建状态
- [ ] 检查 [GitHub Releases](../../releases) 页面
- [ ] 下载并测试发布的插件包

## ✅ 发布前检查清单

### 代码质量
- [ ] 所有测试通过 (`bun test`)
- [ ] 构建成功 (`bun run build`)
- [ ] 代码已提交且工作目录干净
- [ ] 当前在 `main` 分支

### 版本管理
- [ ] 版本号遵循语义化版本控制 (x.y.z)
- [ ] 版本号未与现有标签冲突
- [ ] `package.json` 版本号正确
- [ ] `manifest.json` 版本号正确
- [ ] `versions.json` 已更新

### 文档更新
- [ ] README.md 功能描述准确
- [ ] CHANGELOG.md 包含最新更改
- [ ] 使用指南已更新
- [ ] API 文档已更新（如有）

### 功能验证
- [ ] 核心功能正常工作
- [ ] XMind 文件查看功能正常
- [ ] 缩略图提取功能正常
- [ ] 系统集成功能正常
- [ ] 多语言支持正常

### 兼容性检查
- [ ] 最低 Obsidian 版本兼容性
- [ ] 不同操作系统兼容性
- [ ] 主要浏览器兼容性

## 🔧 发布后验证清单

### GitHub Release
- [ ] Release 页面创建成功
- [ ] 版本号显示正确
- [ ] 发布说明完整准确
- [ ] 所有文件已上传：
  - [ ] `xmind-linker-{version}.zip`
  - [ ] `main.js`
  - [ ] `manifest.json`
  - [ ] `styles.css`

### 功能测试
- [ ] 下载发布包并解压
- [ ] 安装到 Obsidian 插件目录
- [ ] 启用插件成功
- [ ] 基本功能测试通过
- [ ] 设置页面正常显示

### 社区准备
- [ ] 发布公告准备就绪
- [ ] 社交媒体推广内容准备
- [ ] 社区插件商店提交准备（如适用）

## 🚨 紧急回滚程序

如果发布后发现严重问题：

### 1. 立即回滚
```bash
# 删除有问题的标签
git tag -d v1.0.1
git push origin :refs/tags/v1.0.1

# 在 GitHub 上标记 Release 为 pre-release 或删除
```

### 2. 修复问题
```bash
# 修复代码
# 运行测试确保问题解决
bun test

# 发布修复版本
./scripts/prepare-release.sh 1.0.2
```

### 3. 通知用户
- 在 GitHub Issues 中发布公告
- 更新文档说明已知问题
- 在社区中通知用户

## 📊 版本规划

### 版本类型
- **补丁版本** (1.0.x): Bug 修复、性能优化
- **次要版本** (1.x.0): 新功能、向下兼容改进
- **主要版本** (x.0.0): 重大更改、可能破坏兼容性

### 发布频率
- **紧急修复**: 随时发布
- **常规补丁**: 每 1-2 周
- **功能更新**: 每 1-2 月
- **大版本**: 每 6-12 月

## 🔗 相关资源

### 文档链接
- [完整部署指南](DEPLOYMENT.md)
- [使用指南](USAGE_GUIDE.md)
- [安装说明](INSTALL.md)

### 工具链接
- [GitHub Actions](../../actions)
- [GitHub Releases](../../releases)
- [Issues 页面](../../issues)

### 自动化脚本
- `./scripts/prepare-release.sh` - 发布准备脚本
- `node version-bump.mjs` - 版本更新脚本
- `bun run build` - 构建脚本

## 💡 最佳实践

### 发布时机
- **避免周五发布**: 减少周末紧急修复需求
- **选择工作时间**: 便于及时响应问题
- **避开节假日**: 确保团队可用性

### 沟通策略
- **提前通知**: 重大更新提前 1-2 天通知
- **清晰描述**: 发布说明详细描述更改内容
- **用户反馈**: 积极回应用户问题和建议

### 质量保证
- **多环境测试**: 在不同环境中测试
- **渐进发布**: 重大更新考虑分阶段发布
- **监控指标**: 跟踪下载量、错误率等指标

---

**模板版本**: v1.0  
**最后更新**: 2024-01-XX  
**维护者**: Leafney 