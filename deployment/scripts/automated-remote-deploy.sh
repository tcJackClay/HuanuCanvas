#!/bin/bash

# HuanuCanvas自动化部署到目标服务器
# 服务器: 192.168.10.5
# 账户: root
# GitHub项目: https://github.com/tcJackClay/HuanuCanvas

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
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 配置变量
SERVER_IP="192.168.10.5"
SERVER_USER="root"
SERVER_PASSWORD="huanu888"
GITHUB_REPO="https://github.com/tcJackClay/HuanuCanvas"
DEPLOY_DIR="/opt/huanu-canvas"
BACKUP_DIR="/opt/backups"

# 检查本地准备
check_local_prerequisites() {
    log_info "检查本地部署准备..."
    
    # 检查Git
    if ! command -v git &> /dev/null; then
        log_error "Git未安装，请先安装Git"
        exit 1
    fi
    
    # 检查SSH客户端
    if ! command -v ssh &> /dev/null; then
        log_error "SSH客户端未安装"
        exit 1
    fi
    
    log_success "本地环境检查通过"
}

# 准备部署脚本
prepare_deployment_scripts() {
    log_info "准备部署脚本..."
    
    # 创建服务器部署脚本
    cat > /tmp/server_deploy.sh << 'EOF'
#!/bin/bash

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 配置变量
GITHUB_REPO="https://github.com/tcJackClay/HuanuCanvas"
DEPLOY_DIR="/opt/huanu-canvas"
BACKUP_DIR="/opt/backups"

log_info "开始服务器端部署..."

# 检查root权限
if [[ $EUID -ne 0 ]]; then
    log_error "此脚本需要以root身份运行"
    exit 1
fi

# 更新系统
log_info "更新系统包..."
apt-get update -y
apt-get upgrade -y

# 安装必要工具
log_info "安装必要工具..."
apt-get install -y curl wget git unzip docker.io docker-compose

# 启动Docker服务
systemctl start docker
systemctl enable docker

# 创建部署目录
log_info "创建部署目录..."
mkdir -p "$DEPLOY_DIR"
mkdir -p "$BACKUP_DIR"

# 备份现有部署
if [[ -d "$DEPLOY_DIR" && "$(ls -A $DEPLOY_DIR)" ]]; then
    log_info "备份现有部署..."
    BACKUP_FILE="$BACKUP_DIR/huanu-canvas-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    tar -czf "$BACKUP_FILE" -C "$(dirname "$DEPLOY_DIR")" "$(basename "$DEPLOY_DIR")"
    log_success "备份完成: $BACKUP_FILE"
fi

# 停止现有服务
log_info "停止现有服务..."
if [[ -f "$DEPLOY_DIR/docker-compose.yml" ]]; then
    cd "$DEPLOY_DIR"
    docker-compose down || true
fi

# 从GitHub克隆项目
log_info "从GitHub克隆项目..."
if [[ -d "$DEPLOY_DIR/.git" ]]; then
    cd "$DEPLOY_DIR"
    git pull origin main || git pull origin master
    log_success "项目已更新"
else
    git clone "$GITHUB_REPO" "$DEPLOY_DIR"
    log_success "项目已克隆"
fi

# 配置环境变量
log_info "配置环境变量..."
cd "$DEPLOY_DIR"

if [[ ! -f ".env" ]]; then
    if [[ -f "deployment/.env.template" ]]; then
        cp "deployment/.env.template" ".env"
        log_warning "请编辑 .env 文件并设置必要的环境变量"
        log_warning "特别是 GEMINI_API_KEY"
    else
        log_error "环境变量模板文件不存在"
        exit 1
    fi
fi

# 构建并启动服务
log_info "构建并启动服务..."
docker-compose -f deployment/docker-compose.yml --env-file .env up -d --build

# 等待服务启动
log_info "等待服务启动..."
sleep 30

# 健康检查
log_info "执行健康检查..."
if curl -f http://localhost:80 > /dev/null 2>&1; then
    log_success "前端服务运行正常"
else
    log_warning "前端服务可能尚未完全启动"
fi

if curl -f http://localhost:8765/health > /dev/null 2>&1; then
    log_success "后端服务运行正常"
else
    log_warning "后端服务可能尚未完全启动"
fi

# 显示部署信息
log_success "部署完成！"
echo ""
echo "访问信息:"
echo "- 前端应用: http://$(hostname -I | awk '{print $1}'):80"
echo "- 后端API: http://$(hostname -I | awk '{print $1}'):8765"
echo "- 监控面板: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "管理命令:"
echo "- 查看状态: cd $DEPLOY_DIR && docker-compose -f deployment/docker-compose.yml ps"
echo "- 查看日志: cd $DEPLOY_DIR && docker-compose -f deployment/docker-compose.yml logs -f"
echo "- 重启服务: cd $DEPLOY_DIR && docker-compose -f deployment/docker-compose.yml restart"

log_success "服务器部署完成！"
EOF
    
    chmod +x /tmp/server_deploy.sh
    log_success "部署脚本准备完成"
}

