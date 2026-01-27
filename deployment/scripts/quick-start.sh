#!/bin/bash

# HuanuCanvas 自动化部署快速启动脚本
# 基于project-deploy skill的一键部署解决方案

set -e

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
QUICK_START_LOG="$PROJECT_ROOT/quick-start-$(date +%Y%m%d-%H%M%S).log"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$QUICK_START_LOG"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$QUICK_START_LOG"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$QUICK_START_LOG"; }
log_error() { echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$QUICK_START_LOG"; }
log_step() { echo -e "${PURPLE}[STEP]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$QUICK_START_LOG"; }

# 显示横幅
show_banner() {
    echo -e "${CYAN}"
    cat << 'EOF'
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║        HuanuCanvas 自动化部署快速启动脚本 v2.0               ║
║        基于project-deploy skill的智能部署系统                ║
║                                                              ║
║        🚀 一键部署 • 🛡️ 零停机 • 📊 全面监控               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# 检查系统要求
check_system_requirements() {
    log_step "检查系统要求..."
    
    # 检查操作系统
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        log_success "检测到Linux系统"
    else
        log_warning "非Linux系统，某些功能可能受限"
    fi
    
    # 检查必要的工具
    local required_tools=("git" "curl" "docker")
    local optional_tools=("sshpass" "jq" "tree")
    
    for tool in "${required_tools[@]}"; do
        if command -v "$tool" &> /dev/null; then
            log_success "✓ $tool 已安装"
        else
            log_error "✗ $tool 未安装，请先安装"
            return 1
        fi
    done
    
    for tool in "${optional_tools[@]}"; do
        if command -v "$tool" &> /dev/null; then
            log_success "✓ $tool 已安装"
        else
            log_warning "○ $tool 未安装，建议安装以获得完整体验"
        fi
    done
    
    # 检查Docker权限
    if ! docker ps &> /dev/null; then
        log_error "Docker权限不足，请将用户添加到docker组"
        log_info "运行命令: sudo usermod -aG docker \$USER"
        return 1
    fi
    
    # 检查磁盘空间
    available_space=$(df "$PROJECT_ROOT" | awk 'NR==2 {print $4}')
    if [ "$available_space" -lt 1048576 ]; then  # 1GB in KB
        log_warning "可用磁盘空间少于1GB，建议清理空间"
    else
        log_success "磁盘空间充足"
    fi
    
    return 0
}

# 检查项目结构
check_project_structure() {
    log_step "检查项目结构..."
    
    local required_files=(
        "package.json"
        "src"
        "deployment/docker-compose.yml"
        "deployment/scripts"
    )
    
    for file in "${required_files[@]}"; do
        if [ -e "$PROJECT_ROOT/$file" ]; then
            log_success "✓ $file 存在"
        else
            log_error "✗ $file 缺失"
            return 1
        fi
    done
    
    # 检查配置文件
    if [ -f "$PROJECT_ROOT/deployment/optimized-deployment.yaml" ]; then
        log_success "✓ 优化部署配置存在"
    else
        log_warning "○ 优化部署配置不存在，使用默认配置"
    fi
    
    return 0
}

# 初始化Git配置
setup_git_configuration() {
    log_step "初始化Git配置..."
    
    cd "$PROJECT_ROOT"
    
    # 检查是否在Git仓库中
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_info "初始化Git仓库..."
        git init
        git remote add origin "https://github.com/tcJackClay/HuanuCanvas.git" || true
    fi
    
    # 检查Git配置
    if ! git config user.name > /dev/null; then
        log_warning "Git用户名未设置"
        read -p "请输入Git用户名: " git_username
        git config user.name "$git_username"
    fi
    
    if ! git config user.email > /dev/null; then
        log_warning "Git邮箱未设置"
        read -p "请输入Git邮箱: " git_email
        git config user.email "$git_email"
    fi
    
    log_success "Git配置完成"
}

# 配置环境变量
setup_environment_variables() {
    log_step "配置环境变量..."
    
    local env_file="$PROJECT_ROOT/.env"
    local template_file="$PROJECT_ROOT/deployment/.env.template"
    
    if [ ! -f "$env_file" ]; then
        if [ -f "$template_file" ]; then
            cp "$template_file" "$env_file"
            log_success "从模板创建环境变量文件"
        else
            cat > "$env_file" << 'EOF'
# HuanuCanvas 环境变量配置

# 基础配置
NODE_ENV=production
APP_NAME=HuanuCanvas
APP_VERSION=1.4.1

# 服务器配置
SERVER_IP=192.168.10.5
DOMAIN=localhost

# API密钥 (必须设置)
GEMINI_API_KEY=your_gemini_api_key_here

# 数据库配置
POSTGRES_DB=huanu
POSTGRES_USER=huanu
POSTGRES_PASSWORD=secure_password

# 监控配置
GRAFANA_PASSWORD=admin123

# 通知配置
SLACK_WEBHOOK=
EMAIL_NOTIFICATION=
EOF
            log_success "创建默认环境变量文件"
        fi
        
        log_warning "请编辑 $env_file 并设置必要的配置项"
        echo ""
        echo "重要配置项："
        echo "  - GEMINI_API_KEY: Google Gemini API密钥"
        echo "  - POSTGRES_PASSWORD: 数据库密码"
        echo "  - SERVER_IP: 服务器IP地址"
        echo ""
        
        read -p "是否现在编辑环境变量文件? (y/N): " edit_env
        if [[ "$edit_env" =~ ^[Yy]$ ]]; then
            ${EDITOR:-vim} "$env_file"
        fi
    else
        log_success "环境变量文件已存在"
    fi
}

# 安装项目依赖
install_project_dependencies() {
    log_step "安装项目依赖..."
    
    cd "$PROJECT_ROOT"
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        log_error "npm未安装，请先安装Node.js和npm"
        return 1
    fi
    
    # 检查package.json
    if [ ! -f "package.json" ]; then
        log_error "package.json文件不存在"
        return 1
    fi
    
    # 安装依赖
    log_info "安装npm依赖..."
    if npm ci; then
        log_success "依赖安装完成"
    else
        log_warning "依赖安装失败，尝试使用npm install"
        npm install
    fi
    
    # 检查关键依赖
    if npm ls vite &> /dev/null; then
        log_success "✓ Vite构建工具已安装"
    fi
    
    if npm ls express &> /dev/null; then
        log_success "✓ Express后端框架已安装"
    fi
}

# 构建项目
build_project() {
    log_step "构建项目..."
    
    cd "$PROJECT_ROOT"
    
    # 运行质量检查
    if npm run lint --if-present; then
        log_success "✓ 代码质量检查通过"
    else
        log_warning "○ 代码质量检查发现问题，但继续构建"
    fi
    
    # 构建前端
    if [ -f "vite.config.ts" ] || [ -f "vite.config.js" ]; then
        log_info "构建前端应用..."
        if npm run build; then
            log_success "✓ 前端构建成功"
        else
            log_error "✗ 前端构建失败"
            return 1
        fi
    else
        log_warning "○ 未检测到Vite配置，跳过前端构建"
    fi
    
    # 运行测试
    if npm run test --if-present --passWithNoTests; then
        log_success "✓ 测试通过"
    else
        log_warning "○ 测试发现问题，但继续"
    fi
    
    return 0
}

# 配置GitHub访问
setup_github_access() {
    log_step "配置GitHub访问..."
    
    echo ""
    echo "请选择GitHub访问方式："
    echo "1. 使用GitHub Token (推荐)"
    echo "2. 使用SSH密钥"
    echo "3. 跳过配置 (仅本地开发)"
    echo ""
    
    read -p "请选择 (1-3): " access_method
    
    case $access_method in
        1)
            read -p "请输入GitHub Token: " github_token
            if [ -n "$github_token" ]; then
                export GITHUB_TOKEN="$github_token"
                log_success "GitHub Token配置完成"
            else
                log_warning "Token为空，跳过GitHub配置"
            fi
            ;;
        2)
            if [ ! -f ~/.ssh/id_rsa ]; then
                log_info "生成SSH密钥..."
                ssh-keygen -t rsa -b 4096 -C "$(git config user.email)" -f ~/.ssh/id_rsa
            fi
            
            log_info "请将以下SSH公钥添加到GitHub:"
            echo ""
            cat ~/.ssh/id_rsa.pub
            echo ""
            read -p "按回车键继续..."
            ;;
        3)
            log_info "跳过GitHub配置"
            ;;
        *)
            log_warning "无效选择，跳过GitHub配置"
            ;;
    esac
}

