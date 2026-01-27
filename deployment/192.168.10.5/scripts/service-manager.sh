#!/bin/bash
# HuanuCanvas服务管理脚本
# 用于启动/停止/重启/查看服务状态

set -e

# 配置变量
APP_DIR="/opt/huanu-canvas"
DOCKER_COMPOSE_FILE="$APP_DIR/deployment/docker-compose.test.yml"
SERVICE_USER="huanu-canvas"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否以root权限运行
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "此脚本需要root权限运行"
        exit 1
    fi
}

# 检查Docker和Docker Compose
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker服务未运行"
        exit 1
    fi
}

# 启动服务
start_services() {
    log_info "启动HuanuCanvas服务..."
    
    cd "$APP_DIR"
    
    # 创建必要的目录
    mkdir -p app/{data,input,output,creative_images,thumbnails}
    
    # 启动服务
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    log_info "等待服务启动..."
    sleep 10
    
    # 检查服务状态
    if check_services_status; then
        log_info "服务启动成功"
        show_access_info
    else
        log_error "服务启动失败，请检查日志"
        show_logs
        exit 1
    fi
}

# 停止服务
stop_services() {
    log_info "停止HuanuCanvas服务..."
    
    cd "$APP_DIR"
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
    
    log_info "服务已停止"
}

# 重启服务
restart_services() {
    log_info "重启HuanuCanvas服务..."
    
    stop_services
    sleep 5
    start_services
}

# 查看服务状态
show_status() {
    log_info "HuanuCanvas服务状态:"
    
    cd "$APP_DIR"
    docker-compose -f "$DOCKER_COMPOSE_FILE" ps
    
    echo ""
    log_info "端口占用情况:"
    netstat -tlnp 2>/dev/null | grep -E ':5206|:8765|:3001|:9091' || echo "无端口占用"
    
    echo ""
    log_info "磁盘使用情况:"
    du -sh "$APP_DIR" 2>/dev/null || echo "应用目录不存在"
    
    echo ""
    log_info "内存使用情况:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" $(docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q) 2>/dev/null || echo "无法获取容器统计"
}

# 检查服务状态
check_services_status() {
    cd "$APP_DIR"
    
    # 检查所有服务是否都在运行
    local running_count=$(docker-compose -f "$DOCKER_COMPOSE_FILE" ps --services --filter "status=running" | wc -l)
    local total_count=$(docker-compose -f "$DOCKER_COMPOSE_FILE" ps --services | wc -l)
    
    if [ "$running_count" -eq "$total_count" ] && [ "$total_count" -gt 0 ]; then
        return 0
    else
        return 1
    fi
}

# 查看日志
show_logs() {
    local service=${1:-""}
    local lines=${2:-50}
    
    cd "$APP_DIR"
    
    if [ -n "$service" ]; then
        log_info "显示 $service 服务日志 (最近 $lines 行):"
        docker-compose -f "$DOCKER_COMPOSE_FILE" logs --tail=$lines -f "$service"
    else
        log_info "显示所有服务日志 (最近 $lines 行):"
        docker-compose -f "$DOCKER_COMPOSE_FILE" logs --tail=$lines -f
    fi
}

# 清理资源
cleanup_resources() {
    log_info "清理HuanuCanvas资源..."
    
    cd "$APP_DIR"
    
    # 停止并删除容器
    docker-compose -f "$DOCKER_COMPOSE_FILE" down -v --remove-orphans
    
    # 清理未使用的镜像
    docker image prune -f
    
    # 清理未使用的卷
    docker volume prune -f
    
    log_info "资源清理完成"
}

# 重新构建镜像
rebuild_images() {
    log_info "重新构建Docker镜像..."
    
    cd "$APP_DIR"
    
    # 停止服务
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
    
    # 强制重新构建
    docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache
    
    # 重新启动
    start_services
    
    log_info "镜像重建完成"
}

# 查看访问信息
show_access_info() {
    echo ""
    echo "==================================="
    echo "🎉 HuanuCanvas 访问信息"
    echo "==================================="
    echo "前端应用:     http://192.168.10.5:5206"
    echo "API服务:      http://192.168.10.5:8765"
    echo "API健康检查:  http://192.168.10.5:8765/health"
    echo "Grafana监控:  http://192.168.10.5:3001 (admin/admin123)"
    echo "Prometheus:   http://192.168.10.5:9091"
    echo ""
    echo "管理命令:"
    echo "  查看状态: $0 status"
    echo "  查看日志: $0 logs [服务名]"
    echo "  重启服务: $0 restart"
    echo "  停止服务: $0 stop"
    echo "==================================="
}

