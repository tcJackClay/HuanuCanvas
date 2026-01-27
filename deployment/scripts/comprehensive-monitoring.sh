#!/bin/bash

# HuanuCanvas监控和验证系统 v2.0
# 基于project-deploy skill的完整监控解决方案

set -e

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MONITORING_CONFIG="$PROJECT_ROOT/deployment/monitoring"

# 监控配置
MONITORING_TARGETS=(
    "192.168.10.5"
    "192.168.10.6"
)

ALERT_THRESHOLDS=(
    "cpu_usage=80"
    "memory_usage=85"
    "disk_usage=90"
    "response_time=3000"
    "error_rate=5"
    "availability=99"
)

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"; }
log_debug() { echo -e "${PURPLE}[DEBUG]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"; }

# 创建监控报告目录
create_monitoring_reports() {
    local report_dir="$PROJECT_ROOT/monitoring-reports/$(date +%Y%m%d)"
    mkdir -p "$report_dir"
    echo "$report_dir"
}

# 系统资源监控
monitor_system_resources() {
    local host="$1"
    local report_file="$2"
    
    log_info "监控 $host 系统资源..."
    
    # SSH连接到目标主机并执行监控
    ssh -o ConnectTimeout=10 -o BatchMode=yes root@"$host" << EOF > /tmp/system_monitor_$$
set -e

echo "=== 系统资源监控报告 ==="
echo "主机: $(hostname)"
echo "时间: $(date)"
echo "运行时间: $(uptime -p)"
echo ""

# CPU使用率
echo "=== CPU 使用情况 ==="
top -bn1 | grep "Cpu(s)" | awk '{print "CPU使用率: " \$2 " user, " \$4 " system, " \$8 " idle"}'
echo ""

# 内存使用情况
echo "=== 内存使用情况 ==="
free -h
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
echo "内存使用率: $MEMORY_USAGE%"
echo ""

# 磁盘使用情况
echo "=== 磁盘使用情况 ==="
df -h
DISK_USAGE=$(df / | awk 'NR==2{print $5}' | sed 's/%//')
echo "根分区使用率: $DISK_USAGE%"
echo ""

# 网络连接
echo "=== 网络连接统计 ==="
netstat -tuln | head -20
echo ""

# 负载平均值
echo "=== 系统负载 ==="
uptime
echo ""

# Docker状态
if command -v docker &> /dev/null; then
    echo "=== Docker容器状态 ==="
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
    echo ""
    
    echo "=== Docker镜像大小 ==="
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
    echo ""
fi

# 服务状态
echo "=== 关键服务状态 ==="
services=("nginx" "docker" "ssh")
for service in "\${services[@]}"; do
    if systemctl is-active --quiet \$service 2>/dev/null; then
        echo "✓ \$service: 运行中"
    else
        echo "✗ \$service: 未运行"
    fi
done

EOF

    # 检查执行结果
    if [ $? -eq 0 ]; then
        cat /tmp/system_monitor_$$ >> "$report_file"
        log_success "$host 系统资源监控完成"
    else
        log_error "$host 系统资源监控失败"
        echo "$host 系统资源监控失败" >> "$report_file"
    fi
    
    rm -f /tmp/system_monitor_$$
}