# 配置服务器连接
setup_server_connection() {
    log_step "配置服务器连接..."
    
    echo ""
    echo "配置目标服务器连接："
    echo "默认生产服务器: 192.168.10.5 (root)"
    echo ""
    
    read -p "是否使用默认配置? (Y/n): " use_default
    if [[ ! "$use_default" =~ ^[Nn]$ ]]; then
        SERVER_HOST="192.168.10.5"
        SERVER_USER="root"
    else
        read -p "服务器地址: " SERVER_HOST
        read -p "用户名: " SERVER_USER
    fi
    
    # 测试SSH连接
    log_info "测试SSH连接到 $SERVER_USER@$SERVER_HOST..."
    
    if ssh -o ConnectTimeout=5 -o BatchMode=yes "$SERVER_USER@$SERVER_HOST" "echo 'SSH连接成功'" 2>/dev/null; then
        log_success "✓ SSH连接成功"
    else
        log_warning "○ SSH连接失败，某些功能可能受限"
        echo ""
        echo "请确保："
        echo "1. 服务器地址和用户名正确"
        echo "2. SSH密钥已正确配置"
        echo "3. 服务器防火墙允许SSH访问"
        echo ""
    fi
}

# 启动本地服务
start_local_services() {
    log_step "启动本地服务..."
    
    cd "$PROJECT_ROOT"
    
    echo ""
    echo "选择启动模式："
    echo "1. 开发模式 (热重载)"
    echo "2. 生产模式 (构建后启动)"
    echo "3. 仅启动后端API"
    echo "4. 不启动服务 (仅部署准备)"
    echo ""
    
    read -p "请选择 (1-4): " start_mode
    
    case $start_mode in
        1)
            log_info "启动开发模式..."
            if command -v concurrently &> /dev/null; then
                npm run dev &  # 通常package.json中有dev脚本
            else
                npm run start:dev &  # 备用选项
            fi
            log_success "开发服务已启动"
            ;;
        2)
            log_info "启动生产模式..."
            if [ -d "dist" ]; then
                npm run preview &  # 预览构建后的应用
            else
                log_warning "构建文件不存在，请先运行构建"
                npm run build
                npm run preview &
            fi
            log_success "生产服务已启动"
            ;;
        3)
            log_info "仅启动后端API..."
            npm run start:backend &
            log_success "后端服务已启动"
            ;;
        4)
            log_info "跳过服务启动"
            ;;
        *)
            log_warning "无效选择，跳过服务启动"
            ;;
    esac
    
    # 等待服务启动
    if [ "$start_mode" != "4" ]; then
        log_info "等待服务启动..."
        sleep 5
        
        # 检查服务状态
        if curl -s http://localhost:3000 > /dev/null 2>&1 || curl -s http://localhost:80 > /dev/null 2>&1; then
            log_success "✓ 前端服务运行正常"
        fi
        
        if curl -s http://localhost:8765/health > /dev/null 2>&1; then
            log_success "✓ 后端API运行正常"
        fi
    fi
}

