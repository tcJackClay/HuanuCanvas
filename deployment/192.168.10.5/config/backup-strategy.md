# HuanuCanvas 按需备份策略

## 🔄 备份策略设计

### 备份触发条件

#### 1. 自动备份触发
```bash
# 时间触发
- 每日凌晨2点: 数据备份
- 每周日凌晨3点: 完整备份
- 每月1号凌晨4点: 归档备份

# 事件触发  
- 部署前: 重要版本更新前
- 部署后: 验证成功后的安全备份
- 手动触发: 管理员手动执行
```

#### 2. 手动备份命令
```bash
# 快速备份
/opt/huanu-canvas/scripts/backup.sh quick

# 完整备份  
/opt/huanu-canvas/scripts/backup.sh full

# 数据库备份
/opt/huanu-canvas/scripts/backup.sh database

# 按需备份
/opt/huanu-canvas/scripts/backup.sh ondemand "用户要求的原因"
```

### 备份内容分类

#### A类: 关键数据 (每日备份)
- SQLite数据库文件
- 用户上传文件
- 系统配置文件
- SSL证书文件

#### B类: 应用数据 (每周备份)
- 前端构建文件
- 后端应用程序
- 日志文件
- 缓存数据

#### C类: 运维数据 (每月备份)
- 监控配置
- 部署脚本
- 文档资料
- 历史日志

### 备份存储策略

#### 存储层级
```
本地存储 (/opt/huanu-canvas/backup/)
├── daily/          # 每日备份 (保留7天)
├── weekly/         # 每周备份 (保留4周)
├── monthly/        # 每月备份 (保留12个月)
└── archive/        # 长期归档 (压缩存储)
```

#### 备份脚本实现
```bash
#!/bin/bash
# backup.sh - HuanuCanvas备份脚本

set -e

# 配置变量
BACKUP_BASE="/opt/huanu-canvas/backup"
APP_DIR="/opt/huanu-canvas"
DATA_DIR="/opt/huanu-canvas/app/data"
LOG_FILE="/opt/huanu-canvas/logs/backup.log"

# 辅助函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

error_exit() {
    log "ERROR: $1"
    exit 1
}

# 创建备份目录
setup_backup_dirs() {
    local dirs=("daily" "weekly" "monthly" "archive")
    for dir in "${dirs[@]}"; do
        mkdir -p "$BACKUP_BASE/$dir"
    done
}

# A类备份: 关键数据
backup_critical_data() {
    local backup_name="critical_$(date +%Y%m%d_%H%M%S)"
    local backup_dir="$BACKUP_BASE/daily/$backup_name"
    
    log "开始A类备份: $backup_name"
    
    mkdir -p "$backup_dir"
    
    # 数据库备份
    if [ -f "$DATA_DIR/huanu_canvas_test.db" ]; then
        cp "$DATA_DIR/huanu_canvas_test.db" "$backup_dir/"
        log "✅ 数据库文件已备份"
    fi
    
    # 配置文件备份
    if [ -d "$APP_DIR/config" ]; then
        cp -r "$APP_DIR/config" "$backup_dir/"
        log "✅ 配置文件已备份"
    fi
    
    # SSL证书备份
    if [ -d "$APP_DIR/ssl" ]; then
        cp -r "$APP_DIR/ssl" "$backup_dir/"
        log "✅ SSL证书已备份"
    fi
    
    # 用户上传文件
    if [ -d "$APP_DIR/app/output" ]; then
        cp -r "$APP_DIR/app/output" "$backup_dir/"
        log "✅ 用户文件已备份"
    fi
    
    # 创建备份清单
    create_backup_manifest "$backup_dir" "critical"
    
    # 压缩备份
    compress_backup "$backup_dir"
    
    log "A类备份完成: $backup_name"
}

# B类备份: 应用数据
backup_application_data() {
    local backup_name="app_$(date +%Y%W)"
    local backup_dir="$BACKUP_BASE/weekly/$backup_name"
    
    log "开始B类备份: $backup_name"
    
    mkdir -p "$backup_dir"
    
    # 前端构建文件
    if [ -d "$APP_DIR/app/frontend" ]; then
        cp -r "$APP_DIR/app/frontend" "$backup_dir/"
        log "✅ 前端文件已备份"
    fi
    
    # 后端应用程序
    if [ -d "$APP_DIR/app/backend" ]; then
        cp -r "$APP_DIR/app/backend" "$backup_dir/"
        log "✅ 后端应用已备份"
    fi
    
    # 脚本文件
    if [ -d "$APP_DIR/scripts" ]; then
        cp -r "$APP_DIR/scripts" "$backup_dir/"
        log "✅ 脚本文件已备份"
    fi
    
    create_backup_manifest "$backup_dir" "application"
    compress_backup "$backup_dir"
    
    log "B类备份完成: $backup_name"
}

# C类备份: 运维数据
backup_operations_data() {
    local backup_name="ops_$(date +%Y%m)"
    local backup_dir="$BACKUP_BASE/monthly/$backup_name"
    
    log "开始C类备份: $backup_name"
    
    mkdir -p "$backup_dir"
    
    # 监控配置
    if [ -d "$APP_DIR/monitoring" ]; then
        cp -r "$APP_DIR/monitoring" "$backup_dir/"
        log "✅ 监控配置已备份"
    fi
    
    # Docker配置
    if [ -d "$APP_DIR/docker" ]; then
        cp -r "$APP_DIR/docker" "$backup_dir/"
        log "✅ Docker配置已备份"
    fi
    
    # 文档资料
    if [ -d "$APP_DIR/docs" ]; then
        cp -r "$APP_DIR/docs" "$backup_dir/"
        log "✅ 文档资料已备份"
    fi
    
    create_backup_manifest "$backup_dir" "operations"
    compress_backup "$backup_dir"
    
    log "C类备份完成: $backup_name"
}

# 创建备份清单
create_backup_manifest() {
    local backup_dir=$1
    local backup_type=$2
    
    cat > "$backup_dir/manifest.json" << EOF
{
    "backup_name": "$(basename $backup_dir)",
    "backup_type": "$backup_type",
    "created_at": "$(date -Iseconds)",
    "server": "192.168.10.5",
    "app_version": "1.4.1",
    "backup_path": "$backup_dir",
    "files": [
$(find "$backup_dir" -type f -exec basename {} \; | sort | sed 's/^/        "/' | sed 's/$/"/' | sed '$!s/$/,/' | sed '$s/$//')
    ]
}
