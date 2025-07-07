#!/bin/bash

# XMind Linker Plugin 测试构建脚本

echo "🚀 开始构建和测试 XMind Linker 插件..."

# 检查依赖
echo "📦 检查依赖..."
if ! command -v bun &> /dev/null; then
    echo "❌ Bun 未安装，请先安装 Bun"
    exit 1
fi

# 安装依赖
echo "📥 安装依赖..."
bun install

# 构建插件
echo "🔨 构建插件..."
bun run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
fi

echo "✅ 构建成功"

# 检查构建产物
echo "🔍 检查构建产物..."
if [ -f "main.js" ] && [ -f "manifest.json" ] && [ -f "styles.css" ]; then
    echo "✅ 所有必需文件都已生成"
else
    echo "❌ 缺少必需的构建文件"
    exit 1
fi

# 功能测试清单
echo ""
echo "🧪 功能测试清单："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 缩略图功能测试："
echo "  ☐ 1. 在 Markdown 中嵌入 XMind 文件: ![[test.xmind]]"
echo "  ☐ 2. 验证缩略图自动提取和显示"
echo "  ☐ 3. 测试加载指示器显示"
echo "  ☐ 4. 测试 fallback 图标显示（当缩略图提取失败时）"
echo "  ☐ 5. 测试错误状态显示"
echo "  ☐ 6. 验证点击缩略图打开 XMind 查看器"
echo ""
echo "⚙️ 设置功能测试："
echo "  ☐ 1. 测试'启用缩略图提取'开关"
echo "  ☐ 2. 测试'启用缩略图备用方案'开关"
echo "  ☐ 3. 测试'显示加载指示器'开关"
echo "  ☐ 4. 调整缩略图最大宽度和高度设置"
echo "  ☐ 5. 测试缩略图质量设置（低/中/高）"
echo "  ☐ 6. 调整最大缓存大小设置"
echo "  ☐ 7. 测试缓存统计信息显示"
echo "  ☐ 8. 测试缓存清理功能"
echo ""
echo "🎨 样式和交互测试："
echo "  ☐ 1. 测试缩略图悬停效果"
echo "  ☐ 2. 测试质量指示器显示"
echo "  ☐ 3. 测试信息覆盖层"
echo "  ☐ 4. 测试响应式设计（不同屏幕尺寸）"
echo "  ☐ 5. 测试暗色主题适配"
echo "  ☐ 6. 测试高对比度模式"
echo "  ☐ 7. 测试减少动画模式"
echo ""
echo "🔧 缓存和性能测试："
echo "  ☐ 1. 测试缓存机制（重复打开同一文件）"
echo "  ☐ 2. 测试缓存大小限制"
echo "  ☐ 3. 测试缓存清理策略"
echo "  ☐ 4. 测试文件修改后缓存更新"
echo "  ☐ 5. 验证性能优化（大文件处理）"
echo ""
echo "🚨 错误处理测试："
echo "  ☐ 1. 测试不存在的 XMind 文件"
echo "  ☐ 2. 测试损坏的 XMind 文件"
echo "  ☐ 3. 测试网络错误情况"
echo "  ☐ 4. 测试权限错误处理"
echo "  ☐ 5. 验证错误消息的友好性"
echo ""
echo "🔄 兼容性测试："
echo "  ☐ 1. 测试与现有 XMind 查看功能的兼容性"
echo "  ☐ 2. 测试多语言支持（中英文）"
echo "  ☐ 3. 测试不同版本 XMind 文件格式"
echo "  ☐ 4. 测试与其他插件的兼容性"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 测试步骤："
echo "1. 将插件文件复制到 Obsidian 插件目录"
echo "2. 重启 Obsidian 或重新加载插件"
echo "3. 在设置中启用 XMind Linker 插件"
echo "4. 按照上述清单逐项测试功能"
echo "5. 记录任何问题或异常行为"
echo ""
echo "🎯 关键验证点："
echo "• 缩略图是否正确显示"
echo "• 加载状态是否流畅"
echo "• Fallback 机制是否正常工作"
echo "• 设置更改是否立即生效"
echo "• 缓存管理是否有效"
echo "• 错误处理是否友好"
echo ""
echo "✅ 构建完成！请按照测试清单验证功能。" 