# 应用服务监控
monitor_application_services() {
    local host="$1"
    local report_file="$2"
    
    log_info "监控 $host 应用服务..."
    
    ssh -o ConnectTimeout=10 -o BatchMode=yes root@"$host" << EOF > /tmp/app_monitor_$$
set -e

cd /opt/huanu-canvas

echo "=== 应用服务监控报告 ==="
echo ""

# Docker Compose服务状态
if [ -f "deployment/docker-compose.yml" ]; then
    echo "=== Docker Compose 服务状态 ==="
    docker-compose -f deployment/docker-compose.yml ps
    echo ""
fi

# 健康检查
echo "=== 健康检查结果 ==="
services_to_check=(
    "http://localhost/health:Frontend"
    "http://localhost:8765/health:Backend"
    "http://localhost:8765/api/health:API"
)

for service in "\${services_to_check[@]}"; do
    url=\$(echo \$service | cut -d: -f1-2)
    name=\$(echo \$service | cut -d: -f3)
    
    if curl -f -s --max-time 10 "\$url" > /dev/null; then
        echo "✓ \$name: 健康"
    else
        echo "✗ \$name: 不健康"
    fi
done
echo ""

# 日志错误检查
echo "=== 最近错误日志 ==="
if [ -d "logs" ]; then
    find logs -name "*.log" -mtime -1 -exec grep -l "ERROR\|FATAL\|CRITICAL" {} \; | head -5 | while read logfile; do
        echo "错误日志文件: \$logfile"
        tail -10 "\$logfile" | grep -E "ERROR|FATAL|CRITICAL" | head -5
        echo "---"
    done
else
    echo "未找到日志目录"
fi
echo ""

# 数据库连接测试
echo "=== 数据库连接测试 ==="
if docker-compose -f deployment/docker-compose.yml exec -T postgres pg_isready -U huanu 2>/dev/null; then
    echo "✓ 数据库连接正常"
else
    echo "✗ 数据库连接异常"
fi
echo ""

# Redis连接测试
echo "=== Redis连接测试 ==="
if docker-compose -f deployment/docker-compose.yml exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; then
    echo "✓ Redis连接正常"
else
    echo "✗ Redis连接异常"
fi

EOF

    if [ $? -eq 0 ]; then
        cat /tmp/app_monitor_$$ >> "$report_file"
        log_success "$host 应用服务监控完成"
    else
        log_error "$host 应用服务监控失败"
        echo "$host 应用服务监控失败" >> "$report_file"
    fi
    
    rm -f /tmp/app_monitor_$$
}

