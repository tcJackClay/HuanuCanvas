#!/bin/bash
# HuanuCanvas 健康检查脚本
# 版本: v1.4.1

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# 检查变量
ERROR_COUNT=0
WARNING_COUNT=0

# 检查Docker服务状态
check_docker_services() {
    log_info "检查Docker服务状态..."
    
    cd "$(dirname "$0")/../.."
    
    # 获取运行中的服务
    RUNNING_SERVICES=$(docker-compose -f deployment/docker-compose.yml ps --services --filter "status=running" 2>/dev/null || echo "")
    TOTAL_SERVICES=$(docker-compose -f deployment/docker-compose.yml ps --services 2>/dev/null || echo "")
    
    if [ -z "$TOTAL_SERVICES" ]; then
        log_error "无法获取服务列表，请检查Docker Compose配置"
        ((ERROR_COUNT++))
        return 1
    fi
    
    if [ -z "$RUNNING_SERVICES" ]; then
        log_error "没有运行中的服务"
        ((ERROR_COUNT++))
        return 1
    fi
    
    SERVICE_COUNT=$(echo "$RUNNING_SERVICES" | wc -l)
    TOTAL_COUNT=$(echo "$TOTAL_SERVICES" | wc -l)
    
    if [ "$SERVICE_COUNT" -eq "$TOTAL_COUNT" ]; then
        log_success "所有服务运行正常 ($SERVICE_COUNT/$TOTAL_COUNT)"
    else
        log_warning "部分服务未正常运行 ($SERVICE_COUNT/$TOTAL_COUNT)"
        ((WARNING_COUNT++))
        
        # 显示未运行的服务
        for service in $TOTAL_SERVICES; do
            if ! echo "$RUNNING_SERVICES" | grep -q "^$service$"; then
                log_error "服务未运行: $service"
            fi
        done
    fi
}

# 检查端口占用
check_ports() {
    log_info "检查端口占用情况..."
    
    PORTS=(80 443 8765 3000 9090 6379 5432)
    
    for port in "${PORTS[@]}"; do
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            log_success "端口 $port 正常监听"
        else
            log_warning "端口 $port 未监听"
            ((WARNING_COUNT++))
        fi
    done
}

# 检查资源使用
check_resource_usage() {
    log_info "检查系统资源使用..."
    
    # 检查内存使用
    MEM_USAGE=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    if (( $(echo "$MEM_USAGE > 80" | bc -l) )); then
        log_warning "内存使用率较高: ${MEM_USAGE}%"
        ((WARNING_COUNT++))
    else
        log_success "内存使用率正常: ${MEM_USAGE}%"
    fi
    
    # 检查磁盘使用
    DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -gt 80 ]; then
        log_warning "磁盘使用率较高: ${DISK_USAGE}%"
        ((WARNING_COUNT++))
    else
        log_success "磁盘使用率正常: ${DISK_USAGE}%"
    fi
    
    # 检查Docker容器资源使用
    if command -v docker &> /dev/null; then
        log_info "Docker容器资源使用:"
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>/dev/null || log_warning "无法获取Docker容器统计"
    fi
}

# 检查服务响应
check_service_responses() {
    log_info "检查服务响应..."
    
    # 检查前端健康端点
    if curl -f -s --max-time 10 http://localhost/health > /dev/null 2>&1; then
        log_success "前端服务响应正常"
    else
        log_error "前端服务响应异常"
        ((ERROR_COUNT++))
    fi
    
    # 检查后端API健康端点
    if curl -f -s --max-time 10 http://localhost/api/health > /dev/null 2>&1; then
        log_success "后端API服务响应正常"
    else
        log_error "后端API服务响应异常"
        ((ERROR_COUNT++))
    fi
    
    # 检查监控服务
    if curl -f -s --max-time 5 http://localhost:3000/api/health > /dev/null 2>&1; then
        log_success "Grafana监控服务响应正常"
    else
        log_warning "Grafana监控服务响应异常"
        ((WARNING_COUNT++))
    fi
    
    if curl -f -s --max-time 5 http://localhost:9090/-/healthy > /dev/null 2>&1; then
        log_success "Prometheus服务响应正常"
    else
        log_warning "Prometheus服务响应异常"
        ((WARNING_COUNT++))
    fi
}

# 检查日志错误
check_log_errors() {
    log_info "检查日志错误..."
    
    cd "$(dirname "$0")/../.."
    
    # 检查Docker Compose日志中的错误
    ERROR_LOGS=$(docker-compose -f deployment/docker-compose.yml logs --tail=50 2>/dev/null | grep -i error || true)
    
    if [ -n "$ERROR_LOGS" ]; then
        log_warning "发现错误日志:"
        echo "$ERROR_LOGS" | head -10 | while read line; do
            echo "  $line"
        done
        ((WARNING_COUNT++))
    else
        log_success "未发现明显错误日志"
    fi
}

