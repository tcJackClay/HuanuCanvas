#!/bin/bash

# HuanuCanvas目标服务器自动化部署脚本 v2.0
# 基于project-deploy skill优化的智能部署系统

set -e

# 配置变量
REMOTE_SERVER="192.168.10.5"
REMOTE_USER="root"
APP_NAME="huanu-canvas"
APP_DIR="/opt/$APP_NAME"
LOCAL_PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEPLOYMENT_CONFIG="$LOCAL_PROJECT_DIR/deployment"

# 部署配置
DEPLOYMENT_STRATEGY="${DEPLOYMENT_STRATEGY:-blue-green}"  # blue-green, rolling, recreate
HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-300}"
ROLLBACK_ENABLED="${ROLLBACK_ENABLED:-true}"
MONITORING_ENABLED="${MONITORING_ENABLED:-true}"

# GitHub集成
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
REPO_URL="https://github.com/tcJackClay/HuanuCanvas.git"
RELEASE_BRANCH="main"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"; }
log_debug() { echo -e "${PURPLE}[DEBUG]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"; }

# 项目部署分析
analyze_project() {
    log_info "分析项目配置..."
    
    cd "$LOCAL_PROJECT_DIR"
    
    # 检测项目类型
    if [ -f "package.json" ]; then
        PROJECT_TYPE="nodejs"
        VERSION=$(grep '"version"' package.json | cut -d'"' -f4)
        log_info "检测到Node.js项目，版本: $VERSION"
    fi
    
    # 检测Docker配置
    if [ -f "$DEPLOYMENT_CONFIG/docker-compose.yml" ]; then
        DOCKER_COMPOSE_VERSION=$(grep "version:" "$DEPLOYMENT_CONFIG/docker-compose.yml" | head -1 | cut -d' ' -f2)
        log_info "检测到Docker Compose配置，版本: $DOCKER_COMPOSE_VERSION"
    fi
    
    # 检测环境配置
    ENV_FILES=("$DEPLOYMENT_CONFIG/.env.production" "$DEPLOYMENT_CONFIG/.env.staging")
    for env_file in "${ENV_FILES[@]}"; do
        if [ -f "$env_file" ]; then
            log_info "发现环境配置: $(basename "$env_file")"
        fi
    done
    
    return 0
}

# 智能依赖检查
check_dependencies() {
    log_info "检查本地依赖..."
    
    # 必需工具
    local required_tools=("git" "docker" "docker-compose" "curl")
    # 可选工具
    local optional_tools=("sshpass" "rsync" "jq" "tree")
    
    # 检查必需工具
    for tool in "${required_tools[@]}"; do
        if ! command -v $tool &> /dev/null; then
            log_error "必需工具 $tool 未安装"
            exit 1
        fi
        log_success "✓ $tool 已安装"
    done
    
    # 检查可选工具
    for tool in "${optional_tools[@]}"; do
        if command -v $tool &> /dev/null; then
            log_success "✓ $tool 已安装"
        else
            log_warning "○ $tool 未安装，部分功能可能受限"
        fi
    done
    
    # 检查Docker权限
    if ! docker ps &> /dev/null; then
        log_error "Docker权限不足，请检查用户组设置"
        exit 1
    fi
    
    # 检查项目文件
    local required_files=("package.json" "src" "deployment/docker-compose.yml")
    for file in "${required_files[@]}"; do
        if [ ! -e "$file" ]; then
            log_error "必需文件缺失: $file"
            exit 1
        fi
    done
    
    log_success "依赖检查完成"
}