# 性能监控
monitor_performance() {
    local host="$1"
    local report_file="$2"
    
    log_info "监控 $host 性能..."
    
    ssh -o ConnectTimeout=10 -o BatchMode=yes root@"$host" << EOF > /tmp/perf_monitor_$$
set -e

echo "=== 性能监控报告 ==="
echo ""

# 响应时间测试
echo "=== 响应时间测试 ==="
endpoints=(
    "http://localhost:80"
    "http://localhost:8765/api/health"
)

for endpoint in "\${endpoints[@]}"; do
    echo "测试端点: \$endpoint"
    
    # 测试响应时间
    response_time=\$(curl -o /dev/null -s -w "%{time_total}" --max-time 10 "\$endpoint" 2>/dev/null || echo "timeout")
    
    if [ "\$response_time" = "timeout" ]; then
        echo "✗ 超时"
    elif (( \$(echo "\$response_time > 3.0" | bc -l) )); then
        echo "⚠️ 响应时间较慢: \${response_time}s"
    else
        echo "✓ 响应时间正常: \${response_time}s"
    fi
done
echo ""

# 并发测试
echo "=== 并发请求测试 ==="
echo "发送10个并发请求到前端..."
for i in {1..10}; do
    curl -s "http://localhost:80" > /dev/null &
done
wait
echo "并发测试完成"
echo ""

# 数据库性能
echo "=== 数据库性能 ==="
if command -v psql &> /dev/null; then
    # 检查活跃连接数
    connection_count=\$(docker-compose -f deployment/docker-compose.yml exec -T postgres psql -U huanu -d huanu -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" 2>/dev/null | tr -d ' ' || echo "unknown")
    echo "活跃数据库连接: \$connection_count"
    
    # 检查慢查询
    slow_queries=\$(docker-compose -f deployment/docker-compose.yml exec -T postgres psql -U huanu -d huanu -t -c "SELECT count(*) FROM pg_stat_statements WHERE mean_time > 1000;" 2>/dev/null | tr -d ' ' || echo "unknown")
    echo "慢查询数量 (>1000ms): \$slow_queries"
else
    echo "psql命令不可用，跳过数据库性能检查"
fi
echo ""

# 内存使用详情
echo "=== 内存使用详情 ==="
ps aux --sort=-%mem | head -10 | awk '{print \$2, \$11, \$3"%", \$4"%"}'
echo ""

EOF

    if [ $? -eq 0 ]; then
        cat /tmp/perf_monitor_$$ >> "$report_file"
        log_success "$host 性能监控完成"
    else
        log_error "$host 性能监控失败"
        echo "$host 性能监控失败" >> "$report_file"
    fi
    
    rm -f /tmp/perf_monitor_$$
}

# 安全监控
monitor_security() {
    local host="$1"
    local report_file="$2"
    
    log_info "监控 $host 安全状态..."
    
    ssh -o ConnectTimeout=10 -o BatchMode=yes root@"$host" << EOF > /tmp/security_monitor_$$
set -e

echo "=== 安全监控报告 ==="
echo ""

# 防火墙状态
echo "=== 防火墙状态 ==="
if command -v ufw &> /dev/null; then
    ufw status
else
    echo "UFW未安装"
fi
echo ""

# 失败登录尝试
echo "=== 失败登录尝试 ==="
lastb | head -10 || echo "lastb命令不可用"
echo ""

# 系统更新状态
echo "=== 系统更新状态 ==="
if command -v apt &> /dev/null; then
    apt list --upgradable 2>/dev/null | wc -l | awk '{print "可更新包数量: " \$1}'
else
    echo "apt命令不可用"
fi
echo ""

# SSL证书检查
echo "=== SSL证书状态 ==="
if [ -d "/etc/ssl/certs" ]; then
    find /etc/ssl/certs -name "*.crt" -mtime -30 | wc -l | awk '{print "最近30天内更新的证书: " \$1}'
else
    echo "SSL证书目录不存在"
fi
echo ""

# Docker安全状态
if command -v docker &> /dev/null; then
    echo "=== Docker安全状态 ==="
    
    # 检查特权容器
    privileged_containers=\$(docker ps --format "table {{.Names}}" --filter "label=privileged=true" | wc -l)
    echo "特权容器数量: \$privileged_containers"
    
    # 检查非root用户容器
    non_root_containers=\$(docker ps --format "table {{.Names}}" --filter "user=root" | wc -l)
    echo "以root用户运行的容器数量: \$non_root_containers"
    
    # 检查镜像漏洞
    if command -v trivy &> /dev/null; then
        echo "运行镜像安全扫描..."
        trivy image --severity HIGH,CRITICAL --format json 2>/dev/null | jq -r '.Results[]?.Vulnerabilities[]?.Severity' | sort | uniq -c || echo "Trivy扫描失败"
    else
        echo "Trivy未安装，跳过镜像扫描"
    fi
fi

EOF

    if [ $? -eq 0 ]; then
        cat /tmp/security_monitor_$$ >> "$report_file"
        log_success "$host 安全监控完成"
    else
        log_error "$host 安全监控失败"
        echo "$host 安全监控失败" >> "$report_file"
    fi
    
    rm -f /tmp/security_monitor_$$
}

# 网络监控
monitor_network() {
    local host="$1"
    local report_file="$2"
    
    log_info "监控 $host 网络状态..."
    
    ssh -o ConnectTimeout=10 -o BatchMode=yes root@"$host" << EOF > /tmp/network_monitor_$$
set -e

echo "=== 网络监控报告 ==="
echo ""

# 网络接口状态
echo "=== 网络接口状态 ==="
ip addr show | grep -E "^[0-9]+:|^    inet "
echo ""

# 端口监听状态
echo "=== 端口监听状态 ==="
netstat -tuln | grep LISTEN | head -20
echo ""

# 网络连接统计
echo "=== 网络连接统计 ==="
ss -s
echo ""

# DNS解析测试
echo "=== DNS解析测试 ==="
domains=("google.com" "github.com" "192.168.10.5")
for domain in "\${domains[@]}"; do
    if nslookup "\$domain" &> /dev/null; then
        echo "✓ DNS解析成功: \$domain"
    else
        echo "✗ DNS解析失败: \$domain"
    fi
done
echo ""

# 网络延迟测试
echo "=== 网络延迟测试 ==="
ping -c 3 google.com 2>/dev/null | grep "rtt\|packets" || echo "ping测试失败"
echo ""

# 负载均衡状态
echo "=== 负载均衡状态 ==="
if curl -s http://localhost/health > /dev/null; then
    echo "✓ 负载均衡器响应正常"
else
    echo "✗ 负载均衡器响应异常"
fi

EOF

    if [ $? -eq 0 ]; then
        cat /tmp/network_monitor_$$ >> "$report_file"
        log_success "$host 网络监控完成"
    else
        log_error "$host 网络监控失败"
        echo "$host 网络监控失败" >> "$report_file"
    fi
    
    rm -f /tmp/network_monitor_$$
}

# 告警检查
check_alerts() {
    local host="$1"
    local report_file="$2"
    
    log_info "检查 $host 告警状态..."
    
    ssh -o ConnectTimeout=10 -o BatchMode=yes root@"$host" << EOF > /tmp/alerts_check_$$
set -e

echo "=== 告警检查报告 ==="
echo ""

# 检查阈值违规
cpu_usage=\$(top -bn1 | grep "Cpu(s)" | awk '{print \$2}' | sed 's/%us,//' | cut -d'.' -f1)
memory_usage=\$(free | awk 'NR==2{printf "%.0f", \$3*100/\$2}')
disk_usage=\$(df / | awk 'NR==2{print \$5}' | sed 's/%//')

echo "当前资源使用率:"
echo "CPU: \${cpu_usage}%"
echo "内存: \${memory_usage}%"
echo "磁盘: \${disk_usage}%"
echo ""

# 检查告警阈值
alerts_found=false

if [ "\${cpu_usage:-0}" -gt 80 ]; then
    echo "⚠️ CPU使用率告警: \${cpu_usage}% > 80%"
    alerts_found=true
fi

if [ "\${memory_usage:-0}" -gt 85 ]; then
    echo "⚠️ 内存使用率告警: \${memory_usage}% > 85%"
    alerts_found=true
fi

if [ "\${disk_usage:-0}" -gt 90 ]; then
    echo "⚠️ 磁盘使用率告警: \${disk_usage}% > 90%"
    alerts_found=true
fi

# 响应时间检查
response_time=\$(curl -o /dev/null -s -w "%{time_total}" --max-time 5 http://localhost/health 2>/dev/null || echo "timeout")
if [ "\$response_time" != "timeout" ] && (( \$(echo "\$response_time > 3.0" | bc -l) )); then
    echo "⚠️ 响应时间告警: \${response_time}s > 3s"
    alerts_found=true
fi

# 错误率检查
error_count=\$(find /opt/huanu-canvas/logs -name "*.log" -mtime -1 -exec grep -l "ERROR" {} \; 2>/dev/null | wc -l)
if [ "\$error_count" -gt 5 ]; then
    echo "⚠️ 错误日志数量告警: \$error_count > 5"
    alerts_found=true
fi

if [ "\$alerts_found" = false ]; then
    echo "✅ 所有监控指标正常"
fi

EOF

    if [ $? -eq 0 ]; then
        cat /tmp/alerts_check_$$ >> "$report_file"
        log_success "$host 告警检查完成"
    else
        log_error "$host 告警检查失败"
        echo "$host 告警检查失败" >> "$report_file"
    fi
    
    rm -f /tmp/alerts_check_$$
}

# 生成综合监控报告
generate_comprehensive_report() {
    local report_file="$1"
    
    log_info "生成综合监控报告..."
    
    # 添加报告头部
    cat > "$report_file" << EOF
# HuanuCanvas 综合监控报告

生成时间: $(date)
监控周期: $(date -d '1 hour ago') - $(date)

## 📊 执行摘要

### 整体状态
EOF

    # 添加各主机状态概览
    echo "### 主机状态概览" >> "$report_file"
    echo "| 主机 | 系统状态 | 应用状态 | 性能状态 | 安全状态 | 告警数量 |" >> "$report_file"
    echo "|------|----------|----------|----------|----------|----------|" >> "$report_file"
    
    for host in "${MONITORING_TARGETS[@]}"; do
        echo "| $host | $(grep -q "ERROR" /tmp/system_monitor_$$ 2>/dev/null && echo "❌" || echo "✅") | $(grep -q "不健康" /tmp/app_monitor_$$ 2>/dev/null && echo "❌" || echo "✅") | $(grep -q "较慢\|timeout" /tmp/perf_monitor_$$ 2>/dev/null && echo "⚠️" || echo "✅") | $(grep -q "失败\|错误" /tmp/security_monitor_$$ 2>/dev/null && echo "⚠️" || echo "✅") | $(grep -c "⚠️" /tmp/alerts_check_$$ 2>/dev/null || echo "0") |" >> "$report_file"
    done
    
    # 添加详细报告内容
    echo "" >> "$report_file"
    echo "## 📋 详细监控数据" >> "$report_file"
    
    for host in "${MONITORING_TARGETS[@]}"; do
        echo "" >> "$report_file"
        echo "### 🖥️ $host 详细监控数据" >> "$report_file"
        
        if [ -f "/tmp/system_monitor_$host" ]; then
            echo "" >> "$report_file"
            echo "#### 系统资源" >> "$report_file"
            cat "/tmp/system_monitor_$host" >> "$report_file"
        fi
        
        if [ -f "/tmp/app_monitor_$host" ]; then
            echo "" >> "$report_file"
            echo "#### 应用服务" >> "$report_file"
            cat "/tmp/app_monitor_$host" >> "$report_file"
        fi
        
        if [ -f "/tmp/perf_monitor_$host" ]; then
            echo "" >> "$report_file"
            echo "#### 性能监控" >> "$report_file"
            cat "/tmp/perf_monitor_$host" >> "$report_file"
        fi
        
        if [ -f "/tmp/security_monitor_$host" ]; then
            echo "" >> "$report_file"
            echo "#### 安全状态" >> "$report_file"
            cat "/tmp/security_monitor_$host" >> "$report_file"
        fi
        
        if [ -f "/tmp/network_monitor_$host" ]; then
            echo "" >> "$report_file"
            echo "#### 网络状态" >> "$report_file"
            cat "/tmp/network_monitor_$host" >> "$report_file"
        fi
        
        if [ -f "/tmp/alerts_check_$host" ]; then
            echo "" >> "$report_file"
            echo "#### 告警状态" >> "$report_file"
            cat "/tmp/alerts_check_$host" >> "$report_file"
        fi
    done
    
    # 添加建议和行动项
    echo "" >> "$report_file"
    echo "## 💡 建议和行动项" >> "$report_file"
    
    # 基于监控数据生成建议
    total_alerts=$(find /tmp -name "alerts_check_*" -exec grep -c "⚠️" {} \; 2>/dev/null | awk '{sum+=$1} END {print sum+0}')
    
    if [ "$total_alerts" -gt 0 ]; then
        echo "### ⚠️ 需要关注的问题" >> "$report_file"
        echo "1. 发现 $total_alerts 个告警项目需要处理" >> "$report_file"
        echo "2. 请查看各主机的告警状态部分获取详细信息" >> "$report_file"
        echo "3. 建议在业务低峰期处理资源相关告警" >> "$report_file"
    else
        echo "### ✅ 监控状态良好" >> "$report_file"
        echo "1. 所有监控指标均在正常范围内" >> "$report_file"
        echo "2. 系统运行稳定，建议保持当前配置" >> "$report_file"
        echo "3. 继续定期执行监控检查" >> "$report_file"
    fi
    
    # 添加监控配置信息
    echo "" >> "$report_file"
    echo "## ⚙️ 监控配置" >> "$report_file"
    echo "### 告警阈值" >> "$report_file"
    for threshold in "${ALERT_THRESHOLDS[@]}"; do
        echo "- $threshold" >> "$report_file"
    done
    
    echo "" >> "$report_file"
    echo "### 监控目标" >> "$report_file"
    for target in "${MONITORING_TARGETS[@]}"; do
        echo "- $target" >> "$report_file"
    done
    
    echo "" >> "$report_file"
    echo "---" >> "$report_file"
    echo "*报告由HuanuCanvas监控和验证系统 v2.0生成*" >> "$report_file"
    
    log_success "综合监控报告生成完成: $report_file"
}

# 发送监控通知
send_monitoring_notification() {
    local report_file="$1"
    local status="$2"
    
    log_info "发送监控通知..."
    
    # 计算告警数量
    total_alerts=$(find /tmp -name "alerts_check_*" -exec grep -c "⚠️" {} \; 2>/dev/null | awk '{sum+=$1} END {print sum+0}')
    
    # 生成通知消息
    local message="HuanuCanvas监控报告 - $(date '+%Y-%m-%d %H:%M:%S')"
    local details="状态: $status | 告警: $total_alerts | 主机: ${#MONITORING_TARGETS[@]}"
    
    # Slack通知
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"text\": \"📊 HuanuCanvas监控报告\",
                \"attachments\": [{
                    \"color\": \"$status\",
                    \"fields\": [{
                        \"title\": \"监控状态\",
                        \"value\": \"$message\",
                        \"short\": true
                    }, {
                        \"title\": \"详细信息\",
                        \"value\": \"$details\",
                        \"short\": true
                    }],
                    \"actions\": [{
                        \"type\": \"button\",
                        \"text\": \"查看报告\",
                        \"url\": \"file://$report_file\"
                    }]
                }]
            }" \
            "$SLACK_WEBHOOK" 2>/dev/null || true
    fi
    
    # 邮件通知
    if [ -n "$EMAIL_NOTIFICATION" ]; then
        cat << EOF | mail -s "HuanuCanvas监控报告 - $status" "$EMAIL_NOTIFICATION"