# 检查SSL证书
check_ssl_certificate() {
    log_info "检查SSL证书..."
    
    if [ -f "ssl/cert.pem" ]; then
        EXPIRY_DATE=$(openssl x509 -in ssl/cert.pem -noout -enddate | cut -d= -f2)
        EXPIRY_TIMESTAMP=$(date -d "$EXPIRY_DATE" +%s)
        CURRENT_TIMESTAMP=$(date +%s)
        DAYS_UNTIL_EXPIRY=$(( (EXPIRY_TIMESTAMP - CURRENT_TIMESTAMP) / 86400 ))
        
        if [ $DAYS_UNTIL_EXPIRY -lt 30 ]; then
            log_warning "SSL证书将在 $DAYS_UNTIL_EXPIRY 天后过期"
            ((WARNING_COUNT++))
        else
            log_success "SSL证书有效，还有 $DAYS_UNTIL_EXPIRY 天过期"
        fi
    else
        log_warning "SSL证书文件不存在"
        ((WARNING_COUNT++))
    fi
}

# 检查环境变量
check_environment_variables() {
    log_info "检查关键环境变量..."
    
    if [ -f .env ]; then
        # 检查关键配置
        if grep -q "GEMINI_API_KEY=" .env && ! grep -q "your_gemini_api_key_here" .env; then
            log_success "GEMINI_API_KEY 已配置"
        else
            log_error "GEMINI_API_KEY 未正确配置"
            ((ERROR_COUNT++))
        fi
        
        if grep -q "NODE_ENV=production" .env; then
            log_success "NODE_ENV 设置正确"
        else
            log_warning "NODE_ENV 未设置为production"
            ((WARNING_COUNT++))
        fi
    else
        log_error ".env 文件不存在"
        ((ERROR_COUNT++))
    fi
}

# 检查备份状态
check_backup_status() {
    log_info "检查备份状态..."
    
    if [ -d "backup" ]; then
        LATEST_BACKUP=$(ls -t backup/*.tar.gz 2>/dev/null | head -1)
        if [ -n "$LATEST_BACKUP" ]; then
            BACKUP_DATE=$(stat -c %Y "$LATEST_BACKUP")
            CURRENT_DATE=$(date +%s)
            HOURS_SINCE_BACKUP=$(( (CURRENT_DATE - BACKUP_DATE) / 3600 ))
            
            if [ $HOURS_SINCE_BACKUP -lt 24 ]; then
                log_success "最新备份: $(basename "$LATEST_BACKUP") ($HOURS_SINCE_BACKUP 小时前)"
            else
                log_warning "最新备份过旧: $(basename "$LATEST_BACKUP") ($HOURS_SINCE_BACKUP 小时前)"
                ((WARNING_COUNT++))
            fi
        else
            log_warning "未找到备份文件"
            ((WARNING_COUNT++))
        fi
    else
        log_warning "备份目录不存在"
        ((WARNING_COUNT++))
    fi
}

# 生成健康报告
generate_health_report() {
    echo ""
    echo "================================"
    echo "🔍 HuanuCanvas 健康检查报告"
    echo "================================"
    echo "检查时间: $(date)"
    echo "系统负载: $(uptime | awk -F'load average:' '{print $2}')"
    echo "错误数量: $ERROR_COUNT"
    echo "警告数量: $WARNING_COUNT"
    echo ""
    
    if [ $ERROR_COUNT -eq 0 ] && [ $WARNING_COUNT -eq 0 ]; then
        log_success "✅ 系统状态良好，所有检查通过"
        return 0
    elif [ $ERROR_COUNT -eq 0 ]; then
        log_warning "⚠️  系统基本正常，但有 $WARNING_COUNT 个警告"
        return 1
    else
        log_error "❌ 系统存在问题，需要立即处理 ($ERROR_COUNT 个错误, $WARNING_COUNT 个警告)"
        return 2
    fi
}

# 主函数
main() {
    echo "🔍 HuanuCanvas 健康检查开始..."
    echo "================================"
    
    check_docker_services
    check_ports
    check_resource_usage
    check_service_responses
    check_log_errors
    check_ssl_certificate
    check_environment_variables
    check_backup_status
    
    generate_health_report
}

# 帮助信息
show_help() {
    echo "HuanuCanvas 健康检查脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示帮助信息"
    echo "  --verbose      详细输出"
    echo "  --json         JSON格式输出"
    echo ""
}

# 参数处理
VERBOSE=false
OUTPUT_FORMAT="text"

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --json)
            OUTPUT_FORMAT="json"
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
main
EXIT_CODE=$?

exit $EXIT_CODE