# 更新应用
update_application() {
    log_info "更新HuanuCanvas应用..."
    
    local update_type=${1:-"config"} # config, full
    
    case "$update_type" in
        "config")
            log_info "更新配置文件..."
            # 这里可以添加配置文件更新的逻辑
            ;;
        "full")
            log_info "完整更新应用..."
            # 这里可以添加完整更新逻辑
            ;;
    esac
    
    log_info "更新完成"
}

# 备份数据
backup_data() {
    log_info "备份HuanuCanvas数据..."
    
    cd "$APP_DIR"
    
    # 创建备份目录
    local backup_dir="backup/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # 备份数据库
    if [ -f "app/data/huanu_canvas_test.db" ]; then
        cp "app/data/huanu_canvas_test.db" "$backup_dir/"
        log_info "数据库已备份"
    fi
    
    # 备份配置文件
    cp -r config/environment "$backup_dir/" 2>/dev/null || true
    
    # 压缩备份
    tar -czf "$backup_dir.tar.gz" -C "$(dirname "$backup_dir")" "$(basename "$backup_dir")"
    rm -rf "$backup_dir"
    
    log_info "数据备份完成: $backup_dir.tar.gz"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    local failed_checks=0
    
    # 检查服务状态
    if check_services_status; then
        log_info "✅ 服务状态正常"
    else
        log_error "❌ 服务状态异常"
        ((failed_checks++))
    fi
    
    # 检查端口连通性
    if nc -z localhost 5206 2>/dev/null; then
        log_info "✅ 前端端口 (5206) 正常"
    else
        log_error "❌ 前端端口 (5206) 异常"
        ((failed_checks++))
    fi
    
    if nc -z localhost 8765 2>/dev/null; then
        log_info "✅ 后端端口 (8765) 正常"
    else
        log_error "❌ 后端端口 (8765) 异常"
        ((failed_checks++))
    fi
    
    # 检查磁盘空间
    local disk_usage=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
    if [ "$disk_usage" -lt 90 ]; then
        log_info "✅ 磁盘使用率正常 ($disk_usage%)"
    else
        log_error "❌ 磁盘使用率过高 ($disk_usage%)"
        ((failed_checks++))
    fi
    
    # 检查内存使用
    local mem_usage=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
    if [ "$mem_usage" -lt 90 ]; then
        log_info "✅ 内存使用率正常 ($mem_usage%)"
    else
        log_error "❌ 内存使用率过高 ($mem_usage%)"
        ((failed_checks++))
    fi
    
    if [ "$failed_checks" -eq 0 ]; then
        log_info "🎉 所有健康检查通过"
        return 0
    else
        log_error "发现 $failed_checks 项健康检查失败"
        return 1
    fi
}

# 主函数
main() {
    local action=${1:-"status"}
    
    check_root
    check_docker
    
    case "$action" in
        "start")
            start_services
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            restart_services
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs "$2" "$3"
            ;;
        "cleanup")
            cleanup_resources
            ;;
        "rebuild")
            rebuild_images
            ;;
        "update")
            update_application "$2"
            ;;
        "backup")
            backup_data
            ;;
        "health")
            health_check
            ;;
        "help"|*)
            echo "HuanuCanvas 服务管理脚本"
            echo ""
            echo "用法: $0 {start|stop|restart|status|logs|cleanup|rebuild|update|backup|health|help}"
            echo ""
            echo "命令说明:"
            echo "  start    - 启动所有服务"
            echo "  stop     - 停止所有服务"
            echo "  restart  - 重启所有服务"
            echo "  status   - 查看服务状态"
            echo "  logs     - 查看服务日志 [服务名] [行数]"
            echo "  cleanup  - 清理Docker资源"
            echo "  rebuild  - 重新构建Docker镜像"
            echo "  update   - 更新应用 [config|full]"
            echo "  backup   - 备份数据"
            echo "  health   - 执行健康检查"
            echo "  help     - 显示此帮助信息"
            ;;
    esac
}

# 执行主函数
main "$@"
