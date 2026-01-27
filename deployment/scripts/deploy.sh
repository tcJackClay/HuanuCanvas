#!/bin/bash
# HuanuCanvas 一键部署脚本
# 版本: v1.4.1

set -e  # 遇到错误立即退出

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

# 检查依赖
check_dependencies() {
    log_info "检查部署依赖..."
    
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
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js未安装，请先安装Node.js"
        exit 1
    fi
    
    log_success "依赖检查通过"
}

# 准备环境
prepare_environment() {
    log_info "准备部署环境..."
    
    # 创建必要目录
    mkdir -p ssl logs backup data input output creative_images thumbnails
    
    # 设置环境变量文件
    if [ ! -f .env ]; then
        cp deployment/.env.example .env
        log_warning "请编辑 .env 文件，填入正确的配置"
        log_warning "特别需要设置 GEMINI_API_KEY"
        
        if [ "$INTERACTIVE" != "false" ]; then
            read -p "按回车继续部署..." -r
        fi
    fi
    
    # 检查必要配置
    if ! grep -q "GEMINI_API_KEY=" .env || grep -q "your_gemini_api_key_here" .env; then
        log_error "请在 .env 文件中设置有效的 GEMINI_API_KEY"
        exit 1
    fi
    
    log_success "环境准备完成"
}

# 构建应用
build_application() {
    log_info "构建应用..."
    
    # 安装前端依赖
    log_info "安装前端依赖..."
    npm ci
    
    # 构建前端
    log_info "构建前端应用..."
    npm run build
    
    # 构建Docker镜像
    log_info "构建Docker镜像..."
    docker build -f deployment/Dockerfile.frontend -t huanu-canvas:v1.4.1 .
    docker build -f deployment/Dockerfile.backend -t huanu-backend:v1.4.1 .
    
    log_success "应用构建完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    # 停止现有服务
    docker-compose -f deployment/docker-compose.yml down 2>/dev/null || true
    
    # 启动新服务
    docker-compose -f deployment/docker-compose.yml up -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30
    
    # 检查服务状态
    docker-compose -f deployment/docker-compose.yml ps
    
    log_success "服务启动完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 检查前端
    if curl -f -s http://localhost/health > /dev/null; then
        log_success "前端服务正常"
    else
        log_error "前端服务异常"
        docker-compose logs frontend
        return 1
    fi
    
    # 检查后端
    if curl -f -s http://localhost/api/health > /dev/null; then
        log_success "后端服务正常"
    else
        log_error "后端服务异常"
        docker-compose logs backend
        return 1
    fi
    
    # 检查Docker服务
    RUNNING_SERVICES=$(docker-compose -f deployment/docker-compose.yml ps --services --filter "status=running" | wc -l)
    TOTAL_SERVICES=$(docker-compose -f deployment/docker-compose.yml ps --services | wc -l)
    
    if [ "$RUNNING_SERVICES" -eq "$TOTAL_SERVICES" ]; then
        log_success "所有Docker服务运行正常 ($RUNNING_SERVICES/$TOTAL_SERVICES)"
    else
        log_warning "部分Docker服务未正常运行 ($RUNNING_SERVICES/$TOTAL_SERVICES)"
    fi
    
    log_success "健康检查完成"
}

# 显示部署信息
show_deployment_info() {
    log_success "🎉 部署完成！"
    echo ""
    echo "📊 访问信息:"
    echo "   前端: http://localhost"
    echo "   后端API: http://localhost/api"
    echo "   监控面板: http://localhost:3000 (admin/admin)"
    echo "   指标收集: http://localhost:9090"
    echo ""
    echo "🔧 管理命令:"
    echo "   查看状态: docker-compose -f deployment/docker-compose.yml ps"
    echo "   查看日志: docker-compose -f deployment/docker-compose.yml logs -f"
    echo "   重启服务: docker-compose -f deployment/docker-compose.yml restart"
    echo "   停止服务: docker-compose -f deployment/docker-compose.yml down"
    echo ""
    echo "📈 监控信息:"
    echo "   系统状态: ./deployment/scripts/health-check.sh"
    echo "   日常维护: ./deployment/scripts/maintenance.sh"
}

# 主函数
main() {
    echo "🚀 HuanuCanvas 部署开始..."
    echo "================================"
    
    # 检查是否交互模式
    INTERACTIVE="${INTERACTIVE:-true}"
    
    check_dependencies
    prepare_environment
    build_application
    start_services
    
    if health_check; then
        show_deployment_info
    else
        log_error "健康检查失败，请检查日志"
        exit 1
    fi
}

# 帮助信息
show_help() {
    echo "HuanuCanvas 部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示帮助信息"
    echo "  --no-interactive  非交互模式"
    echo "  --skip-build    跳过构建步骤"
    echo "  --only-health   仅执行健康检查"
    echo ""
    echo "环境变量:"
    echo "  INTERACTIVE=false  禁用交互模式"
    echo ""
    echo "示例:"
    echo "  $0                    # 完整部署"
    echo "  $0 --no-interactive  # 非交互部署"
    echo "  $0 --only-health     # 仅健康检查"
}

# 参数处理
SKIP_BUILD=false
ONLY_HEALTH=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        --no-interactive)
            INTERACTIVE=false
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --only-health)
            ONLY_HEALTH=true
            shift
            ;;
        *)
            log_error "未知参数: $1"
            show_help
            exit 1
            ;;
    esac
done

# 执行主流程
if [ "$ONLY_HEALTH" = true ]; then
    health_check
else
    main
fi
