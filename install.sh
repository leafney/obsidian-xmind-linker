#!/bin/bash

# Obsidian XMind Linker Plugin 一键安装脚本
# 使用方法: ./install.sh [obsidian-vault-path]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的信息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查 Bun 是否安装
check_bun() {
    if ! command_exists bun; then
        print_warning "Bun 未安装，正在安装..."
        curl -fsSL https://bun.sh/install | bash
        export PATH="$HOME/.bun/bin:$PATH"
        
        if ! command_exists bun; then
            print_error "Bun 安装失败，请手动安装: https://bun.sh/"
            exit 1
        fi
    fi
    print_success "Bun 已安装: $(bun --version)"
}

# 构建插件
build_plugin() {
    print_info "正在安装依赖..."
    bun install
    
    print_info "正在构建插件..."
    bun run build
    
    # 检查构建结果
    if [[ ! -f "build/main.js" || ! -f "build/manifest.json" || ! -f "build/styles.css" ]]; then
        print_error "构建失败，缺少必要文件"
        exit 1
    fi
    
    print_success "插件构建完成"
}

# 查找 Obsidian 库
find_obsidian_vaults() {
    local vaults=()
    
    # 根据操作系统查找 Obsidian 库
    case "$(uname -s)" in
        Darwin)
            # macOS
            local obsidian_dir="$HOME/Library/Application Support/obsidian"
            ;;
        Linux)
            # Linux
            local obsidian_dir="$HOME/.config/obsidian"
            ;;
        CYGWIN*|MINGW32*|MSYS*|MINGW*)
            # Windows
            local obsidian_dir="$HOME/AppData/Roaming/obsidian"
            ;;
        *)
            print_error "不支持的操作系统"
            exit 1
            ;;
    esac
    
    if [[ -d "$obsidian_dir" ]]; then
        for vault in "$obsidian_dir"/*; do
            if [[ -d "$vault/.obsidian" ]]; then
                vaults+=("$vault")
            fi
        done
    fi
    
    echo "${vaults[@]}"
}

# 选择 Obsidian 库
select_vault() {
    local vault_path="$1"
    
    if [[ -n "$vault_path" ]]; then
        if [[ -d "$vault_path/.obsidian" ]]; then
            echo "$vault_path"
            return
        else
            print_error "指定的路径不是有效的 Obsidian 库: $vault_path"
            exit 1
        fi
    fi
    
    local vaults=($(find_obsidian_vaults))
    
    if [[ ${#vaults[@]} -eq 0 ]]; then
        print_error "未找到 Obsidian 库，请手动指定路径"
        echo "使用方法: $0 /path/to/your/obsidian/vault"
        exit 1
    elif [[ ${#vaults[@]} -eq 1 ]]; then
        echo "${vaults[0]}"
    else
        print_info "找到多个 Obsidian 库，请选择："
        for i in "${!vaults[@]}"; do
            echo "$((i+1)). $(basename "${vaults[$i]}")"
        done
        
        while true; do
            read -p "请输入选择 (1-${#vaults[@]}): " choice
            if [[ "$choice" =~ ^[0-9]+$ ]] && [[ "$choice" -ge 1 ]] && [[ "$choice" -le "${#vaults[@]}" ]]; then
                echo "${vaults[$((choice-1))]}"
                break
            else
                print_error "无效选择，请重新输入"
            fi
        done
    fi
}

# 安装插件到 Obsidian 库
install_plugin() {
    local vault_path="$1"
    local plugin_dir="$vault_path/.obsidian/plugins/xmind-linker"
    
    print_info "正在安装插件到: $vault_path"
    
    # 创建插件目录
    mkdir -p "$plugin_dir"
    
    # 复制文件
    cp build/main.js "$plugin_dir/"
    cp build/manifest.json "$plugin_dir/"
    cp build/styles.css "$plugin_dir/"
    
    print_success "插件已安装到: $plugin_dir"
}

# 主函数
main() {
    echo "=========================================="
    echo "  Obsidian XMind Linker Plugin 安装器"
    echo "=========================================="
    echo
    
    # 检查是否在项目根目录
    if [[ ! -f "package.json" ]] || [[ ! -f "main.ts" ]]; then
        print_error "请在项目根目录运行此脚本"
        exit 1
    fi
    
    # 检查 Bun
    check_bun
    
    # 构建插件
    build_plugin
    
    # 选择 Obsidian 库
    local vault_path=$(select_vault "$1")
    print_info "选择的 Obsidian 库: $(basename "$vault_path")"
    
    # 安装插件
    install_plugin "$vault_path"
    
    echo
    print_success "安装完成！"
    echo
    echo "接下来的步骤："
    echo "1. 打开 Obsidian"
    echo "2. 进入 设置 → 第三方插件"
    echo "3. 关闭安全模式（如果启用）"
    echo "4. 在已安装插件中找到 'XMind Linker' 并启用"
    echo "5. 享受使用 XMind 文件的乐趣！"
    echo
    echo "需要帮助？查看 DEPLOYMENT.md 获取详细说明"
}

# 运行主函数
main "$@" 