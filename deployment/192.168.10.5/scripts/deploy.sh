#!/bin/bash
# HuanuCanvas自动化部署脚本
# 目标服务器: 192.168.10.5
# 部署环境: 测试环境

set -e

# 配置变量
REMOTE_SERVER="192.168.10.5"
REMOTE_USER="root"
REMOTE_PASSWORD="huanu888"
APP_NAME="huanu-canvas"
APP_DIR="/opt/$APP_NAME"
LOCAL_PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# 检查本地环境
check_local_environment() {
    log_info "检查本地环境..."
    
    # 检查必要的工具
    local tools=("sshpass" "scp" "rsync")
    for tool in "${tools[@]}"; do
        if ! command -v $tool &> /dev/null; then
            log_error "$tool 未安装，请先安装: sudo apt install $tool"
            exit 1
        fi
    done
    
    # 检查项目文件
    if [ ! -f "$LOCAL_PROJECT_DIR/package.json" ]; then
        log_error "项目文件不存在: $LOCAL_PROJECT_DIR"
        exit 1
    fi
    
    log_info "本地环境检查通过"
}

# 远程服务器准备
prepare_remote_server() {
    log_info "准备远程服务器: $REMOTE_SERVER"
    
    # 执行服务器初始化脚本
    sshpass -p "$REMOTE_PASSWORD" ssh -o StrictHostKeyChecking=no $REMOTE_USER@$REMOTE_SERVER "
        # 创建应用目录
        mkdir -p $APP_DIR/{app,config,scripts,logs,backup,ssl,monitoring}
        mkdir -p $APP_DIR/config/{nginx,ssl,environment}
        mkdir -p $APP_DIR/app/{frontend,backend,data}
        
        # 安装Docker和Docker Compose
        if ! command -v docker &> /dev/null; then
            curl -fsSL https://get.docker.com -o get-docker.sh
            sh get-docker.sh
            usermod -aG docker root
        fi
        
        # 安装Docker Compose
        if ! command -v docker-compose &> /dev/null; then
            curl -L 'https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)' -o /usr/local/bin/docker-compose
            chmod +x /usr/local/bin/docker-compose
        fi
        
        # 创建应用用户
        if ! id '$APP_NAME' &>/dev/null; then
            useradd -r -s /bin/false -d $APP_DIR $APP_NAME
        fi
        
        # 配置防火墙
        ufw default deny incoming
        ufw default allow outgoing
        ufw allow ssh
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw allow from 192.168.0.0/16 to any port 3001
        ufw allow from 192.168.0.0/16 to any port 9091
        ufw --force enable
        
        # 设置权限
        chown -R $APP_NAME:$APP_NAME $APP_DIR
        chmod -R 755 $APP_DIR
    "
    
    log_info "远程服务器准备完成"
}