# 执行自动化部署
execute_automated_deployment() {
    log_step "执行自动化部署..."
    
    cd "$PROJECT_ROOT"
    
    echo ""
    echo "选择部署选项："
    echo "1. GitHub自动化上传"
    echo "2. 服务器智能部署"
    echo "3. 完整自动化流程 (上传+部署)"
    echo "4. 跳过部署"
    echo ""
    
    read -p "请选择 (1-4): " deploy_option
    
    case $deploy_option in
        1)
            if [ -f "deployment/scripts/github-automation.sh" ]; then
                log_info "执行GitHub自动化上传..."
                chmod +x deployment/scripts/github-automation.sh
                ./deployment/scripts/github-automation.sh
                log_success "GitHub自动化上传完成"
            else
                log_error "GitHub自动化脚本不存在"
            fi
            ;;
        2)
            if [ -f "deployment/scripts/intelligent-deploy.sh" ]; then
                log_info "执行服务器智能部署..."
                chmod +x deployment/scripts/intelligent-deploy.sh
                export DEPLOYMENT_STRATEGY="blue-green"
                ./deployment/scripts/intelligent-deploy.sh
                log_success "服务器智能部署完成"
            else
                log_error "智能部署脚本不存在"
            fi
            ;;
        3)
            log_info "执行完整自动化流程..."
            
            # GitHub自动化
            if [ -f "deployment/scripts/github-automation.sh" ]; then
                chmod +x deployment/scripts/github-automation.sh
                ./deployment/scripts/github-automation.sh
            fi
            
            # 服务器部署
            if [ -f "deployment/scripts/intelligent-deploy.sh" ]; then
                chmod +x deployment/scripts/intelligent-deploy.sh
                export DEPLOYMENT_STRATEGY="blue-green"
                ./deployment/scripts/intelligent-deploy.sh
            fi
            
            log_success "完整自动化流程完成"
            ;;
        4)
            log_info "跳过部署"
            ;;
        *)
            log_warning "无效选择，跳过部署"
            ;;
    esac
}

