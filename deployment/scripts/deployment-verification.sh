#!/bin/bash

# HuanuCanvas部署验证脚本
# 检查服务健康状态、功能完整性和性能指标

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
DEPLOY_DIR="${DEPLOY_DIR:-/opt/huanu-canvas}"
MAX_RESPONSE_TIME=3000  # 3秒
MAX_MEMORY_USAGE=1024  # 1GB
SERVER_IP="${SERVER_IP:-$(hostname -I | awk '{print $1}')}"

# 验证计数器
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# 检查函数
check_service() {
    local service_name=$1
    local url=$2
    local expected_status=${3:-200}
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    log_info "检查 $service_name 服务..."
    
    if response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null); then
        if [[ "$response" == "$expected_status" ]]; then
            log_success "$service_name 服务正常 (HTTP $response)"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
            return 0
        else
            log_warning "$service_name 服务异常 (HTTP $response, 期望 $expected_status)"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
            return 1
        fi
    else
        log_error "$service_name 服务无法访问"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# 检查Docker容器状态
check_docker_containers() {
    log_info "检查Docker容器状态..."
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if command -v docker-compose &> /dev/null && [[ -f "$DEPLOY_DIR/deployment/docker-compose.yml" ]]; then
        cd "$DEPLOY_DIR"
        if running_containers=$(docker-compose -f deployment/docker-compose.yml ps --services --filter "status=running" 2>/dev/null | wc -l); then
            if [[ $running_containers -gt 0 ]]; then
                log_success "发现 $running_containers 个运行中的容器"
                PASSED_CHECKS=$((PASSED_CHECKS + 1))
                return 0
            else
                log_warning "没有运行中的容器"
                FAILED_CHECKS=$((FAILED_CHECKS + 1))
                return 1
            fi
        else
            log_warning "无法获取容器状态"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
            return 1
        fi
    else
        log_warning "Docker Compose配置不存在"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# 检查系统资源使用
check_system_resources() {
    log_info "检查系统资源使用..."
    
    # 检查内存使用
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if memory_usage=$(free -m | awk 'NR==2{printf "%.0f", $3*100/$2 }' 2>/dev/null); then
        if [[ $memory_usage -lt 80 ]]; then
            log_success "内存使用正常: ${memory_usage}%"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            log_warning "内存使用过高: ${memory_usage}%"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
    else
        log_warning "无法获取内存使用信息"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    
    # 检查磁盘空间
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//' 2>/dev/null); then
        if [[ $disk_usage -lt 90 ]]; then
            log_success "磁盘空间充足: ${disk_usage}% 使用"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            log_warning "磁盘空间不足: ${disk_usage}% 使用"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
    else
        log_warning "无法获取磁盘使用信息"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

# 检查网络连接
check_network_connectivity() {
    log_info "检查网络连接..."
    
    # 检查外部网络连接
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if ping -c 1 8.8.8.8 &> /dev/null; then
        log_success "外部网络连接正常"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        log_warning "外部网络连接异常"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    
    # 检查DNS解析
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if nslookup google.com &> /dev/null; then
        log_success "DNS解析正常"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        log_warning "DNS解析异常"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

# 检查SSL证书（如果配置了HTTPS）
check_ssl_certificate() {
    log_info "检查SSL证书..."
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [[ -n "$SSL_DOMAIN" ]]; then
        if ssl_info=$(echo | openssl s_client -servername "$SSL_DOMAIN" -connect "$SSL_DOMAIN":443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null); then
            log_success "SSL证书正常"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            log_warning "SSL证书检查失败"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
    else
        log_info "未配置SSL证书检查"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    fi
}

# 检查日志错误
check_logs_for_errors() {
    log_info "检查应用日志错误..."
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [[ -d "$DEPLOY_DIR/logs" ]]; then
        error_count=$(find "$DEPLOY_DIR/logs" -name "*.log" -exec grep -i "error\|exception\|failed" {} \; 2>/dev/null | wc -l)
        if [[ $error_count -eq 0 ]]; then
            log_success "未发现日志错误"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            log_warning "发现 $error_count 个潜在错误"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
    else
        log_info "日志目录不存在，跳过错误检查"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    fi
}

# 性能测试
performance_test() {
    log_info "执行性能测试..."
    
    # 测试前端响应时间
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if response_time=$(curl -o /dev/null -s -w "%{time_total}" "http://$SERVER_IP:80" 2>/dev/null); then
        response_time_ms=$(echo "$response_time * 1000" | bc 2>/dev/null | cut -d. -f1)
        if [[ $response_time_ms -lt $MAX_RESPONSE_TIME ]]; then
            log_success "前端响应时间正常: ${response_time_ms}ms"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            log_warning "前端响应时间过长: ${response_time_ms}ms"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
    else
        log_warning "无法测试前端响应时间"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

# 生成验证报告
generate_report() {
    local report_file="$DEPLOY_DIR/deployment-verification-report-$(date +%Y%m%d-%H%M%S).txt"
    
    log_info "生成验证报告..."
    
    cat > "$report_file" << EOF
HuanuCanvas 部署验证报告
================================

验证时间: $(date)
服务器IP: $SERVER_IP
部署目录: $DEPLOY_DIR

验证结果统计:
- 总检查项: $TOTAL_CHECKS
- 通过检查: $PASSED_CHECKS
- 失败检查: $FAILED_CHECKS
- 成功率: $(( PASSED_CHECKS * 100 / TOTAL_CHECKS ))%

服务状态:
- 前端应用: http://$SERVER_IP:80
- 后端API: http://$SERVER_IP:8765
- 监控面板: http://$SERVER_IP:3000

系统资源:
$(free -h | head -2)
$(df -h / | tail -1)

Docker容器状态:
$(docker-compose -f "$DEPLOY_DIR/deployment/docker-compose.yml" ps 2>/dev/null || echo "无法获取容器状态")

验证完成时间: $(date)
EOF
    
    log_success "验证报告已生成: $report_file"
}

# 主函数
main() {
    log_info "开始HuanuCanvas部署验证..."
    echo ""
    
    # 基础服务检查
    check_service "前端应用" "http://$SERVER_IP:80"
    check_service "后端API" "http://$SERVER_IP:8765/health"
    check_service "监控面板" "http://$SERVER_IP:3000"
    
    # 系统检查
    check_docker_containers
    check_system_resources
    check_network_connectivity
    
    # 安全检查
    check_ssl_certificate
    
    # 日志检查
    check_logs_for_errors
    
    # 性能测试
    performance_test
    
    echo ""
    log_info "验证总结:"
    echo "总检查项: $TOTAL_CHECKS"
    echo "通过检查: $PASSED_CHECKS"
    echo "失败检查: $FAILED_CHECKS"
    echo "成功率: $(( PASSED_CHECKS * 100 / TOTAL_CHECKS ))%"
    
    if [[ $FAILED_CHECKS -eq 0 ]]; then
        log_success "所有验证通过！部署成功。"
    elif [[ $FAILED_CHECKS -le 3 ]]; then
        log_warning "大部分验证通过，但有少量问题需要关注。"
    else
        log_error "多项验证失败，请检查部署配置。"
    fi
    
    generate_report
}

# 执行主函数
main "$@"