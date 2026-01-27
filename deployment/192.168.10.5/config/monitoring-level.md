# HuanuCanvas 监控级别设计

## 📊 监控级别对比分析

### 选项A: 基础监控 (进程状态 + 资源使用)
**推荐指数**: ⭐⭐⭐⭐⭐ (测试环境最佳选择)

#### 监控范围
- ✅ **进程监控**: 服务是否运行
- ✅ **资源使用**: CPU、内存、磁盘使用率
- ✅ **网络状态**: 端口可达性
- ✅ **磁盘空间**: 存储空间监控
- ✅ **基础告警**: 服务停止、磁盘满

#### 技术实现
```bash
# 基础监控脚本
#!/bin/bash
# basic-monitor.sh

# 检查服务状态
check_service() {
    local service=$1
    local port=$2
    
    if nc -z localhost $port 2>/dev/null; then
        echo "✅ $service 运行正常 (端口 $port)"
        return 0
    else
        echo "❌ $service 服务异常 (端口 $port)"
        return 1
    fi
}

# 检查资源使用
check_resources() {
    echo "=== 系统资源状态 ==="
    echo "CPU使用率: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')%"
    echo "内存使用: $(free | grep Mem | awk '{printf("%.1f%%", $3/$2 * 100.0)}')"
    echo "磁盘使用: $(df -h / | awk 'NR==2{printf "%s", $5}')"
    echo "负载平均: $(uptime | awk -F'load average:' '{print $2}')"
}

# 执行检查
check_service "前端" 5206
check_service "后端" 8765
check_resources
```

### 选项B: 中级监控 (应用性能 + 日志收集)
**推荐指数**: ⭐⭐⭐

#### 监控范围
- ✅ **基础监控** (包含A级)
- ✅ **应用性能**: API响应时间、吞吐量
- ✅ **日志收集**: 错误日志、访问日志分析
- ✅ **用户活动**: 活跃用户、请求统计
- ✅ **智能告警**: 性能阈值告警

### 选项C: 高级监控 (完整APM + 智能告警)
**推荐指数**: ⭐⭐

#### 监控范围
- ✅ **中级监控** (包含B级)
- ✅ **完整APM**: 分布式链路追踪
- ✅ **智能告警**: 机器学习异常检测
- ✅ **业务监控**: 自定义业务指标
- ✅ **容量规划**: 自动扩展建议

## 🏆 测试环境监控选择

### 选定方案: 基础监控 + 日志收集

**选择理由**:
1. **资源友好**: 占用资源少，适合测试环境
2. **成本效益**: 简单有效，成本低
3. **易于维护**: 配置简单，维护成本低
4. **响应及时**: 能快速发现关键问题
5. **扩展性好**: 可根据需要升级

### 监控实施方案

#### 1. 进程和端口监控
```bash
#!/bin/bash
# process-monitor.sh

# 服务端口映射
declare -A SERVICES=(
    ["frontend"]="5206"
    ["backend"]="8765"
    ["grafana"]="3001"
    ["prometheus"]="9091"
)

# 检查服务状态
check_services() {
    local failed=0
    for service in "${!SERVICES[@]}"; do
        port=${SERVICES[$service]}
        if nc -z localhost $port 2>/dev/null; then
            echo "✅ $service ($port) - 正常"
        else
            echo "❌ $service ($port) - 异常"
            ((failed++))
        fi
    done
    return $failed
}

# 发送告警（如果服务异常）
send_alert() {
    local message=$1
    echo "[$(date)] ALERT: $message" >> /opt/huanu-canvas/logs/alerts.log
    
    # 邮件告警 (可选)
    if command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "HuanuCanvas服务告警" admin@example.com
    fi
}

# 主检查逻辑
main() {
    if ! check_services; then
        send_alert "检测到服务异常，请检查系统状态"
        exit 1
    else
        echo "所有服务运行正常"
    fi
}

main
```

#### 2. 资源使用监控
```bash
#!/bin/bash
# resource-monitor.sh

# 阈值设置
CPU_THRESHOLD=80
MEMORY_THRESHOLD=85
DISK_THRESHOLD=90
LOAD_THRESHOLD=2.0

# 检查CPU使用率
check_cpu() {
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    if (( $(echo "$cpu_usage > $CPU_THRESHOLD" | bc -l) )); then
        echo "⚠️ CPU使用率过高: ${cpu_usage}%"
        return 1
    else
        echo "✅ CPU使用率正常: ${cpu_usage}%"
        return 0
    fi
}

# 检查内存使用
check_memory() {
    local mem_usage=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
    if (( mem_usage > MEMORY_THRESHOLD )); then
        echo "⚠️ 内存使用率过高: ${mem_usage}%"
        return 1
    else
        echo "✅ 内存使用率正常: ${mem_usage}%"
        return 0
    fi
}

# 检查磁盘使用
check_disk() {
    local disk_usage=$(df -h / | awk 'NR==2{printf "%s", $5}' | sed 's/%//')
    if (( disk_usage > DISK_THRESHOLD )); then
        echo "⚠️ 磁盘使用率过高: ${disk_usage}%"
        return 1
    else
        echo "✅ 磁盘使用率正常: ${disk_usage}%"
        return 0
    fi
}

# 检查系统负载
check_load() {
    local load=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    if (( $(echo "$load > $LOAD_THRESHOLD" | bc -l) )); then
        echo "⚠️ 系统负载过高: $load"
        return 1
    else
        echo "✅ 系统负载正常: $load"
        return 0
    fi
}

# 执行所有检查
main() {
    echo "=== 资源使用监控 - $(date) ==="
    local failed=0
    
    check_cpu || ((failed++))
    check_memory || ((failed++))
    check_disk || ((failed++))
    check_load || ((failed++))
    
    if (( failed > 0 )); then
        echo "发现 $failed 项资源使用异常"
        exit 1
    else
        echo "所有资源使用正常"
    fi
}

main
```