# 启动监控
start_monitoring() {
    log_step "启动监控服务..."
    
    cd "$PROJECT_ROOT"
    
    # 检查监控配置
    if [ -f "deployment/monitoring/prometheus.yml" ]; then
        log_success "监控配置存在"
    else
        log_warning "监控配置不存在，创建默认配置"
        mkdir -p deployment/monitoring
        cat > deployment/monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'huanu-canvas'
    static_configs:
      - targets: ['localhost:8765']
    metrics_path: '/metrics'
    scrape_interval: 15s
EOF
    fi
    
    echo ""
    echo "启动监控选项："
    echo "1. 启动完整监控栈 (Prometheus + Grafana)"
    echo "2. 启动基本监控"
    echo "3. 运行综合监控检查"
    echo "4. 跳过监控"
    echo ""
    
    read -p "请选择 (1-4): " monitor_option
    
    case $monitor_option in
        1)
            if command -v docker-compose &> /dev/null; then
                log_info "启动完整监控栈..."
                docker-compose -f deployment/docker-compose.yml --profile monitoring up -d
                log_success "监控栈已启动"
                echo ""
                echo "访问地址："
                echo "  Grafana: http://localhost:3000 (admin/admin123)"
                echo "  Prometheus: http://localhost:9090"
            else
                log_error "Docker Compose未安装，无法启动监控栈"
            fi
            ;;
        2)
            log_info "启动基本监控..."
            if [ -f "deployment/scripts/comprehensive-monitoring.sh" ]; then
                chmod +x deployment/scripts/comprehensive-monitoring.sh
                ./deployment/scripts/comprehensive-monitoring.sh &
                log_success "基本监控已启动"
            else
                log_error "监控脚本不存在"
            fi
            ;;
        3)
            if [ -f "deployment/scripts/comprehensive-monitoring.sh" ]; then
                log_info "运行综合监控检查..."
                chmod +x deployment/scripts/comprehensive-monitoring.sh
                ./deployment/scripts/comprehensive-monitoring.sh
                log_success "监控检查完成"
            else
                log_error "监控脚本不存在"
            fi
            ;;
        4)
            log_info "跳过监控"
            ;;
        *)
            log_warning "无效选择，跳过监控"
            ;;
    esac
}

