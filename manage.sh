#!/bin/bash
# HuanuCanvas 服务管理脚本

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                    HuanuCanvas 服务管理                           ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# 检查当前目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在 HuanuCanvas 项目根目录下运行此脚本"
    exit 1
fi

# 功能菜单
show_menu() {
    echo "🔧 请选择操作:"
    echo "  1. 🚀 启动前后端服务"
    echo "  2. ⏹️  停止所有服务"
    echo "  3. 🔍 检查服务状态"
    echo "  4. 📋 查看后端日志"
    echo "  0. ❌ 退出"
    echo ""
}

# 启动服务
start_services() {
    echo "🚀 启动 HuanuCanvas 全栈服务..."
    echo ""
    
    # 检查依赖
    if [ ! -d "node_modules" ]; then
        echo "📥 安装前端依赖..."
        npm install
    fi
    
    if [ ! -d "src/backend/node_modules" ]; then
        echo "📥 安装后端依赖..."
        cd src/backend && npm install && cd ../..
    fi
    
    # 启动后端
    echo "🔧 启动后端服务 (端口 8765)..."
    (cd src/backend && npm run dev > ../backend.log 2>&1 &)
    BACKEND_PID=$!
    echo "✅ 后端服务已启动 (PID: $BACKEND_PID)"
    
    # 等待后端启动
    sleep 3
    
    # 启动前端
    echo "🌐 启动前端服务 (端口 5206)..."
    echo ""
    echo "========================================"
    echo "           HuanuCanvas 启动中"
    echo "========================================"
    echo "📍 后端地址: http://localhost:8765"
    echo "🌐 前端地址: http://localhost:5206"
    echo "⏹️  按 Ctrl+C 停止所有服务"
    echo "========================================"
    echo ""
    
    # 启动前端
    npm run dev
}

# 停止服务
stop_services() {
    echo "⏹️  停止所有服务..."
    
    # 杀死后端进程
    if pgrep -f "node.*server.js" > /dev/null; then
        pkill -f "node.*server.js"
        echo "✅ 后端服务已停止"
    else
        echo "ℹ️  后端服务未运行"
    fi
    
    # 杀死前端进程
    if pgrep -f "vite" > /dev/null; then
        pkill -f "vite"
        echo "✅ 前端服务已停止"
    else
        echo "ℹ️  前端服务未运行"
    fi
    
    echo ""
}

# 检查服务状态
check_status() {
    echo "🔍 检查服务状态..."
    echo ""
    
    # 检查进程
    if pgrep -f "node.*server.js" > /dev/null; then
        echo "✅ 后端进程: 运行中"
    else
        echo "❌ 后端进程: 未运行"
    fi
    
    if pgrep -f "vite" > /dev/null; then
        echo "✅ 前端进程: 运行中"
    else
        echo "❌ 前端进程: 未运行"
    fi
    
    # 检查端口
    if netstat -an | grep ":5206" > /dev/null; then
        echo "✅ 前端端口 (5206): 监听中"
    else
        echo "❌ 前端端口 (5206): 未监听"
    fi
    
    if netstat -an | grep ":8765" > /dev/null; then
        echo "✅ 后端端口 (8765): 监听中"
    else
        echo "❌ 后端端口 (8765): 未监听"
    fi
    
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════════╗"
    echo "║                            🎯 访问地址                               ║"
    echo "╠══════════════════════════════════════════════════════════════════════╣"
    echo "║  🌐 前端应用:  http://localhost:5206                                 ║"
    echo "║  📍 后端API:   http://localhost:8765                                ║"
    echo "╚══════════════════════════════════════════════════════════════════════╝"
    echo ""
}

# 查看日志
show_logs() {
    echo "📋 后端日志:"
    echo "================"
    if [ -f "backend.log" ]; then
        tail -20 backend.log
    else
        echo "未找到日志文件"
    fi
    echo ""
}

# 主循环
while true; do
    show_menu
    read -p "请输入选项 (0-4): " choice
    
    case $choice in
        1)
            start_services
            ;;
        2)
            stop_services
            ;;
        3)
            check_status
            ;;
        4)
            show_logs
            ;;
        0)
            echo "👋 再见!"
            exit 0
            ;;
        *)
            echo "❌ 无效选项，请重试"
            ;;
    esac
    
    echo ""
    read -p "按回车键继续..."
    echo ""
done