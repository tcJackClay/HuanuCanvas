#!/bin/bash
# HuanuCanvas 统一部署脚本
# 整合安装、部署、修复功能

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查Node.js版本
check_nodejs() {
    log_info "检查Node.js环境..."
    NODE_VERSION=$(node --version)
    if [[ ! $NODE_VERSION =~ ^v2[1-9]\. ]]; then
        log_error "需要Node.js 21.x版本，当前版本: $NODE_VERSION"
        log_info "请安装Node.js 21: https://nodejs.org/"
        exit 1
    fi
    log_success "Node.js版本检查通过: $NODE_VERSION"
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    # 清理npm缓存
    npm cache clean --force
    
    # 删除现有依赖（如果存在）
    [ -d "node_modules" ] && rm -rf node_modules
    [ -f "package-lock.json" ] && rm -f package-lock.json
    
    # 安装依赖
    npm install
    
    log_success "依赖安装完成"
}

# 构建应用
build_application() {
    log_info "构建应用..."
    
    # 测试构建
    if npm run build; then
        log_success "构建测试通过"
    else
        log_error "构建测试失败"
        exit 1
    fi
    
    # Electron构建
    log_info "构建Electron应用..."
    if npm run electron:build; then
        log_success "Electron构建完成"
    else
        log_warning "Electron构建失败，但继续部署"
    fi
}

# Docker部署
deploy_docker() {
    log_info "执行Docker部署..."
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，跳过Docker部署"
        return 1
    fi
    
    # 清理旧容器
    docker-compose -f deployment/docker-compose.yml down --remove-orphans 2>/dev/null || true
    
    # 构建和启动
    docker-compose -f deployment/docker-compose.yml up -d --build
    
    log_success "Docker部署完成"
}

# 部署修复
fix_deployment() {
    log_info "执行部署修复..."
    
    # 清理环境
    rm -rf node_modules dist release
    npm cache clean --force
    
    # 重新安装
    npm install
    
    log_success "部署修复完成"
}

# 主函数
main() {
    echo "=========================================="
    echo "HuanuCanvas 统一部署脚本"
    echo "=========================================="
    
    # 检查参数
    case "${1:-install}" in
        "install")
            check_nodejs
            install_dependencies
            build_application
            ;;
        "docker")
            check_nodejs
            install_dependencies
            build_application
            deploy_docker
            ;;
        "build")
            check_nodejs
            install_dependencies
            build_application
            ;;
        "fix")
            fix_deployment
            ;;
        "help"|"-h"|"--help")
            echo "使用方法: $0 [命令]"
            echo ""
            echo "命令:"
            echo "  install  安装和构建应用 (默认)"
            echo "  docker   执行Docker部署"
            echo "  build    仅构建应用"
            echo "  fix      修复部署问题"
            echo "  help     显示帮助信息"
            echo ""
            echo "示例:"
            echo "  $0           # 完整安装"
            echo "  $0 docker    # Docker部署"
            echo "  $0 fix       # 修复部署"
            ;;
        *)
            log_error "未知命令: $1"
            echo "使用 '$0 help' 查看帮助"
            exit 1
            ;;
    esac
    
    log_success "部署完成！"
}

# 执行主函数
main "$@"