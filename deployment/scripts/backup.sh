#!/bin/bash

# HuanuCanvas 备份脚本
# 版本: v1.4.1

set -e

# 配置
ENVIRONMENT=${1:-staging}
BACKUP_DIR="/opt/huanu-canvas/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="huanu-canvas-backup-$ENVIRONMENT-$TIMESTAMP"
RETENTION_DAYS=30

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}开始备份 - 环境: $ENVIRONMENT${NC}"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 备份函数
backup_volume() {
    local volume_name=$1
    local backup_file="$BACKUP_DIR/${BACKUP_NAME}_${volume_name}.tar"
    
    echo -n "备份数据卷 $volume_name... "
    
    if docker run --rm -v huanu-${volume_name}_${ENVIRONMENT}:/source -v "$BACKUP_DIR":/backup alpine tar czf "/backup/${BACKUP_NAME}_${volume_name}.tar" -C /source . > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
        return 1
    fi
}

backup_database() {
    local db_type=$1
    local container_name=$2
    local backup_file="$BACKUP_DIR/${BACKUP_NAME}_${db_type}.sql"
    
    case $db_type in
        "postgres")
            echo -n "备份 PostgreSQL 数据库... "
            if docker exec "$container_name" pg_dump -U huanu huanu > "$backup_file" 2>/dev/null; then
                echo -e "${GREEN}✓${NC}"
                gzip "$backup_file"
            else
                echo -e "${RED}✗${NC}"
                return 1
            fi
            ;;
        "redis")
            echo -n "备份 Redis 数据... "
            if docker exec "$container_name" redis-cli BGSAVE > /dev/null 2>&1; then
                sleep 5  # 等待保存完成
                docker cp "$container_name:/data/dump.rdb" "$BACKUP_DIR/${BACKUP_NAME}_redis.rdb"
                echo -e "${GREEN}✓${NC}"
            else
                echo -e "${RED}✗${NC}"
                return 1
            fi
            ;;
    esac
}

backup_configuration() {
    local config_file=$1
    local backup_file="$BACKUP_DIR/${BACKUP_NAME}_$(basename $config_file)"
    
    echo -n "备份配置文件 $config_file... "
    
    if [ -f "$config_file" ]; then
        cp "$config_file" "$backup_file"
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${YELLOW}⚠ 文件不存在，跳过${NC}"
    fi
}

# 环境特定配置
case $ENVIRONMENT in
    "development")
        containers=()
        volumes=("data" "input" "output" "creative" "thumbnails")
        configs=(".env.development" "deployment/docker-compose.yml")
        ;;
    "staging")
        containers=("huanu-postgres-staging" "huanu-redis-staging")
        volumes=("data" "input" "output" "creative" "thumbnails" "postgres" "redis")
        configs=(".env.staging" "deployment/docker-compose.yml" "deployment/nginx.conf")
        ;;
    "production")
        containers=("huanu-postgres-production" "huanu-redis-production")
        volumes=("data" "input" "output" "creative" "thumbnails" "postgres" "redis")
        configs=(".env.production" "deployment/docker-compose.yml" "deployment/nginx.conf")
        ;;
esac

# 创建备份清单
BACKUP_MANIFEST="$BACKUP_DIR/${BACKUP_NAME}_manifest.txt"
echo "HuanuCanvas 备份清单" > "$BACKUP_MANIFEST"
echo "环境: $ENVIRONMENT" >> "$BACKUP_MANIFEST"
echo "时间: $(date)" >> "$BACKUP_MANIFEST"
echo "版本: v1.4.1" >> "$BACKUP_MANIFEST"
echo "" >> "$BACKUP_MANIFEST"

# 备份数据卷
echo -e "${YELLOW}=== 备份数据卷 ===${NC}"
for volume in "${volumes[@]}"; do
    if backup_volume "$volume"; then
        echo "数据卷 $volume" >> "$BACKUP_MANIFEST"
    fi
done

# 备份数据库
echo -e "${YELLOW}=== 备份数据库 ===${NC}"
for container in "${containers[@]}"; do
    if docker ps --format '{{.Names}}' | grep -q "^$container$"; then
        if [[ "$container" == *"postgres"* ]]; then
            backup_database "postgres" "$container"
            echo "PostgreSQL 数据库" >> "$BACKUP_MANIFEST"
        elif [[ "$container" == *"redis"* ]]; then
            backup_database "redis" "$container"
            echo "Redis 数据" >> "$BACKUP_MANIFEST"
        fi
    fi
done

# 备份配置文件
echo -e "${YELLOW}=== 备份配置文件 ===${NC}"
for config in "${configs[@]}"; do
    backup_configuration "$config"
done

# 创建压缩包
echo -e "${YELLOW}=== 创建压缩包 ===${NC}"
cd "$BACKUP_DIR"
tar czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"*

# 清理临时文件
rm -rf "${BACKUP_NAME}_"*

# 生成备份信息
BACKUP_SIZE=$(du -sh "${BACKUP_NAME}.tar.gz" | cut -f1)
echo -e "${GREEN}备份完成${NC}"
echo "备份文件: ${BACKUP_NAME}.tar.gz"
echo "备份大小: $BACKUP_SIZE"
echo "备份位置: $BACKUP_DIR"

# 更新备份清单
echo "" >> "$BACKUP_MANIFEST"
echo "备份文件: ${BACKUP_NAME}.tar.gz" >> "$BACKUP_MANIFEST"
echo "备份大小: $BACKUP_SIZE" >> "$BACKUP_MANIFEST"

# 清理旧备份
echo -e "${YELLOW}=== 清理旧备份 ===${NC}"
find "$BACKUP_DIR" -name "huanu-canvas-backup-$ENVIRONMENT-*" -type f -mtime +$RETENTION_DAYS -delete
echo "清理完成，保留最近 $RETENTION_DAYS 天的备份"

# 备份验证
echo -e "${YELLOW}=== 备份验证 ===${NC}"
if tar tzf "${BACKUP_NAME}.tar.gz" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 备份文件完整性验证通过${NC}"
else
    echo -e "${RED}✗ 备份文件损坏${NC}"
    exit 1
fi

# 清理策略
echo -e "${YELLOW}=== 备份策略 ===${NC}"
backup_count=$(find "$BACKUP_DIR" -name "huanu-canvas-backup-$ENVIRONMENT-*.tar.gz" | wc -l)
echo "当前备份数量: $backup_count"
echo "保留策略: 每日备份，保留 $RETENTION_DAYS 天"

if [ "$backup_count" -gt 10 ]; then
    echo -e "${YELLOW}⚠ 备份数量较多，建议检查清理策略${NC}"
fi

echo -e "\n${GREEN}备份任务完成${NC}"
echo "备份文件: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
echo "清单文件: $BACKUP_MANIFEST"