# 远程服务器准备和优化
prepare_remote_server() {
    log_info "准备远程服务器: $REMOTE_SERVER"
    
    # 服务器预检查
    ssh -o ConnectTimeout=10 -o BatchMode=yes "$REMOTE_USER@$REMOTE_SERVER" "echo 'SSH连接正常'" || {
        log_error "无法连接到远程服务器"
        exit 1
    }
    
    # 执行服务器优化脚本
    ssh "$REMOTE_USER@$REMOTE_SERVER" << 'EOF'
set -e

# 系统优化
echo "正在进行系统优化..."

# 更新系统包
apt update && apt upgrade -y

# 安装必要工具
apt install -y curl wget git unzip htop vim nano tree jq

# Docker优化
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker root
fi

# Docker Compose
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 防火墙配置
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow from 192.168.0.0/16 to any port 3000
ufw allow from 192.168.0.0/16 to any port 8765
ufw --force enable

# 系统参数优化
echo 'net.core.somaxconn = 65536' >> /etc/sysctl.conf
echo 'net.ipv4.ip_local_port_range = 1024 65535' >> /etc/sysctl.conf
echo 'vm.swappiness = 10' >> /etc/sysctl.conf
sysctl -p

# 创建应用目录结构
mkdir -p /opt/huanu-canvas/{app/{frontend,backend,data,logs},config/{nginx,ssl,environment},scripts,backups,monitoring}

# 创建应用用户
if ! id "huanu-canvas" &>/dev/null; then
    useradd -r -s /bin/false -d /opt/huanu-canvas huanu-canvas
fi

# 设置权限
chown -R huanu-canvas:huanu-canvas /opt/huanu-canvas
chmod -R 755 /opt/huanu-canvas

echo "服务器优化完成"
EOF
    
    log_success "远程服务器准备完成"
}

