#!/bin/bash

# HuanuCanvas Linux环境测试脚本
# =============================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_info "开始HuanuCanvas Linux环境测试..."

# 1. 检查环境
log_info "检查Node.js环境..."
NODE_VERSION=$(node --version)
log_success "Node.js版本: $NODE_VERSION"

NPM_VERSION=$(npm --version)
log_success "npm版本: $NPM_VERSION"

# 2. 检查必要文件
log_info "检查配置文件..."
required_files=(
    ".npmrc"
    ".env.linux"
    "package.json"
    "README-LINUX.md"
    "install-linux.sh"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        log_success "✓ $file 存在"
    else
        log_error "✗ $file 缺失"
        exit 1
    fi
done

# 3. 检查package.json配置
log_info "检查package.json关键配置..."
if grep -q '"@types/node":.*"^18\.' package.json; then
    log_success "✓ Node.js版本配置正确"
else
    log_warning "✗ Node.js版本配置可能不正确"
fi

if grep -q '"electron":.*"^31\.' package.json; then
    log_success "✓ Electron版本配置正确"
else
    log_warning "✗ Electron版本配置可能不正确"
fi

# 4. 测试依赖安装 (dry-run)
log_info "测试依赖安装 (dry-run)..."
if npm install --dry-run > /dev/null 2>&1; then
    log_success "✓ 依赖安装测试通过"
else
    log_error "✗ 依赖安装测试失败"
    exit 1
fi

# 5. 测试构建
log_info "测试构建过程..."
if timeout 120 npm run build > /dev/null 2>&1; then
    log_success "✓ 构建测试通过"
else
    log_error "✗ 构建测试失败"
    exit 1
fi

# 6. 检查构建产物
log_info "检查构建产物..."
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    log_success "✓ 构建产物正常"
else
    log_warning "✗ 构建产物异常"
fi

log_success "🎉 所有测试通过！Linux环境配置正确。"

echo ""
echo "📝 测试总结:"
echo "- Node.js版本: $NODE_VERSION"
echo "- npm版本: $NPM_VERSION"
echo "- 配置文件: 完整"
echo "- 依赖安装: 正常"
echo "- 构建过程: 成功"
echo ""
echo "🚀 可以使用以下命令启动:"
echo "  开发模式: npm run dev:linux"
echo "  构建应用: npm run build:linux"
echo "  完整安装: npm run install:linux"
