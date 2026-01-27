#!/bin/bash

# HuanuCanvas自动化部署脚本
# 从GitHub获取项目并部署到自托管服务器

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
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

# 配置变量
REPO_URL="${REPO_URL:-https://github.com/yourusername/huanu-canvas.git}"
DEPLOY_DIR="/opt/huanu-canvas"
BACKUP_DIR="/opt/backups"
SERVICE_NAME="huanu-canvas"

# 检查是否以root身份运行
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "此脚本需要以root身份运行"
        exit 1
    fi
}

# 检查系统依赖
check_dependencies() {
    log_info "检查系统依赖..."
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    # 检查Git
    if ! command -v git &> /dev/null; then
        log_error "Git未安装，请先安装Git"
        exit 1
    fi
    
    log_success "系统依赖检查通过"
}

# 备份现有部署
backup_existing() {
    if [[ -d "$DEPLOY_DIR" ]]; then
        log_info "备份现有部署..."
        BACKUP_FILE="$BACKUP_DIR/huanu-canvas-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
        mkdir -p "$BACKUP_DIR"
        tar -czf "$BACKUP_FILE" -C "$(dirname "$DEPLOY_DIR")" "$(basename "$DEPLOY_DIR")"
        log_success "备份完成: $BACKUP_FILE"
    fi
}

# 停止现有服务
stop_existing_services() {
    log_info "停止现有服务..."
    
    if [[ -f "$DEPLOY_DIR/docker-compose.yml" ]]; then
        cd "$DEPLOY_DIR"
        docker-compose down || true
    fi
    
    # 停止相关进程
    pkill -f "huanu-canvas" || true
    
    log_success "现有服务已停止"
}

# 从GitHub克隆/更新项目
clone_or_update_project() {
    log_info "从GitHub获取项目..."
    
    if [[ -d "$DEPLOY_DIR" ]]; then
        cd "$DEPLOY_DIR"
        git pull origin main || git pull origin master
        log_success "项目已更新"
    else
        git clone "$REPO_URL" "$DEPLOY_DIR"
        log_success "项目已克隆"
    fi
}

# 配置环境变量
setup_environment() {
    log_info "配置环境变量..."
    
    cd "$DEPLOY_DIR"
    
    if [[ ! -f ".env" ]]; then
        if [[ -f "deployment/.env.template" ]]; then
            cp "deployment/.env.template" ".env"
            log_warning "请编辑 .env 文件并设置必要的环境变量"
            log_warning "特别是 GEMINI_API_KEY"
        else
            log_error "环境变量模板文件不存在"
            exit 1
        fi
    fi
    
    log_success "环境变量配置完成"
}

# 构建并启动服务
deploy_services() {
    log_info "构建并启动服务..."
    
    cd "$DEPLOY_DIR"
    
    # 构建并启动服务
    docker-compose -f deployment/docker-compose.yml --env-file .env up -d --build
    
    log_success "服务部署完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 等待服务启动
    sleep 30
    
    # 检查Docker容器状态
    if docker-compose -f deployment/docker-compose.yml ps | grep -q "Up"; then
        log_success "Docker容器运行正常"
    else
        log_error "Docker容器启动失败"
        return 1
    fi
    
    # 检查前端服务
    if curl -f http://localhost:80 > /dev/null 2>&1; then
        log_success "前端服务运行正常"
    else
        log_warning "前端服务可能尚未完全启动"
    fi
    
    # 检查后端服务
    if curl -f http://localhost:8765/health > /dev/null 2>&1; then
        log_success "后端服务运行正常"
    else
        log_warning "后端服务可能尚未完全启动"
    fi
    
    log_success "健康检查完成"
}

# 显示部署信息
show_deployment_info() {
    log_success "部署完成！"
    echo ""
    echo "访问信息:"
    echo "- 前端应用: http://$(hostname -I | awk '{print $1}'):80"
    echo "- 后端API: http://$(hostname -I | awk '{print $1}'):8765"
    echo "- 监控面板: http://$(hostname -I | awk '{print $1}'):3000"
    echo ""
    echo "管理命令:"
    echo "- 查看状态: cd $DEPLOY_DIR && docker-compose -f deployment/docker-compose.yml ps"
    echo "- 查看日志: cd $DEPLOY_DIR && docker-compose -f deployment/docker-compose.yml logs -f"
    echo "- 重启服务: cd $DEPLOY_DIR && docker-compose -f deployment/docker-compose.yml restart"
    echo "- 停止服务: cd $DEPLOY_DIR && docker-compose -f deployment/docker-compose.yml down"
}

# 主函数
main() {
    log_info "开始HuanuCanvas自动化部署..."
    
    check_root
    check_dependencies
    backup_existing
    stop_existing_services
    clone_or_update_project
    setup_environment
    deploy_services
    health_check
    show_deployment_info
    
    log_success "部署流程完成！"
}

# 执行主函数
main "$@"