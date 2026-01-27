#!/bin/bash

# HuanuCanvas从GitHub自动部署脚本
# 版本: v2.0.0
# 日期: 2026-01-27

set -e

# 配置参数
PROJECT_NAME="huanu-canvas"
GIT_REPO="${GIT_REPO:-https://github.com/yourusername/huanu-canvas.git}"
BRANCH="${BRANCH:-main}"
DEPLOY_DIR="/opt/${PROJECT_NAME}"

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查参数
if [ $# -eq 0 ]; then
    log_error "请指定部署环境: test 或 production"
    exit 1
fi

ENVIRONMENT=$1
if [[ "$ENVIRONMENT" != "test" && "$ENVIRONMENT" != "production" ]]; then
    log_error "环境参数错误: $ENVIRONMENT"
    exit 1
fi

log_info "部署环境: $ENVIRONMENT"

# 更新仓库
log_info "更新代码仓库..."
if [ ! -d "$DEPLOY_DIR/.git" ]; then
    log_info "首次克隆仓库..."
    git clone -b "$BRANCH" "$GIT_REPO" "$DEPLOY_DIR"
else
    log_info "更新现有仓库..."
    cd "$DEPLOY_DIR"
    git fetch origin "$BRANCH"
    git checkout "$BRANCH"
    git reset --hard "origin/$BRANCH"
fi

# 构建前端
log_info "构建前端应用..."
cd "$DEPLOY_DIR/frontend"
npm ci --production
npm run build

# 部署到Web目录
if [ -d "dist" ]; then
    if [ "$ENVIRONMENT" == "test" ]; then
        web_dir="$DEPLOY_DIR/web-root"
    else
        web_dir="/var/www/html"
    fi
    
    mkdir -p "$web_dir"
    sudo cp -r dist/* "$web_dir/" 2>/dev/null || cp -r dist/* "$web_dir/"
    log_success "前端部署完成"
fi

# 重启服务
log_info "重启服务..."
cd "$DEPLOY_DIR"
pm2 restart all

log_success "=== $ENVIRONMENT 环境部署完成 ==="
echo "前端应用: http://192.168.10.5:5206"
echo "API服务:  http://192.168.10.5:8765"

# 健康检查
sleep 10
if curl -f -s "http://localhost:5206" > /dev/null; then
    log_success "✅ 前端服务正常"
else
    log_error "❌ 前端服务异常"
fi

if curl -f -s "http://localhost:8765/health" > /dev/null; then
    log_success "✅ 后端服务正常"
else
    log_error "❌ 后端服务异常"
fi
