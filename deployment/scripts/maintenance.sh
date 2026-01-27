#!/bin/bash
# HuanuCanvas 日常维护脚本
# 版本: v1.4.1

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志配置
LOG_FILE="/var/log/huanu-maintenance.log"
MAX_LOG_SIZE=10485760  # 10MB

# 日志函数
log_message() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local log_entry="[$timestamp] [$level] $message"
    
    # 写入日志文件
    echo "$log_entry" >> "$LOG_FILE"
    
    # 控制台输出
    case $level in
        "INFO")  echo -e "${BLUE}[INFO]${NC} $message" ;;
        "SUCCESS") echo -e "${GREEN}[SUCCESS]${NC} $message" ;;
        "WARNING") echo -e "${YELLOW}[WARNING]${NC} $message" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} $message" ;;
    esac
}

# 轮转日志文件
rotate_logs() {
    if [ -f "$LOG_FILE" ] && [ $(stat -c%s "$LOG_FILE") -gt $MAX_LOG_SIZE ]; then
        mv "$LOG_FILE" "${LOG_FILE}.old"
        touch "$LOG_FILE"
        chmod 644 "$LOG_FILE"
        log_message "INFO" "日志文件已轮转"
    fi
}

# 清理Docker资源
cleanup_docker() {
    log_message "INFO" "开始清理Docker资源..."
    
    # 清理未使用的镜像
    docker image prune -f
    
    # 清理未使用的容器
    docker container prune -f
    
    # 清理未使用的网络
    docker network prune -f
    
    # 清理构建缓存
    docker builder prune -f
    
    log_message "SUCCESS" "Docker资源清理完成"
}

# 清理系统日志
cleanup_system_logs() {
    log_message "INFO" "开始清理系统日志..."
    
    # 清理Docker容器日志
    for container in $(docker ps -aq); do
        docker logs --details "$container" 2>/dev/null | head -1 > /dev/null  # 检查容器是否存在
        if [ $? -eq 0 ]; then
            docker logs "$container" 2>/dev/null | wc -l | {
                read lines
                if [ "$lines" -gt 10000 ]; then
                    docker logs --details "$container" --tail=1000 > /dev/null 2>&1
                    log_message "INFO" "已清理容器 $container 的日志"
                fi
            }
        fi
    done
    
    # 清理系统日志 (如果有权限)
    if [ -d "/var/log" ] && [ -w "/var/log" ]; then
        find /var/log -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
        find /var/log -name "*.gz" -type f -mtime +30 -delete 2>/dev/null || true
    fi
    
    log_message "SUCCESS" "系统日志清理完成"
}

# 清理备份文件
cleanup_backups() {
    log_message "INFO" "开始清理旧备份文件..."
    
    # 删除30天前的备份
    if [ -d "backup" ]; then
        find backup -name "*.tar.gz" -mtime +30 -delete 2>/dev/null || true
        DELETED_COUNT=$(find backup -name "*.tar.gz" -mtime +30 2>/dev/null | wc -l)
        if [ $DELETED_COUNT -gt 0 ]; then
            log_message "INFO" "已删除 $DELETED_COUNT 个过期备份文件"
        fi
    fi
    
    log_message "SUCCESS" "备份清理完成"
}

# 更新Docker镜像
update_docker_images() {
    log_message "INFO" "检查Docker镜像更新..."
    
    cd "$(dirname "$0")/../.."
    
    # 拉取最新镜像
    docker-compose -f deployment/docker-compose.yml pull
    
    # 检查是否有更新
    NEEDS_UPDATE=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "(huanu-canvas|huanu-backend)" | while read image; do
        if docker images "$image" --format "{{.ID}}" | head -2 | tail -n +2 | read latest_id; then
            if [ -n "$latest_id" ]; then
                echo "$image"
            fi
        fi
    done | wc -l)
    
    if [ "$NEEDS_UPDATE" -gt 0 ]; then
        log_message "WARNING" "发现 $NEEDS_UPDATE 个镜像可以更新"
        read -p "是否更新镜像? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            # 重新构建镜像
            docker build -f deployment/Dockerfile.frontend -t huanu-canvas:v1.4.1 .
            docker build -f deployment/Dockerfile.backend -t huanu-backend:v1.4.1 .
            
            # 重启服务
            docker-compose -f deployment/docker-compose.yml up -d
            log_message "SUCCESS" "镜像更新并重启完成"
        fi
    else
        log_message "SUCCESS" "所有镜像已是最新版本"
    fi
}

# 更新npm依赖
update_npm_dependencies() {
    log_message "INFO" "检查npm依赖更新..."
    
    # 检查package.json是否存在
    if [ ! -f "package.json" ]; then
        log_message "WARNING" "未找到package.json，跳过npm依赖更新"
        return
    fi
    
    # 检查更新
    npm outdated --depth=0 | grep -v "npm WARN" | while read line; do
        if [ -n "$line" ]; then
            log_message "INFO" "发现过期依赖: $line"
        fi
    done
    
    # 更新依赖
    if npm update; then
        log_message "SUCCESS" "npm依赖更新完成"
    else
        log_message "ERROR" "npm依赖更新失败"
    fi
}

# 健康检查
perform_health_check() {
    log_message "INFO" "执行健康检查..."
    
    cd "$(dirname "$0")/../.."
    
    if ./deployment/scripts/health-check.sh --verbose; then
        log_message "SUCCESS" "健康检查通过"
        return 0
    else
        log_message "ERROR" "健康检查失败"
        return 1
    fi
}

# 备份数据
backup_data() {
    log_message "INFO" "开始数据备份..."
    
    BACKUP_DIR="backup/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # 备份应用数据
    if [ -d "data" ]; then
        tar -czf "$BACKUP_DIR/app-data.tar.gz" data/ 2>/dev/null || true
        log_message "INFO" "应用数据已备份"
    fi
    
    # 备份配置文件
    cp .env "$BACKUP_DIR/" 2>/dev/null || true
    cp -r deployment/ "$BACKUP_DIR/" 2>/dev/null || true
    
    # 备份Docker配置
    docker-compose -f deployment/docker-compose.yml config > "$BACKUP_DIR/docker-compose-config.yml" 2>/dev/null || true
    
    # 生成备份信息文件
    cat > "$BACKUP_DIR/backup-info.txt" << EOF
备份时间: $(date)
备份版本: v1.4.1
Docker镜像:
$(docker images | grep huanu)
系统信息:
$(uname -a)
磁盘使用:
$(df -h)