# 上传项目文件
upload_project_files() {
    log_info "上传项目文件到远程服务器..."
    
    # 创建临时目录用于构建
    local build_dir="/tmp/huanu-build-$$"
    mkdir -p "$build_dir"
    
    # 构建前端
    log_info "构建前端应用..."
    cd "$LOCAL_PROJECT_DIR"
    npm ci
    npm run build
    
    # 复制构建文件
    cp -r dist/* "$build_dir/frontend/"
    
    # 准备后端文件
    mkdir -p "$build_dir/backend"
    cp -r src/* "$build_dir/backend/" 2>/dev/null || true
    cp package.json "$build_dir/backend/"
    
    # 复制部署配置文件
    mkdir -p "$build_dir/deployment"
    cp -r "$(dirname "${BASH_SOURCE[0]}")"/* "$build_dir/deployment/"
    cp "$(dirname "${BASH_SOURCE[0]}")/../docker-compose.test.yml" "$build_dir/deployment/"
    cp "$(dirname "${BASH_SOURCE[0]}")/../.env.example" "$build_dir/deployment/"
    
    # 打包并上传
    tar -czf "$build_dir/huanu-canvas-deploy.tar.gz" -C "$build_dir" .
    
    # 上传到远程服务器
    sshpass -p "$REMOTE_PASSWORD" scp -o StrictHostKeyChecking=no "$build_dir/huanu-canvas-deploy.tar.gz" $REMOTE_USER@$REMOTE_SERVER:$APP_DIR/
    
    # 清理本地临时文件
    rm -rf "$build_dir"
    
    log_info "项目文件上传完成"
}

# 配置远程环境
configure_remote_environment() {
    log_info "配置远程环境..."
    
    sshpass -p "$REMOTE_PASSWORD" ssh -o StrictHostKeyChecking=no $REMOTE_USER@$REMOTE_SERVER "
        cd $APP_DIR
        
        # 解压项目文件
        tar -xzf huanu-canvas-deploy.tar.gz
        
        # 设置环境变量
        cat > config/environment/.env << 'ENVEOF'
NODE_ENV=production
APP_NAME=PenguinMagic
APP_VERSION=1.4.1
SERVER_IP=192.168.10.5

# API密钥 (需要手动设置)
GEMINI_API_KEY=your_gemini_api_key_here

# 服务端口 (测试环境)
FRONTEND_PORT=5206
BACKEND_PORT=8765

# 数据库配置
SQLITE_PATH=/opt/$APP_NAME/app/data/huanu_canvas_test.db

# 监控配置
GRAFANA_PASSWORD=admin123
GRAFANA_PORT=3001
PROMETHEUS_PORT=9091

# 存储路径
DATA_PATH=/opt/$APP_NAME/app/data
INPUT_PATH=/opt/$APP_NAME/app/input
OUTPUT_PATH=/opt/$APP_NAME/app/output
CREATIVE_IMAGES_PATH=/opt/$APP_NAME/app/creative_images
THUMBNAILS_PATH=/opt/$APP_NAME/app/thumbnails

# 安全配置
ALLOWED_ORIGINS=http://192.168.10.5:5206,https://192.168.10.5
SESSION_SECRET=your_session_secret_$(date +%s)
JWT_SECRET=your_jwt_secret_$(date +%s)
ENVEOF
        
        # 创建必要的目录
        mkdir -p app/{input,output,creative_images,thumbnails}
        
        # 初始化数据库
        scripts/database-manager.sh init
        
        # 设置权限
        chown -R $APP_NAME:$APP_NAME $APP_DIR
        chmod +x scripts/*.sh
    "
    
    log_info "远程环境配置完成"
}

# 部署应用服务
deploy_application() {
    log_info "部署应用服务..."
    
    sshpass -p "$REMOTE_PASSWORD" ssh -o StrictHostKeyChecking=no $REMOTE_USER@$REMOTE_SERVER "
        cd $APP_DIR
        
        # 启动Docker服务
        docker-compose -f deployment/docker-compose.test.yml up -d
        
        # 等待服务启动
        echo '等待服务启动...'
        sleep 30
        
        # 执行健康检查
        scripts/health-check.sh
    "
    
    log_info "应用服务部署完成"
}

# 最终验证
final_verification() {
    log_info "执行最终验证..."
    
    sshpass -p "$REMOTE_PASSWORD" ssh -o StrictHostKeyChecking=no $REMOTE_USER@$REMOTE_SERVER "
        cd $APP_DIR
        
        # 检查服务状态
        docker-compose -f deployment/docker-compose.test.yml ps
        
        # 测试网络连接
        echo '测试服务连接...'
        curl -s http://localhost:5206 > /dev/null && echo '✅ 前端服务正常' || echo '❌ 前端服务异常'
        curl -s http://localhost:8765/health > /dev/null && echo '✅ 后端服务正常' || echo '❌ 后端服务异常'
        curl -s http://localhost:9091/-/healthy > /dev/null && echo '✅ 监控服务正常' || echo '❌ 监控服务异常'
        
        # 生成部署报告
        scripts/generate-deployment-report.sh
    "
    
    log_info "最终验证完成"
}

# 主部署流程
main() {
    echo "==================================="
    echo "HuanuCanvas 自动化部署脚本"
    echo "目标服务器: $REMOTE_SERVER"
    echo "部署环境: 测试环境"
    echo "==================================="
    
    check_local_environment
    prepare_remote_server
    upload_project_files
    configure_remote_environment
    deploy_application
    final_verification
    
    echo ""
    echo "==================================="
    echo "🎉 部署完成!"
    echo "前端访问: http://$REMOTE_SERVER:5206"
    echo "API访问: http://$REMOTE_SERVER:8765"
    echo "监控面板: http://$REMOTE_SERVER:3001 (admin/admin123)"
    echo "==================================="
}

# 执行主函数
main "$@"
