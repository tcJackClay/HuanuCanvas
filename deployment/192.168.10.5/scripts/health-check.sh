#!/bin/bash
# HuanuCanvas健康检查脚本

set -e

# 配置变量
APP_NAME="huanu-canvas"
SERVER_IP="192.168.10.5"
APP_DIR="/opt/$APP_NAME"
LOG_FILE="$APP_DIR/logs/health-check.log"

# 检查间隔（秒）
CHECK_INTERVAL=30
MAX_RETRIES=3

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
    log "INFO: $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    log "WARN: $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    log "ERROR: $1"
}

# 检查Docker服务状态
check_docker_services() {
    log_info "检查Docker服务状态..."
    
    cd "$APP_DIR"
    
    local services=("frontend-test" "backend-test" "prometheus-test" "sqlite-test")
    local failed_services=()
    
    for service in "${services[@]}"; do
        if docker-compose -f deployment/docker-compose.test.yml ps "$service" | grep -q "Up"; then
            log_info "✅ $service 服务运行正常"
        else
            log_error "❌ $service 服务异常"
            failed_services+=("$service")
        fi
    done
    
    if [ ${#failed_services[@]} -gt 0 ]; then
        log_error "异常服务: ${failed_services[*]}"
        return 1
    fi
    
    return 0
}

# 检查端口连通性
check_port_connectivity() {
    log_info "检查端口连通性..."
    
    local ports=(
        "5206:frontend"
        "8765:backend"
        "3001:grafana"
        "9091:prometheus"
    )
    
    local failed_ports=()
    
    for port_info in "${ports[@]}"; do
        local port=$(echo "$port_info" | cut -d: -f1)
        local name=$(echo "$port_info" | cut -d: -f2)
        
        if nc -z localhost "$port" 2>/dev/null; then
            log_info "✅ $name 端口 ($port) 正常"
        else
            log_error "❌ $name 端口 ($port) 异常"
            failed_ports+=("$port")
        fi
    done
    
    if [ ${#failed_ports[@]} -gt 0 ]; then
        log_error "异常端口: ${failed_ports[*]}"
        return 1
    fi
    
    return 0
}

# 检查HTTP服务响应
check_http_responses() {
    log_info "检查HTTP服务响应..."
    
    local endpoints=(
        "http://localhost:5206:frontend"
        "http://localhost:8765/health:backend"
        "http://localhost:8765/api:api"
    )
    
    local failed_endpoints=()
    
    for endpoint_info in "${endpoints[@]}"; do
        local url=$(echo "$endpoint_info" | cut -d: -f1-3)
        local name=$(echo "$endpoint_info" | cut -d: -f4)
        
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" --connect-timeout 10)
        
        if [ "$status_code" = "200" ]; then
            log_info "✅ $name HTTP响应正常 ($status_code)"
        else
            log_error "❌ $name HTTP响应异常 ($status_code)"
            failed_endpoints+=("$name:$status_code")
        fi
    done
    
    if [ ${#failed_endpoints[@]} -gt 0 ]; then
        log_error "异常端点: ${failed_endpoints[*]}"
        return 1
    fi
    
    return 0
}

# 检查系统资源
check_system_resources() {
    log_info "检查系统资源..."
    
    # CPU使用率
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    local cpu_threshold=80
    
    if (( $(echo "$cpu_usage < $cpu_threshold" | bc -l) )); then
        log_info "✅ CPU使用率正常 (${cpu_usage}%)"
    else
        log_warn "⚠️ CPU使用率过高 (${cpu_usage}%)"
    fi
    
    # 内存使用率
    local mem_usage=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
    local mem_threshold=85
    
    if [ "$mem_usage" -lt "$mem_threshold" ]; then
        log_info "✅ 内存使用率正常 (${mem_usage}%)"
    else
        log_warn "⚠️ 内存使用率过高 (${mem_usage}%)"
    fi
    
    # 磁盘使用率
    local disk_usage=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
    local disk_threshold=90
    
    if [ "$disk_usage" -lt "$disk_threshold" ]; then
        log_info "✅ 磁盘使用率正常 (${disk_usage}%)"
    else
        log_error "❌ 磁盘使用率过高 (${disk_usage}%)"
        return 1
    fi
    
    # 系统负载
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local load_threshold=2.0
    
    if (( $(echo "$load_avg < $load_threshold" | bc -l) )); then
        log_info "✅ 系统负载正常 ($load_avg)"
    else
        log_warn "⚠️ 系统负载过高 ($load_avg)"
    fi
    
    return 0
}

# 检查数据库状态
check_database_status() {
    log_info "检查数据库状态..."
    
    local db_path="$APP_DIR/app/data/huanu_canvas_test.db"
    
    if [ -f "$db_path" ]; then
        local db_size=$(du -h "$db_path" | cut -f1)
        log_info "✅ 数据库文件存在 (大小: $db_size)"
        
        # 检查数据库完整性
        if sqlite3 "$db_path" "PRAGMA integrity_check;" | grep -q "ok"; then
            log_info "✅ 数据库完整性检查通过"
        else
            log_error "❌ 数据库完整性检查失败"
            return 1
        fi
    else
        log_error "❌ 数据库文件不存在"
        return 1
    fi
    
    return 0
}

# 检查日志错误
check_log_errors() {
    log_info "检查日志错误..."
    
    local error_count=0
    
    # 检查Docker容器日志
    cd "$APP_DIR"
    
    local containers=$(docker-compose -f deployment/docker-compose.test.yml ps -q)
    
    for container in $containers; do
        local container_name=$(docker inspect --format='{{.Name}}' "$container" | sed 's/\///')
        local recent_errors=$(docker logs "$container" --tail 100 2>&1 | grep -i "error\|exception\|failed" | wc -l)
        
        if [ "$recent_errors" -gt 0 ]; then
            log_warn "⚠️ $container_name 容器存在 $recent_errors 个错误"
            error_count=$((error_count + recent_errors))
        else
            log_info "✅ $container_name 容器无错误"
        fi
    done
    
    # 检查系统日志
    local syslog_errors=$(journalctl --since "1 hour ago" | grep -i "$APP_NAME" | grep -i "error" | wc -l)
    if [ "$syslog_errors" -gt 0 ]; then
        log_warn "⚠️ 系统日志中存在 $syslog_errors 个错误"
        error_count=$((error_count + syslog_errors))
    fi
    
    if [ "$error_count" -eq 0 ]; then
        log_info "✅ 日志检查通过，无错误"
    else
        log_warn "⚠️ 发现 $error_count 个错误"
    fi
    
    return 0
}

# 检查网络安全
check_network_security() {
    log_info "检查网络安全配置..."
    
    # 检查防火墙状态
    if ufw status | grep -q "Status: active"; then
        log_info "✅ 防火墙已启用"
    else
        log_warn "⚠️ 防火墙未启用"
    fi
    
    # 检查SSH配置
    if [ -f "/etc/ssh/sshd_config" ]; then
        local ssh_config=$(grep -E "^#?PasswordAuthentication|^#?PermitRootLogin" /etc/ssh/sshd_config)
        if echo "$ssh_config" | grep -q "PermitRootLogin yes"; then
            log_warn "⚠️ SSH root登录已启用，建议禁用"
        else
            log_info "✅ SSH配置相对安全"
        fi
    fi
    
    # 检查SSL证书
    local ssl_dir="$APP_DIR/ssl"
    if [ -d "$ssl_dir" ] && [ -f "$ssl_dir/cert.pem" ]; then
        log_info "✅ SSL证书文件存在"
        
        # 检查证书有效期
        local expire_date=$(openssl x509 -in "$ssl_dir/cert.pem" -noout -enddate 2>/dev/null | cut -d= -f2)
        if [ -n "$expire_date" ]; then
            local expire_timestamp=$(date -d "$expire_date" +%s)
            local current_timestamp=$(date +%s)
            local days_left=$(( (expire_timestamp - current_timestamp) / 86400 ))
            
            if [ "$days_left" -gt 30 ]; then
                log_info "✅ SSL证书有效期充足 ($days_left 天)"
            elif [ "$days_left" -gt 7 ]; then
                log_warn "⚠️ SSL证书即将过期 ($days_left 天)"
            else
                log_error "❌ SSL证书即将过期 ($days_left 天)"
            fi
        fi
    else
        log_warn "⚠️ SSL证书不存在"
    fi
    
    return 0
}

# 执行API功能测试
api_functionality_test() {
    log_info "执行API功能测试..."
    
    # 测试健康检查端点
    local health_response=$(curl -s http://localhost:8765/health)
    if echo "$health_response" | grep -q "healthy\|ok"; then
        log_info "✅ API健康检查端点正常"
    else
        log_error "❌ API健康检查端点异常"
        return 1
    fi
    
    # 测试API基础端点
    local api_response=$(curl -s http://localhost:8765/api)
    local api_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8765/api)
    
    if [ "$api_status" = "200" ] || [ "$api_status" = "404" ]; then
        log_info "✅ API基础端点可访问 (状态: $api_status)"
    else
        log_error "❌ API基础端点异常 (状态: $api_status)"
        return 1
    fi
    
    return 
