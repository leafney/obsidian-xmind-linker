#!/bin/bash

# 构建测试脚本
# 验证插件是否能够正确构建

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 检查必要文件
check_source_files() {
    local missing_files=()
    
    # 检查关键源文件
    local required_files=(
        "package.json"
        "manifest.json"
        "main.ts"
        "tsconfig.json"
        "esbuild.config.mjs"
        "styles.css"
        "src/types/index.ts"
        "src/core/settings.ts"
        "src/file-handler/xmind-parser.ts"
        "src/file-handler/thumbnail-extractor.ts"
        "src/viewer/xmind-viewer.ts"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            missing_files+=("$file")
        fi
    done
    
    if [[ ${#missing_files[@]} -gt 0 ]]; then
        print_error "缺少必要文件:"
        for file in "${missing_files[@]}"; do
            echo "  - $file"
        done
        return 1
    fi
    
    print_success "所有必要源文件存在"
    return 0
}

# 检查 package.json
check_package_json() {
    if ! command -v jq >/dev/null 2>&1; then
        print_warning "jq 未安装，跳过 package.json 验证"
        return 0
    fi
    
    local name=$(jq -r '.name' package.json)
    local version=$(jq -r '.version' package.json)
    local main=$(jq -r '.main' package.json)
    
    if [[ "$name" != "obsidian-xmind-viewer" ]]; then
        print_error "package.json 中的 name 不正确: $name"
        return 1
    fi
    
    if [[ "$main" != "main.js" ]]; then
        print_error "package.json 中的 main 不正确: $main"
        return 1
    fi
    
    print_success "package.json 验证通过 (v$version)"
    return 0
}

# 检查 manifest.json
check_manifest() {
    if ! command -v jq >/dev/null 2>&1; then
        print_warning "jq 未安装，跳过 manifest.json 验证"
        return 0
    fi
    
    local id=$(jq -r '.id' manifest.json)
    local name=$(jq -r '.name' manifest.json)
    local version=$(jq -r '.version' manifest.json)
    
    if [[ "$id" != "obsidian-xmind-viewer" ]]; then
        print_error "manifest.json 中的 id 不正确: $id"
        return 1
    fi
    
    if [[ "$name" != "XMind Viewer" ]]; then
        print_error "manifest.json 中的 name 不正确: $name"
        return 1
    fi
    
    print_success "manifest.json 验证通过 (v$version)"
    return 0
}

# 检查 TypeScript 配置
check_typescript() {
    if ! command -v jq >/dev/null 2>&1; then
        print_warning "jq 未安装，跳过 TypeScript 配置验证"
        return 0
    fi
    
    local target=$(jq -r '.compilerOptions.target' tsconfig.json)
    local module=$(jq -r '.compilerOptions.module' tsconfig.json)
    
    if [[ "$target" != "ES6" ]]; then
        print_warning "TypeScript target 不是 ES6: $target"
    fi
    
    if [[ "$module" != "ESNext" ]]; then
        print_warning "TypeScript module 不是 ESNext: $module"
    fi
    
    print_success "TypeScript 配置验证通过"
    return 0
}

# 安装依赖
install_dependencies() {
    print_info "正在安装依赖..."
    
    if command -v bun >/dev/null 2>&1; then
        bun install
    elif command -v npm >/dev/null 2>&1; then
        npm install
    else
        print_error "未找到 bun 或 npm"
        return 1
    fi
    
    print_success "依赖安装完成"
    return 0
}

# 构建插件
build_plugin() {
    print_info "正在构建插件..."
    
    if command -v bun >/dev/null 2>&1; then
        bun run build
    elif command -v npm >/dev/null 2>&1; then
        npm run build
    else
        print_error "未找到 bun 或 npm"
        return 1
    fi
    
    print_success "插件构建完成"
    return 0
}

# 验证构建结果
verify_build() {
    local missing_files=()
    local required_files=("main.js" "manifest.json" "styles.css")
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            missing_files+=("$file")
        fi
    done
    
    if [[ ${#missing_files[@]} -gt 0 ]]; then
        print_error "构建失败，缺少文件:"
        for file in "${missing_files[@]}"; do
            echo "  - $file"
        done
        return 1
    fi
    
    # 检查文件大小
    local main_size=$(stat -c%s main.js 2>/dev/null || stat -f%z main.js 2>/dev/null || echo "0")
    if [[ "$main_size" -lt 1000 ]]; then
        print_warning "main.js 文件可能太小 (${main_size} bytes)"
    fi
    
    print_success "构建验证通过"
    echo "  - main.js: ${main_size} bytes"
    echo "  - manifest.json: ✓"
    echo "  - styles.css: ✓"
    
    return 0
}

# 主函数
main() {
    echo "=========================================="
    echo "  Obsidian XMind Viewer Plugin 构建测试"
    echo "=========================================="
    echo
    
    # 检查源文件
    if ! check_source_files; then
        exit 1
    fi
    
    # 检查配置文件
    check_package_json
    check_manifest
    check_typescript
    
    # 安装依赖
    if ! install_dependencies; then
        exit 1
    fi
    
    # 构建插件
    if ! build_plugin; then
        exit 1
    fi
    
    # 验证构建结果
    if ! verify_build; then
        exit 1
    fi
    
    echo
    print_success "🎉 所有测试通过！插件已准备就绪"
    echo
    echo "下一步:"
    echo "1. 运行 ./install.sh 安装到 Obsidian"
    echo "2. 或手动复制 main.js, manifest.json, styles.css 到插件目录"
    echo "3. 在 Obsidian 中启用插件"
    echo
}

# 运行主函数
main "$@" 