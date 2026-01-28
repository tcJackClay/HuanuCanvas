#!/bin/bash
# HuanuCanvas 健康检查脚本
# 整合环境检查和健康检查功能

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

# 检查Node.js环境
check_nodejs() {
    log_info "检查Node.js环境..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js未安装"
        return 1
    fi
    
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    
    log_success "Node.js版本: $NODE_VERSION"
    log_success "npm版本: $NPM_VERSION"
    
    # 检查版本兼容性
    if [[ ! $NODE_VERSION =~ ^v2[1-9]\. ]]; then
        log_warning "Node.js版本可能不兼容，建议使用21.x版本"
        return 1
    fi
    
    return 0
}

# 检查项目配置
check_project_config() {
    log_info "检查项目配置..."
    
    local required_files=("package.json" "src" "electron")
    local config_ok=true
    
    for file in "${required_files[@]}"; do
        if [ ! -e "$file" ]; then
            log_error "必需文件缺失: $file"
            config_ok=false
        else
            log_success "✓ $file 存在"
        fi
    done
    
    # 检查package.json关键配置
    if grep -q '"react":.*"^19\.' package.json; then
        log_success "✓ React版本配置正确"
    else
        log_warning "✗ React版本配置可能不正确"
    fi
    
    if grep -q '"electron":.*"^31\.' package.json; then
        log_success "✓ Electron版本配置正确"
    else
        log_warning "✗ Electron版本配置可能不正确"
    fi
    
    $config_ok
}

# 检查依赖安装
check_dependencies() {
    log_info "检查依赖安装..."
    
    if [ ! -d "node_modules" ]; then
        log_warning "node_modules目录不存在"
        return 1
    fi
    
    # 检查关键依赖
    local key_deps=("react" "electron" "vite")
    for dep in "${key_deps[@]}"; do
        if npm list "$dep" &> /dev/null; then
            log_success "✓ $dep 已安装"
        else
            log_error "✗ $dep 未安装"
            return 1
        fi
    done
    
    return 0
}

# 测试构建过程
test_build() {
    log_info "测试构建过程..."
    
    # 清理旧的构建
    rm -rf dist
    
    if timeout 120 npm run build > /dev/null 2>&1; then
        log_success "✓ 构建测试通过"
        return 0
    else
        log_error "✗ 构建测试失败"
        return 1
    fi
}

# 检查构建产物
check_build_output() {
    log_info "检查构建产物..."
    
    if [ -d "dist" ] && [ -f "dist/index.html" ]; then
        log_success "✓ 构建产物正常"
        return 0
    else
        log_error "✗ 构建产物异常"
        return 1
    fi
}

# Docker健康检查
check_docker() {
    log_info "检查Docker环境..."
    
    if ! command -v docker &> /dev/null; then
        log_warning "Docker未安装"
        return 1
    fi
    
    if ! docker ps &> /dev/null; then
        log_error "Docker权限不足"
        return 1
    fi
    
    log_success "✓ Docker环境正常"
    
    # 检查Docker Compose
    if command -v docker-compose &> /dev/null; then
        log_success "✓ Docker Compose可用"
        
        if [ -f "deployment/docker-compose.yml" ]; then
            log_info "检查Docker服务状态..."
            RUNNING=$(docker-compose -f deployment/docker-compose.yml ps --services --filter "status=running" 2>/dev/null | wc -l)
            TOTAL=$(docker-compose -f deployment/docker-compose.yml ps --services 2>/dev/null | wc -l)
            
            if [ "$RUNNING" -gt 0 ]; then
                log_success "✓ Docker服务运行: $RUNNING/$TOTAL"
            else
                log_warning "○ Docker服务未运行"
            fi
        fi
    fi
    
    return 0
}

# 检查端口和服务
check_ports() {
    log_info "检查端口和服务..."
    
    local ports=("5173:开发服务器" "8765:后端API" "80:前端服务" "443:SSL服务")
    local port_ok=true
    
    for port_info in "${ports[@]}"; do
        port=$(echo $port_info | cut -d: -f1)
        desc=$(echo $port_info | cut -d: -f2)
        
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            log_success "✓ 端口 $port ($desc) 正在监听"
        else
            log_warning "○ 端口 $port ($desc) 未监听"
            port_ok=false
        fi
    done
    
    $port_ok
}