HuanuCanvas监控报告

生成时间: $(date)
监控状态: $message
详细信息: $details

监控报告文件: $report_file

---
HuanuCanvas监控和验证系统 v2.0
EOF
    fi
    
    log_success "监控通知发送完成"
}

# 清理临时文件
cleanup_temp_files() {
    log_info "清理临时文件..."
    rm -f /tmp/system_monitor_* /tmp/app_monitor_* /tmp/perf_monitor_*
    rm -f /tmp/security_monitor_* /tmp/network_monitor_* /tmp/alerts_check_*
    log_success "临时文件清理完成"
}

# 主函数
main() {
    echo "=========================================="
    echo "HuanuCanvas监控和验证系统 v2.0"
    echo "基于project-deploy skill的完整监控解决方案"
    echo "=========================================="
    
    # 创建监控报告目录
    REPORT_DIR=$(create_monitoring_reports)
    REPORT_FILE="$REPORT_DIR/comprehensive-monitoring-report.md"
    
    log_info "开始综合监控检查..."
    log_info "报告文件: $REPORT_FILE"
    
    # 对每个监控目标执行全面检查
    for host in "${MONITORING_TARGETS[@]}"; do
        echo ""
        echo "=========================================="
        echo "监控目标: $host"
        echo "=========================================="
        
        # 执行各类监控检查
        monitor_system_resources "$host" "/tmp/system_monitor_$host"
        monitor_application_services "$host" "/tmp/app_monitor_$host"
        monitor_performance "$host" "/tmp/perf_monitor_$host"
        monitor_security "$host" "/tmp/security_monitor_$host"
        monitor_network "$host" "/tmp/network_monitor_$host"
        check_alerts "$host" "/tmp/alerts_check_$host"
    done
    
    # 生成综合报告
    generate_comprehensive_report "$REPORT_FILE"
    
    # 计算整体状态
    total_alerts=$(find /tmp -name "alerts_check_*" -exec grep -c "⚠️" {} \; 2>/dev/null | awk '{sum+=$1} END {print sum+0}')
    
    if [ "$total_alerts" -eq 0 ]; then
        STATUS="good"
        log_success "所有监控检查通过，无告警"
    elif [ "$total_alerts" -le 5 ]; then
        STATUS="warning"
        log_warning "发现 $total_alerts 个告警，需要关注"
    else
        STATUS="danger"
        log_error "发现 $total_alerts 个告警，需要立即处理"
    fi
    
    # 发送通知
    send_monitoring_notification "$REPORT_FILE" "$STATUS"
    
    echo ""
    echo "=========================================="
    echo "🎉 监控检查完成!"
    echo ""
    echo "报告位置: $REPORT_FILE"
    echo "整体状态: $STATUS"
    echo "发现告警: $total_alerts"
    echo "监控主机: ${#MONITORING_TARGETS[@]}"
    echo "=========================================="
    
    # 清理临时文件
    cleanup_temp_files
    
    # 返回适当的退出码
    if [ "$STATUS" = "danger" ]; then
        exit 2  # 严重告警
    elif [ "$STATUS" = "warning" ]; then
        exit 1  # 警告
    else
        exit 0  # 正常
    fi
}

# 信号处理
trap 'log_info "监控被用户中断"; cleanup_temp_files; exit 130' INT TERM

# 执行主函数
main "$@"