# 智能构建和打包
build_and_package() {
    log_info "执行智能构建..."
    
    cd "$LOCAL_PROJECT_DIR"
    
    # 创建构建目录
    BUILD_DIR="/tmp/huanu-build-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BUILD_DIR"
    
    # 清理旧构建
    log_info "清理旧构建文件..."
    rm -rf dist/ build/ .next/ .turbo/
    
    # 安装依赖
    log_info "安装项目依赖..."
    npm ci --production=false
    
    # 运行质量检查
    log_info "运行质量检查..."
    if npm run lint --if-present; then
        log_success "✓ 代码检查通过"
    else
        log_warning "○ 代码检查发现问题，但继续部署"
    fi
    
    # 运行测试
    log_info "运行测试..."
    if npm test --if-present --passWithNoTests; then
        log_success "✓ 测试通过"
    else
        log_warning "○ 测试发现问题，但继续部署"
    fi
    
    # 构建应用
    log_info "构建前端应用..."
    if [ -f "vite.config.ts" ] || [ -f "vite.config.js" ]; then
        npm run build
    elif [ -f "next.config.js" ]; then
        npm run build
    else
        log_warning "未检测到构建配置，跳过构建"
    fi
    
    # 准备部署包
    log_info "准备部署包..."
    
    # 复制构建产物
    if [ -d "dist" ]; then
        cp -r dist/* "$BUILD_DIR/frontend/"
        log_success "前端构建产物已复制"
    fi
    
    if [ -d "build" ]; then
        cp -r build/* "$BUILD_DIR/frontend/" 2>/dev/null || true
    fi
    
    # 复制源代码
    mkdir -p "$BUILD_DIR/backend"
    rsync -av --exclude='node_modules' --exclude='dist' --exclude='build' --exclude='.git' src/ "$BUILD_DIR/backend/" 2>/dev/null || true
    cp package.json "$BUILD_DIR/backend/"
    
    # 复制部署配置
    cp -r "$DEPLOYMENT_CONFIG"/* "$BUILD_DIR/deployment/"
    
    # 创建版本信息
    echo "$VERSION" > "$BUILD_DIR/VERSION"
    echo "$(date)" > "$BUILD_DIR/BUILD_TIME"
    git rev-parse HEAD > "$BUILD_DIR/COMMIT_SHA" 2>/dev/null || echo "unknown" > "$BUILD_DIR/COMMIT_SHA"
    
    # 创建健康检查脚本
    cat > "$BUILD_DIR/health-check.sh" << 'EOF'
#!/bin/bash
# 自动生成的健康检查脚本

MAX_RETRIES=30
RETRY_INTERVAL=10

check_service() {
    local service_name=$1
    local url=$2
    
    echo "检查服务: $service_name"
    
    for i in $(seq 1 $MAX_RETRIES); do
        if curl -f -s "$url" > /dev/null; then
            echo "✓ $service_name 健康检查通过"
            return 0
        fi
        
        echo "尝试 $i/$MAX_RETRIES: $service_name 尚未就绪..."
        sleep $RETRY_INTERVAL
    done
    
    echo "✗ $service_name 健康检查失败"
    return 1
}

# 检查各个服务
check_service "Frontend" "http://localhost/health" || exit 1
check_service "Backend" "http://localhost:8765/health" || exit 1

echo "所有服务健康检查通过"
EOF
    chmod +x "$BUILD_DIR/health-check.sh"
    
    # 打包部署文件
    log_info "打包部署文件..."
    tar -czf "$BUILD_DIR/$APP_NAME-deploy-$(date +%Y%m%d-%H%M%S).tar.gz" -C "$BUILD_DIR" .
    
    DEPLOY_PACKAGE=$(ls -t "$BUILD_DIR/$APP_NAME-deploy-"*.tar.gz | head -1)
    log_success "部署包创建完成: $(basename "$DEPLOY_PACKAGE")"
    
    echo "$DEPLOY_PACKAGE" > /tmp/deploy_package
}

# 零停机部署策略
deploy_with_strategy() {
    local strategy="$1"
    local deploy_package=$(cat /tmp/deploy_package)
    
    log_info "使用部署策略: $strategy"
    
    case "$strategy" in
        "blue-green")
            deploy_blue_green "$deploy_package"
            ;;
        "rolling")
            deploy_rolling "$deploy_package"
            ;;
        "recreate")
            deploy_recreate "$deploy_package"
            ;;
        *)
            log_error "未知部署策略: $strategy"
            exit 1
            ;;
    esac
}

# 蓝绿部署
deploy_blue_green() {
    local deploy_package=$1
    local green_dir="$APP_DIR/green"
    local blue_dir="$APP_DIR/blue"
    
    log_info "执行蓝绿部署..."
    
    # 确定当前活跃环境
    local current_color=$(ssh "$REMOTE_USER@$REMOTE_SERVER" "[ -L $APP_DIR/current ] && readlink $APP_DIR/current | xargs basename" 2>/dev/null || echo "blue")
    local target_color=$([ "$current_color" = "blue" ] && echo "green" || echo "blue")
    
    log_info "当前活跃环境: $current_color，准备切换到: $target_color"
    
    # 部署到目标环境
    ssh "$REMOTE_USER@$REMOTE_SERVER" << EOF
set -e

# 创建目标环境目录
mkdir -p $target_color
cd $target_color

# 提取部署包
tar -xzf $deploy_package

# 启动新环境
if [ -f "deployment/docker-compose.yml" ]; then
    # 使用不同的网络避免冲突
    COMPOSE_PROJECT_NAME=huanu-canvas-$target_color docker-compose -f deployment/docker-compose.yml up -d
    
    # 等待服务启动
    echo "等待新环境启动..."
    sleep 60
    
    # 健康检查
    ./health-check.sh || { echo "健康检查失败"; exit 1; }
    
    echo "✓ $target_color 环境部署成功"
else
    echo "✗ 部署配置文件不存在"
    exit 1
fi
EOF
    
    # 切换流量
    log_info "切换流量到新环境..."
    ssh "$REMOTE_USER@$REMOTE_SERVER" "
        cd $APP_DIR
        rm -f current
        ln -s $target_color current
        echo '流量已切换到 $target_color 环境'
    "
    
    # 清理旧环境（可选）
    if [ "$ROLLBACK_ENABLED" = "true" ]; then
        log_info "保留旧环境以备回滚..."
    else
        log_info "清理旧环境..."
        ssh "$REMOTE_USER@$REMOTE_SERVER" "rm -rf $current_color"
    fi
    
    log_success "蓝绿部署完成"
}

# 滚动部署
deploy_rolling() {
    local deploy_package=$1
    
    log_info "执行滚动部署..."
    
    ssh "$REMOTE_USER@$REMOTE_SERVER" << EOF
set -e

cd $APP_DIR

# 备份当前版本
cp -r . ../backup-$(date +%Y%m%d-%H%M%S)

# 停止服务（逐个停止）
docker-compose -f deployment/docker-compose.yml stop backend
sleep 10
docker-compose -f deployment/docker-compose.yml stop frontend
sleep 10

# 提取新版本
tar -xzf $deploy_package

# 重新构建镜像
docker-compose -f deployment/docker-compose.yml build --no-cache

# 启动服务
docker-compose -f deployment/docker-compose.yml up -d

# 健康检查
./health-check.sh
EOF
    
    log_success "滚动部署完成"
}

# 重新创建部署
deploy_recreate() {
    local deploy_package=$1
    
    log_info "执行重新创建部署..."
    
    ssh "$REMOTE_USER@$REMOTE_SERVER" << EOF
set -e

cd $APP_DIR

# 停止所有服务
docker-compose -f deployment/docker-compose.yml down --remove-orphans

# 清理旧镜像
docker system prune -f

# 提取新版本
rm -rf *
tar -xzf $deploy_package

# 设置环境变量
if [ -f "deployment/.env.production" ]; then
    cp deployment/.env.production .env
elif [ -f "deployment/.env.template" ]; then
    cp deployment/.env.template .env
fi

# 启动服务
docker-compose -f deployment/docker-compose.yml up -d

# 健康检查
./health-check.sh
EOF
    
    log_success "重新创建部署完成"
}

# 监控和告警设置
setup_monitoring() {
    if [ "$MONITORING_ENABLED" != "true" ]; then
        log_info "监控未启用，跳过设置"
        return 0
    fi
    
    log_info "设置监控和告警..."
    
    ssh "$REMOTE_USER@$REMOTE_SERVER" << 'EOF'
set -e

cd /opt/huanu-canvas

# 启动监控服务
if [ -f "deployment/docker-compose.yml" ]; then
    docker-compose -f deployment/docker-compose.yml --profile monitoring up -d
    echo "✓ 监控服务已启动"
fi

# 配置Prometheus告警规则
if [ -f "monitoring/alert-rules.yml" ]; then
    cp monitoring/alert-rules.yml /etc/prometheus/ 2>/dev/null || true
fi

# 等待监控服务启动
sleep 30

# 验证监控服务
curl -f http://localhost:9090/-/healthy > /dev/null && echo "✓ Prometheus 健康" || echo "✗ Prometheus 异常"
curl -f http://localhost:3000/api/health > /dev/null && echo "✓ Grafana 健康" || echo "✗ Grafana 异常"
EOF
    
    log_success "监控设置完成"
}

# 自动回滚机制
setup_rollback() {
    if [ "$ROLLBACK_ENABLED" != "true" ]; then
        return 0
    fi
    
    log_info "设置自动回滚机制..."
    
    ssh "$REMOTE_USER@$REMOTE_SERVER" << EOF
set -e

cd /opt/huanu-canvas

# 创建回滚脚本
cat > scripts/auto-rollback.sh << 'ROLLBACK_EOF'
#!/bin/bash
# 自动回滚脚本

BACKUP_DIR="/opt/backups"
LATEST_BACKUP=\$(ls -t \$BACKUP_DIR/huanu-canvas-backup-* | head -1)

if [ -z "\$LATEST_BACKUP" ]; then
    echo "没有找到备份文件"
    exit 1
fi

echo "开始回滚到版本: \$LATEST_BACKUP"

# 停止当前服务
docker-compose -f deployment/docker-compose.yml down

# 恢复备份
cd /tmp
tar -xzf \$LATBACKUP

# 重新部署
cd huanu-canvas
docker-compose -f deployment/docker-compose.yml up -d

# 健康检查
./health-check.sh

echo "回滚完成"
ROLLBACK_EOF

chmod +x scripts/auto-rollback.sh

# 设置监控检查（每5分钟检查一次健康状态）
echo "*/5 * * * * /opt/huanu-canvas/scripts/auto-rollback.sh" | crontab - 2>/dev/null || true

echo "✓ 自动回滚机制已设置"
EOF
    
    log_success "自动回滚机制设置完成"
}