# 生成部署报告
generate_deployment_report() {
    log_step "生成部署报告..."
    
    local report_file="$PROJECT_ROOT/quick-start-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# HuanuCanvas 快速启动报告

生成时间: $(date)
项目路径: $PROJECT_ROOT

## 📋 环境信息

### 系统信息
- 操作系统: $(uname -s) $(uname -r)
- Docker版本: $(docker --version 2>/dev/null || echo "未安装")
- Node.js版本: $(node --version 2>/dev/null || echo "未安装")
- npm版本: $(npm --version 2>/dev/null || echo "未安装")

### 项目信息
- 项目版本: $(grep '"version"' package.json 2>/dev/null | cut -d'"' -f4 || echo "未知")
- 项目类型: Node.js $([ -f "package.json" ] && echo "✓" || echo "✗")
- 构建工具: $([ -f "vite.config.ts" ] && echo "Vite" || echo "未检测到")
- 部署配置: $([ -f "deployment/docker-compose.yml" ] && echo "✓" || echo "✗")

## 🚀 服务状态

### 本地服务
$(curl -s http://localhost:3000 > /dev/null 2>&1 && echo "- 前端应用: ✅ 运行中" || echo "- 前端应用: ❌ 未运行")
$(curl -s http://localhost:80 > /dev/null 2>&1 && echo "- 前端服务: ✅ 运行中" || echo "- 前端服务: ❌ 未运行")
$(curl -s http://localhost:8765/health > /dev/null 2>&1 && echo "- 后端API: ✅ 运行中" || echo "- 后端API: ❌ 未运行")

### 远程服务
$(ssh -o ConnectTimeout=5 -o BatchMode=yes root@192.168.10.5 "curl -s http://localhost/health" > /dev/null 2>&1 && echo "- 生产环境: ✅ 可访问" || echo "- 生产环境: ❌ 不可访问")

## 📊 监控状态

### Docker容器
$(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null | head -5 || echo "Docker未运行或无容器")

### 监控面板
$(curl -s http://localhost:3000 > /dev/null 2>&1 && echo "- Grafana: ✅ 运行中" || echo "- Grafana: ❌ 未运行")
$(curl -s http://localhost:9090 > /dev/null 2>&1 && echo "- Prometheus: ✅ 运行中" || echo "- Prometheus: ❌ 未运行")

## 🔗 访问地址

### 本地服务
- 前端应用: http://localhost:3000
- 前端服务: http://localhost:80
- 后端API: http://localhost:8765

### 监控面板
- Grafana: http://localhost:3000
- Prometheus: http://localhost:9090

### 远程服务
- 生产环境: http://192.168.10.5
- 生产监控: http://192.168.10.5:3000

## 📁 重要文件

### 配置文件
- 环境变量: .env
- Docker配置: deployment/docker-compose.yml
- 部署配置: deployment/optimized-deployment.yaml

### 脚本文件
- GitHub自动化: deployment/scripts/github-automation.sh
- 智能部署: deployment/scripts/intelligent-deploy.sh
- 综合监控: deployment/scripts/comprehensive-monitoring.sh

### 日志文件
- 启动日志: $QUICK_START_LOG
- 项目日志: $PROJECT_ROOT/logs/

## 🎯 下一步操作

### 开发工作流
1. \`npm run dev\` - 启动开发服务器
2. \`npm run build\` - 构建生产版本
3. \`npm test\` - 运行测试套件

### 部署工作流
1. \`./deployment/scripts/github-automation.sh\` - 自动上传到GitHub
2. \`./deployment/scripts/intelligent-deploy.sh\` - 部署到服务器
3. \`./deployment/scripts/comprehensive-monitoring.sh\` - 运行监控检查

### 维护工作流
1. 查看日志: \`docker-compose logs -f\`
2. 重启服务: \`docker-compose restart\`
3. 更新代码: \`git pull && ./deployment/scripts/intelligent-deploy.sh\`

## 📞 支持信息

- 项目文档: README.md
- 部署文档: deployment/COMPLETE_DEPLOYMENT_IMPLEMENTATION.md
- 问题反馈: GitHub Issues

---
*报告由HuanuCanvas快速启动脚本生成*
EOF
    
    log_success "部署报告已生成: $report_file"
    
    # 显示报告摘要
    echo ""
    echo "=========================================="
    echo "🎉 快速启动完成!"
    echo ""
    echo "📄 详细报告: $report_file"
    echo "📋 启动日志: $QUICK_START_LOG"
    echo ""
    
    # 显示关键信息
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "🌐 前端应用: http://localhost:3000"
    elif curl -s http://localhost:80 > /dev/null 2>&1; then
        echo "🌐 前端应用: http://localhost:80"
    fi
    
    if curl -s http://localhost:8765/health > /dev/null 2>&1; then
        echo "🔧 后端API: http://localhost:8765"
    fi
    
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "📊 监控面板: http://localhost:3000"
    fi
    
    echo ""
    echo "=========================================="
}

# 清理和退出
cleanup_and_exit() {
    log_step "清理临时文件..."
    
    # 清理npm缓存 (可选)
    # npm cache clean --force
    
    # 清理Docker缓存 (可选)
    # docker system prune -f
    
    log_success "清理完成"
}

# 主函数
main() {
    # 设置退出陷阱
    trap cleanup_and_exit EXIT
    
    # 显示横幅
    show_banner
    
    echo "欢迎使用HuanuCanvas自动化部署快速启动脚本!"
    echo ""
    echo "此脚本将帮助您："
    echo "✓ 检查系统要求和项目结构"
    echo "✓ 配置Git和环境变量"
    echo "✓ 构建和测试项目"
    echo "✓ 配置GitHub和服务器访问"
    echo "✓ 启动本地服务"
    echo "✓ 执行自动化部署"
    echo "✓ 启动监控服务"
    echo "✓ 生成部署报告"
    echo ""
    
    read -p "是否继续? (Y/n): " continue_setup
    if [[ "$continue_setup" =~ ^[Nn]$ ]]; then
        log_info "用户取消设置"
        exit 0
    fi
    
    echo ""
    log_info "开始快速启动流程..."
    
    # 执行设置步骤
    check_system_requirements || exit 1
    check_project_structure || exit 1
    setup_git_configuration
    setup_environment_variables
    install_project_dependencies
    build_project
    setup_github_access
    setup_server_connection
    start_local_services
    execute_automated_deployment
    start_monitoring
    generate_deployment_report
    
    log_success "快速启动流程全部完成!"
}

# 错误处理
handle_error() {
    local exit_code=$?
    log_error "快速启动过程中发生错误 (退出代码: $exit_code)"
    log_info "请检查日志文件: $QUICK_START_LOG"
    
    echo ""
    echo "故障排除建议："
    echo "1. 检查系统要求是否满足"
    echo "2. 确认网络连接正常"
    echo "3. 验证配置文件是否正确"
    echo "4. 查看详细错误信息"
    echo ""
    
    exit $exit_code
}

trap handle_error ERR
trap 'log_info "快速启动被用户中断"; exit 130' INT TERM

# 检查是否直接执行
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi