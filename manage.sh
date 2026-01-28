#!/bin/bash
# HuanuCanvas 服务管理脚本
# 整合启动、停止、状态检查功能

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 启动服务
start_services() {
    log_info "启动HuanuCanvas服务..."
    
    # 启动开发模式
    if [ "$1" = "dev" ]; then
        log_info "启动开发模式..."
        npm run dev:linux &
        DEV_PID=$!
        echo $DEV_PID > .huanu-dev.pid
        log_success "开发模式已启动 (PID: $DEV_PID)"
    fi
    
    # 启动生产模式
    if [ "$1" = "prod" ] || [ -z "$1" ]; then
        log_info "启动生产模式..."
        
        # 检查是否使用Docker
        if command -v docker-compose &> /dev/null && [ -f "deployment/docker-compose.yml" ]; then
            docker-compose -f deployment/docker-compose.yml up -d
            log_success "Docker服务已启动"
        else
            log_warning "Docker不可用，启动Electron应用..."
            npm run electron:dev &
            ELECTRON_PID=$!
            echo $ELECTRON_PID > .huanu-electron.pid
            log_success "Electron应用已启动 (PID: $ELECTRON_PID)"
        fi
    fi
}

# 停止服务
stop_services() {
    log_info "停止HuanuCanvas服务..."
    
    # 停止开发进程
    if [ -f ".huanu-dev.pid" ]; then
        DEV_PID=$(cat .huanu-dev.pid)
        if kill -0 $DEV_PID 2>/dev/null; then
            kill $DEV_PID
            rm .huanu-dev.pid
            log_success "开发模式已停止"
        else
            rm .huanu-dev.pid
            log_warning "开发进程不存在"
        fi
    fi
    
    # 停止Electron进程
    if [ -f ".huanu-electron.pid" ]; then
        ELECTRON_PID=$(cat .huanu-electron.pid)
        if kill -0 $ELECTRON_PID 2>/dev/null; then
            kill $ELECTRON_PID
            rm .huanu-electron.pid
            log_success "Electron应用已停止"
        else
            rm .huanu-electron.pid
            log_warning "Electron进程不存在"
        fi
    fi
    
    # 停止Docker服务
    if command -v docker-compose &> /dev/null; then
        docker-compose -f deployment/docker-compose.yml down 2>/dev/null || true
        log_success "Docker服务已停止"
    fi
    
    # 强制清理残留进程
    pkill -f "electron" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    
    log_success "所有服务已停止"
}

# 检查服务状态
check_status() {
    log_info "检查服务状态..."
    
    # 检查开发进程
    if [ -f ".huanu-dev.pid" ]; then
        DEV_PID=$(cat .huanu-dev.pid)
        if kill -0 $DEV_PID 2>/dev/null; then
            log_success "开发模式运行中 (PID: $DEV_PID)"
        else
            log_warning "开发模式已停止 (PID文件残留)"
        fi
    fi
    
    # 检查Electron进程
    if [ -f ".huanu-electron.pid" ]; then
        ELECTRON_PID=$(cat .huanu-electron.pid)
        if kill -0 $ELECTRON_PID 2>/dev/null; then
            log_success "Electron应用运行中 (PID: $ELECTRON_PID)"
        else
            log_warning "Electron应用已停止 (PID文件残留)"
        fi
    fi
    
    # 检查Docker服务
    if command -v docker-compose &> /dev/null && [ -f "deployment/docker-compose.yml" ]; then
        RUNNING=$(docker-compose -f deployment/docker-compose.yml ps --services --filter "status=running" | wc -l)
        TOTAL=$(docker-compose -f deployment/docker-compose.yml ps --services | wc -l)
        log_info "Docker服务状态: $RUNNING/$TOTAL 运行中"
    fi
    
    # 检查端口占用
    log_info "检查端口占用..."
    netstat -tuln 2>/dev/null | grep -E ":5173|:8765|:80|:443" || log_info "未发现相关端口占用"
}

# 重启服务
restart_services() {
    log_info "重启服务..."
    stop_services
    sleep 2
    start_services "$1"
}

# 显示菜单
show_menu() {
    echo "=========================================="
    echo "HuanuCanvas 服务管理"
    echo "=========================================="
    echo ""
    echo "请选择操作:"
    echo "  1. 启动开发模式"
    echo "  2. 启动生产模式"
    echo "  3. 停止所有服务"
    echo "  4. 重启开发模式"
    echo "  5. 重启生产模式"
    echo "  6. 检查服务状态"
    echo "  0. 退出"
    echo ""
    read -p "请输入选项 (0-6): " choice
    
    case $choice in
        1) start_services "dev" ;;
        2) start_services "prod" ;;
        3) stop_services ;;
        4) restart_services "dev" ;;
        5) restart_services "prod" ;;
        6) check_status ;;
        0) exit 0 ;;
        *) log_error "无效选项"; show_menu ;;
    esac
}

# 主函数
main() {
    case "${1:-menu}" in
        "start")
            start_services "${2:-prod}"
            ;;
        "stop")
            stop_services
            ;;
        "status")
            check_status
            ;;
        "restart")
            restart_services "${2:-prod}"
            ;;
        "menu"|"interactive")
            show_menu
            ;;
        "help"|"-h"|"--help")
            echo "使用方法: $0 [命令] [选项]"
            echo ""
            echo "命令:"
            echo "  start [dev|prod]  启动服务 (默认prod)"
            echo "  stop              停止所有服务"
            echo "  status            检查服务状态"
            echo "  restart [dev|prod] 重启服务"
            echo "  menu              交互式菜单"
            echo "  help              显示帮助"
            echo ""
            echo "示例:"
            echo "  $0 start dev      # 启动开发模式"
            echo "  $0 start prod     # 启动生产模式"
            echo "  $0 status         # 检查状态"
            echo "  $0                # 进入菜单"
            ;;
        *)
            log_error "未知命令: $1"
            echo "使用 '$0 help' 查看帮助"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"