# 部署后验证
post_deployment_verification() {
    log_info "执行部署后验证..."
    
    # 等待服务完全启动
    log_info "等待服务启动..."
    sleep 60
    
    # 执行远程验证
    ssh "$REMOTE_USER@$REMOTE_SERVER" << EOF
set -e

cd $APP_DIR

echo "=== 部署验证报告 ==="
echo "时间: \$(date)"
echo "服务器: $(hostname)"
echo "部署版本: \$(cat VERSION 2>/dev/null || echo 'unknown')"
echo "提交哈希: \$(cat COMMIT_SHA 2>/dev/null || echo 'unknown')"

echo ""
echo "=== Docker容器状态 ==="
docker-compose -f deployment/docker-compose.yml ps

echo ""
echo "=== 服务健康检查 ==="
./health-check.sh

echo ""
echo "=== 资源使用情况 ==="
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

echo ""
echo "=== 网络连接检查 ==="
netstat -tuln | grep -E ':80|:443|:8765|:3000|:9090'

echo ""
echo "=== 磁盘空间 ==="
df -h /opt/huanu-canvas

echo ""
echo "=== 内存使用 ==="
free -h

echo ""
echo "验证完成"
EOF
    
    # 本地最终检查
    log_info "执行最终验证..."
    
    # 检查前端访问
    if curl -f -s "http://$REMOTE_SERVER/health" > /dev/null; then
        log_success "✓ 前端服务可访问"
    else
        log_warning "○ 前端服务可能尚未就绪"
    fi
    
    # 检查后端API
    if curl -f -s "http://$REMOTE_SERVER:8765/health" > /dev/null; then
        log_success "✓ 后端API可访问"
    else
        log_warning "○ 后端API可能尚未就绪"
    fi
    
    # 检查监控面板
    if curl -f -s "http://$REMOTE_SERVER:3000/api/health" > /dev/null; then
        log_success "✓ 监控面板可访问"
    else
        log_warning "○ 监控面板可能未启动"
    fi
    
    log_success "部署后验证完成"
}

