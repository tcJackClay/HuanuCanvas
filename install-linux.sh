#!/bin/bash

# HuanuCanvas Linux环境自动化安装脚本
# =====================================

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

# 检查Node.js版本
log_info "检查Node.js环境..."
NODE_VERSION=$(node --version)
if [[ ! $NODE_VERSION =~ ^v18\. ]]; then
    log_error "需要Node.js 18.x版本，当前版本: $NODE_VERSION"
    log_info "请安装Node.js 18: https://nodejs.org/"
    exit 1
fi
log_success "Node.js版本检查通过: $NODE_VERSION"

# 检查npm版本
NPM_VERSION=$(npm --version)
log_success "npm版本: $NPM_VERSION"

# 安装系统依赖
log_info "安装系统构建依赖..."
if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update
    sudo apt-get install -y build-essential python3 python3-dev
elif command -v yum >/dev/null 2>&1; then
    sudo yum groupinstall -y "Development Tools"
    sudo yum install -y python3 python3-devel
elif command -v dnf >/dev/null 2>&1; then
    sudo dnf groupinstall -y "Development Tools"
    sudo dnf install -y python3 python3-devel
else
    log_warning "未识别的包管理器，请手动安装构建工具"
fi

log_success "系统依赖安装完成"

# 清理npm缓存
log_info "清理npm缓存..."
npm cache clean --force

# 删除现有依赖
if [ -d "node_modules" ]; then
    log_info "删除现有node_modules..."
    rm -rf node_modules
fi

if [ -f "package-lock.json" ]; then
    log_info "删除现有package-lock.json..."
    rm -f package-lock.json
fi

# 使用Linux环境配置
if [ -f ".env.linux" ]; then
    log_info "应用Linux环境配置..."
    cp .env.linux .env
fi

# 安装依赖
log_info "安装项目依赖..."
npm install

# 验证安装
log_info "验证安装结果..."
if npm run build; then
    log_success "构建测试通过"
else
    log_error "构建测试失败"
    exit 1
fi

log_success "HuanuCanvas Linux环境安装完成!"
echo ""
echo "📝 下一步操作:"
echo "1. 配置环境变量: 编辑 .env 文件"
echo "2. 设置 GEMINI_API_KEY"
echo "3. 启动开发模式: npm run dev"
echo "4. 构建生产版本: npm run build"
