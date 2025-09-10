#!/bin/bash

# Obsidian插件版本更新脚本
# 用法: ./update-version.sh 1.1.0

if [ $# -eq 0 ]; then
    echo "错误: 请提供版本号"
    echo "用法: $0 <版本号>"
    echo "示例: $0 1.1.0"
    exit 1
fi

VERSION=$1

# 检查版本号格式 (简单验证)
if [[ ! $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "错误: 版本号格式不正确，应为 x.y.z 格式"
    echo "示例: 1.0.0, 2.1.3"
    exit 1
fi

echo "正在更新版本号到 $VERSION..."

# 检查manifest.json文件是否存在
if [ ! -f "manifest.json" ]; then
    echo "错误: 找不到 manifest.json 文件"
    exit 1
fi

# 更新manifest.json中的版本号
if command -v jq &> /dev/null; then
    # 如果有jq命令，使用jq更新
    jq ".version = \"$VERSION\"" manifest.json > manifest.json.tmp && mv manifest.json.tmp manifest.json
else
    # 使用sed更新 (macOS兼容)
    sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" manifest.json
fi

# 检查是否更新成功
if grep -q "\"version\": \"$VERSION\"" manifest.json; then
    echo "✅ 已更新 manifest.json 版本号为 $VERSION"
else
    echo "❌ 更新失败"
    exit 1
fi

# 提交更改
echo "正在提交更改..."
git add manifest.json

if git commit -m "chore: update manifest version to $VERSION"; then
    echo "✅ 已提交更改"
else
    echo "⚠️  提交失败或无更改"
fi

# 推送到远程仓库
echo "正在推送到远程仓库..."
if git push; then
    echo "✅ 已推送到远程仓库"
    echo ""
    echo "🎉 版本更新完成！"
    echo "📋 下一步："
    echo "   1. 检查 GitHub 上的 manifest.json 是否已更新"
    echo "   2. 确认 Obsidian 官方商店可以获取到新版本"
else
    echo "❌ 推送失败，请检查网络连接和仓库权限"
    exit 1
fi