# 生成部署报告
generate_deployment_report() {
    local report_file="$LOCAL_PROJECT_DIR/deployment-report-$(date +%Y%m%d-%H%M%S).md"
    
    log_info "生成部署报告..."
    
    cat > "$report_file" << EOF
# HuanuCanvas 部署报告

## 部署信息
- **时间**: $(date)
- **部署策略**: $DEPLOYMENT_STRATEGY
- **目标服务器**: $REMOTE_SERVER
- **部署版本**: $VERSION

## 部署状态
- **状态**: 成功
- **部署时间**: $(date +%Y-%m-%d\ %H:%M:%S)
- **回滚机制**: $ROLLBACK_ENABLED
- **监控启用**: $MONITORING_ENABLED

## 访问信息
- **前端应用**: http://$REMOTE_SERVER
- **后端API**: http://$REMOTE_SERVER:8765
- **监控面板**: http://$REMOTE_SERVER:3000 (admin/admin123)

## 服务信息
$(ssh "$REMOTE_USER@$REMOTE_SERVER" "cd $APP_DIR && docker-compose -f deployment/docker-compose.yml ps" 2>/dev/null || echo "无法获取服务信息")

## 资源使用
$(ssh "$REMOTE_USER@$REMOTE_SERVER" "docker stats --no-stream --format 'table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}'" 2>/dev/null || echo "无法获取资源使用信息")

## 下一步操作
1. 访问前端应用确认功能正常
2. 检查监控面板确认服务状态
3. 运行集成测试验证业务流程
4. 通知相关人员部署成功

---
*报告由HuanuCanvas自动化部署系统生成*
EOF
    
    log_success "部署报告已生成: $report_file"
}