#### 3. 日志收集和分析
```bash
#!/bin/bash
# log-analyzer.sh

LOG_DIR="/opt/huanu-canvas/logs"
ARCHIVE_DIR="$LOG_DIR/archive"

# 创建日志目录
mkdir -p $LOG_DIR $ARCHIVE_DIR

# 日志轮转
rotate_logs() {
    local log_file=$1
    if [ -f "$log_file" ] && [ -s "$log_file" ]; then
        mv "$log_file" "$ARCHIVE_DIR/$(basename $log_file).$(date +%Y%m%d_%H%M%S)"
        touch "$log_file"
    fi
}

# 分析错误日志
analyze_errors() {
    local error_log="$LOG_DIR/error.log"
    local temp_error="/tmp/error_analysis_$(date +%Y%m%d).log"
    
    if [ -f "$error_log" ]; then
        # 统计错误类型
        grep -i "error\|exception\|failed" "$error_log" | \
        awk '{print $1, $2, $3}' | sort | uniq -c | sort -nr > "$temp_error"
        
        # 检查是否有新的严重错误
        local recent_errors=$(grep -i "$(date +%Y-%m-%d)" "$error_log" | grep -i "fatal\|critical" | wc -l)
        if [ $recent_errors -gt 0 ]; then
            echo "⚠️ 发现 $recent_errors 个严重错误"
            tail -20 "$error_log" | grep -i "fatal\|critical"
        fi
    fi
}

# 分析访问日志
analyze_access() {
    local access_log="$LOG_DIR/access.log"
    
    if [ -f "$access_log" ]; then
        # 统计HTTP状态码
        echo "=== HTTP状态码统计 ==="
        awk '{print $9}' "$access_log" | sort | uniq -c | sort -nr
        
        # 检查异常请求
        local error_requests=$(grep -E " 4[0-9]{2}| 5[0-9]{2}" "$access_log" | wc -l)
        echo "错误请求数量: $error_requests"
        
        # 统计IP访问量
        echo "=== Top 10 访问IP ==="
        awk '{print $1}' "$access_log" | sort | uniq -c | sort -nr | head -10
    fi
}

# 清理旧日志
cleanup_logs() {
    find $ARCHIVE_DIR -name "*.log.*" -mtime +30 -delete
    echo "旧日志清理完成"
}

# 主函数
main() {
    echo "=== 日志分析 - $(date) ==="
    
    # 轮转日志
    rotate_logs "$LOG_DIR/access.log"
    rotate_logs "$LOG_DIR/error.log"
    
    # 分析日志
    analyze_errors
    echo ""
    analyze_access
    echo ""
    
    # 清理旧日志
    cleanup_logs
    
    echo "=== 日志分析完成 ==="
}

main "$@"
```

#### 4. 健康检查脚本
```bash
#!/bin/bash
# health-check.sh

API_BASE_URL="http://192.168.10.5"
HEALTH_CHECK_URL="$API_BASE_URL:8765/health"

# API健康检查
check_api_health() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_CHECK_URL)
    if [ "$response" = "200" ]; then
        echo "✅ API服务健康"
        return 0
    else
        echo "❌ API服务异常 (HTTP $response)"
        return 1
    fi
}

# 基础功能测试
check_basic_functions() {
    echo "=== 基础功能测试 ==="
    
    # 测试前端页面
    local frontend_status=$(curl -s -o /dev/null -w "%{http_code}" $API_BASE_URL:5206)
    echo "前端页面: $frontend_status"
    
    # 测试API端点
    local api_status=$(curl -s -o /dev/null -w "%{http_code}" $API_BASE_URL:8765/api)
    echo "API端点: $api_status"
    
    # 测试监控面板
    local grafana_status=$(curl -s -o /dev/null -w "%{http_code}" $API_BASE_URL:3001)
    echo "Grafana: $grafana_status"
}

# 数据库连接检查
check_database() {
    local db_path="/opt/huanu-canvas/app/data/huanu_canvas_test.db"
    if [ -f "$db_path" ]; then
        echo "✅ 数据库文件存在"
        local db_size=$(du -h "$db_path" | cut -f1)
        echo "数据库大小: $db_size"
    else
        echo "❌ 数据库文件不存在"
        return 1
    fi
}

# SSL证书检查
check_ssl_certificate() {
    local cert_path="/opt/huanu-canvas/ssl/cert.pem"
    if [ -f "$cert_path" ]; then
        local expire_date=$(openssl x509 -in "$cert_path" -noout -enddate | cut -d= -f2)
        echo "SSL证书过期时间: $expire_date"
    else
        echo "⚠️ SSL证书不存在"
    fi
}

# 生成健康报告
generate_health_report() {
    local report_file="/opt/huanu-canvas/logs/health-report-$(date +%Y%m%d).log"
    
    {
        echo "=== HuanuCanvas 健康检查报告 ==="
        echo "检查时间: $(date)"
        echo "服务器: 192.168.10.5"
        echo ""
        
        check_api_health
        check_basic_functions
        check_database
        check_ssl_certificate
        
        echo ""
        echo "=== 系统资源 ==="
        free -h
        df -h
        
        echo ""
        echo "=== 运行进程 ==="
        ps aux | grep -E "(node|nginx)" | grep -v grep
        
    } > "$repor