# 系统资源检查
check_system_resources() {
    log_info "检查系统资源..."
    
    # 内存检查
    MEMORY_GB=$(free -g | awk '/^Mem:/{print $2}')
    if [ "$MEMORY_GB" -ge 4 ]; then
        log_success "✓ 系统内存: ${MEMORY_GB}GB (充足)"
    elif [ "$MEMORY_GB" -ge 2 ]; then
        log_warning "○ 系统内存: ${MEMORY_GB}GB (建议4GB+)"
    else
        log_error "✗ 系统内存不足: ${MEMORY_GB}GB (需要4GB+)"
    fi
    
    # 磁盘空间检查
    DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -lt 80 ]; then
        log_success "✓ 磁盘空间: ${DISK_USAGE}% (充足)"
    elif [ "$DISK_USAGE" -lt 90 ]; then
        log_warning "○ 磁盘空间: ${DISK_USAGE}% (建议清理)"
    else
        log_error "✗ 磁盘空间不足: ${DISK_USAGE}%"
    fi
}

# 执行完整健康检查
full_health_check() {
    echo "=========================================="
    echo "HuanuCanvas 完整健康检查"
    echo "=========================================="
    echo ""
    
    local overall_status=0
    
    # 执行各项检查
    check_nodejs || ((overall_status++))
    echo ""
    
    check_project_config || ((overall_status++))
    echo ""
    
    check_dependencies || ((overall_status++))
    echo ""
    
    test_build || ((overall_status++))
    echo ""
    
    check_build_output || ((overall_status++))
    echo ""
    
    check_docker || true  # Docker检查失败不计入整体状态
    echo ""
    
    check_ports || ((overall_status++))
    echo ""
    
    check_system_resources || true  # 资源检查警告不计入整体状态
    echo ""
    
    # 显示总体结果
    echo "=========================================="
    if [ $overall_status -eq 0 ]; then
        log_success "🎉 所有检查通过！系统状态良好。"
    else
        log_error "⚠️  发现 $overall_status 个问题，请检查上述信息。"
        log_info "运行 '$0 fix' 查看修复建议。"
    fi
    echo "=========================================="
    
    return $overall_status
}

# 快速状态检查
quick_status() {
    echo "=========================================="
    echo "HuanuCanvas 快速状态检查"
    echo "=========================================="
    
    check_nodejs
    echo ""
    
    if [ -f ".huanu-dev.pid" ]; then
        DEV_PID=$(cat .huanu-dev.pid)
        if kill -0 $DEV_PID 2>/dev/null; then
            log_success "开发模式运行中 (PID: $DEV_PID)"
        else
            log_warning "开发模式已停止"
        fi
    fi
    
    if [ -f ".huanu-electron.pid" ]; then
        ELECTRON_PID=$(cat .huanu-electron.pid)
        if kill -0 $ELECTRON_PID 2>/dev/null; then
            log_success "Electron应用运行中 (PID: $ELECTRON_PID)"
        else
            log_warning "Electron应用已停止"
        fi
    fi
    
    check_ports
    echo ""
    
    check_system_resources
}

# 修复建议
show_fix_suggestions() {
    echo "=========================================="
    echo "修复建议"
    echo "=========================================="
    echo ""
    echo "常见问题修复:"
    echo "1. 依赖安装问题:"
    echo "   npm install"
    echo ""
    echo "2. 构建失败问题:"
    echo "   npm run build"
    echo ""
    echo "3. Docker问题:"
    echo "   docker-compose -f deployment/docker-compose.yml up -d"
    echo ""
    echo "4. 完全重置:"
    echo "   ./deploy.sh fix"
    echo ""
    echo "5. 环境重新安装:"
    echo "   ./deploy.sh install"
    echo ""
}

# 主函数
main() {
    case "${1:-full}" in
        "full"|"check")
            full_health_check
            ;;
        "quick"|"status")
            quick_status
            ;;
        "fix")
            show_fix_suggestions
            ;;
        "help"|"-h"|"--help")
            echo "使用方法: $0 [命令]"
            echo ""
            echo "命令:"
            echo "  full     完整健康检查 (默认)"
            echo "  quick    快速状态检查"
            echo "  fix      显示修复建议"
            echo "  help     显示帮助信息"
            echo ""
            echo "示例:"
            echo "  $0           # 完整检查"
            echo "  $0 quick     # 快速状态"
            echo "  $0 fix       # 修复建议"
            ;;
        *)
            log_error "未知命令: $1"
            echo "使用 '$0 help' 查看帮助"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"