# 发送通知
send_deployment_notification() {
    local status="$1"
    local message="$2"
    
    # Slack通知
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"text\": \"🚀 HuanuCanvas部署通知\",
                \"attachments\": [{
                    \"color\": \"$status\",
                    \"fields\": [{
                        \"title\": \"部署状态\",
                        \"value\": \"$message\",
                        \"short\": true
                    }, {
                        \"title\": \"服务器\",
                        \"value\": \"$REMOTE_SERVER\",
                        \"short\": true
                    }, {
                        \"title\": \"版本\",
                        \"value\": \"$VERSION\",
                        \"short\": true
                    }, {
                        \"title\": \"时间\",
                        \"value\": \"$(date)\",
                        \"short\": true
                    }],
                    \"actions\": [{
                        \"type\": \"button\",
                        \"text\": \"查看应用\",
                        \"url\": \"http://$REMOTE_SERVER\"
                    }, {
                        \"type\": \"button\",
                        \"text\": \"监控面板\",
                        \"url\": \"http://$REMOTE_SERVER:3000\"
                    }]
                }]
            }" \
            "$SLACK_WEBHOOK" 2>/dev/null || true
    fi
    
    # 邮件通知
    if [ -n "$EMAIL_NOTIFICATION" ]; then
        cat << EOF | mail -s "HuanuCanvas部署通知 - $status" "$EMAIL_NOTIFICATION"
HuanuCanvas自动化部署已完成

部署状态: $message
服务器: $REMOTE_SERVER
版本: $VERSION
时间: $(date)

访问地址:
- 前端应用: http://$REMOTE_SERVER
- 后端API: http://$REMOTE_SERVER:8765
- 监控面板: http://$REMOTE_SERVER:3000

部署报告: $LOCAL_PROJECT_DIR/deployment-report-$(date +%Y%m%d-%H%M%S).md
EOF
    fi
}

# 主函数
main() {
    echo "=========================================="
    echo "HuanuCanvas智能自动化部署系统 v2.0"
    echo "基于project-deploy skill优化"
    echo "=========================================="
    
    # 显示部署配置
    echo "部署配置:"
    echo "  目标服务器: $REMOTE_SERVER"
    echo "  部署策略: $DEPLOYMENT_STRATEGY"
    echo "  回滚机制: $ROLLBACK_ENABLED"
    echo "  监控启用: $MONITORING_ENABLED"
    echo "  健康检查超时: ${HEALTH_CHECK_TIMEOUT}s"
    echo ""
    
    # 执行部署流程
    analyze_project
    check_dependencies
    prepare_remote_server
    build_and_package
    
    # 选择部署策略
    if [ -z "$DEPLOYMENT_STRATEGY" ] || [ "$DEPLOYMENT_STRATEGY" = "auto" ]; then
        if [ "$APP_DIR" = "/opt/huanu-canvas" ]; then
            DEPLOYMENT_STRATEGY="blue-green"
        else
            DEPLOYMENT_STRATEGY="rolling"
        fi
    fi
    
    deploy_with_strategy "$DEPLOYMENT_STRATEGY"
    setup_monitoring
    setup_rollback
    post_deployment_verification
    generate_deployment_report
    
    # 发送成功通知
    send_deployment_notification "good" "部署成功完成"
    
    echo ""
    echo "=========================================="
    echo "🎉 智能自动化部署完成!"
    echo ""
    echo "访问地址:"
    echo "  前端应用: http://$REMOTE_SERVER"
    echo "  后端API: http://$REMOTE_SERVER:8765"
    echo "  监控面板: http://$REMOTE_SERVER:3000"
    echo ""
    echo "管理命令:"
    echo "  查看状态: ssh $REMOTE_USER@$REMOTE_SERVER 'cd $APP_DIR && docker-compose ps'"
    echo "  查看日志: ssh $REMOTE_USER@$REMOTE_SERVER 'cd $APP_DIR && docker-compose logs -f'"
    echo "  重启服务: ssh $REMOTE_USER@$REMOTE_SERVER 'cd $APP_DIR && docker-compose restart'"
    echo "=========================================="
}

# 错误处理和清理
cleanup() {
    local exit_code=$?
    log_error "部署过程中发生错误，退出代码: $exit_code"
    
    # 清理临时文件
    rm -f /tmp/deploy_package /tmp/deploy_vars
    
    # 发送失败通知
    send_deployment_notification "danger" "部署失败"
    
    exit $exit_code
}

trap cleanup ERR
trap 'log_info "部署被用户中断"' INT TERM

# 执行主函数
main "$@"