# 执行远程部署
execute_remote_deployment() {
    log_info "开始远程部署到 $SERVER_IP..."
    
    # 方法1: 使用SSH密钥
    if [[ -f ~/.ssh/deploy_key.pub ]]; then
        log_info "尝试使用SSH密钥连接..."
        
        # 检查服务器SSH密钥
        ssh-copy-id -i ~/.ssh/deploy_key.pub $SERVER_USER@$SERVER_IP 2>/dev/null || {
            log_warning "SSH密钥认证失败，尝试密码认证..."
            execute_with_password
        }
        
        if ssh -i ~/.ssh/deploy_key $SERVER_USER@$SERVER_IP 'true' 2>/dev/null; then
            log_info "SSH密钥连接成功，执行部署..."
            scp -i ~/.ssh/deploy_key /tmp/server_deploy.sh $SERVER_USER@$SERVER_IP:/tmp/
            ssh -i ~/.ssh/deploy_key $SERVER_USER@$SERVER_IP 'chmod +x /tmp/server_deploy.sh && /tmp/server_deploy.sh'
        fi
    else
        execute_with_password
    fi
}

# 密码认证部署
execute_with_password() {
    log_info "使用密码认证执行部署..."
    
    # 创建临时expect脚本
    cat > /tmp/ssh_deploy.exp << EOF
#!/usr/bin/expect -f
set timeout 60
spawn scp -o StrictHostKeyChecking=no /tmp/server_deploy.sh $SERVER_USER@$SERVER_IP:/tmp/
expect "password:"
send "$SERVER_PASSWORD\r"
expect eof

spawn ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP 'chmod +x /tmp/server_deploy.sh && /tmp/server_deploy.sh'
expect "password:"
send "$SERVER_PASSWORD\r"
expect eof
EOF
    
    chmod +x /tmp/ssh_deploy.exp
    
    # 检查expect是否可用
    if command -v expect &> /dev/null; then
        /tmp/ssh_deploy.exp
    else
        log_error "Expect工具不可用，请手动执行以下命令："
        echo "1. 复制 /tmp/server_deploy.sh 到服务器"
        echo "2. 在服务器上执行: chmod +x /tmp/server_deploy.sh && /tmp/server_deploy.sh"
        exit 1
    fi
}

# 验证部署结果
verify_deployment() {
    log_info "验证部署结果..."
    
    # 等待一段时间让服务完全启动
    sleep 60
    
    # 检查服务状态
    if command -v ssh &> /dev/null; then
        # 使用SSH检查服务
        ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 $SERVER_USER@$SERVER_IP 'curl -f http://localhost:80' 2>/dev/null && {
            log_success "前端服务验证成功"
        } || {
            log_warning "前端服务验证失败"
        }
        
        ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 $SERVER_USER@$SERVER_IP 'curl -f http://localhost:8765/health' 2>/dev/null && {
            log_success "后端服务验证成功"
        } || {
            log_warning "后端服务验证失败"
        }
    fi
    
    log_success "部署验证完成"
}

# 主函数
main() {
    log_info "开始HuanuCanvas自动化部署到 $SERVER_IP..."
    echo "GitHub项目: $GITHUB_REPO"
    echo "部署目录: $DEPLOY_DIR"
    echo ""
    
    check_local_prerequisites
    prepare_deployment_scripts
    execute_remote_deployment
    verify_deployment
    
    log_success "自动化部署完成！"
    echo ""
    echo "访问地址:"
    echo "- 前端应用: http://$SERVER_IP:80"
    echo "- 后端API: http://$SERVER_IP:8765"
    echo "- 监控面板: http://$SERVER_IP:3000"
}

# 执行主函数
main "$@"