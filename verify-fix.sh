#!/bin/bash
# HuanuCanvas 模块系统修复验证脚本

echo "=========================================="
echo "HuanuCanvas 模块系统修复验证"
echo "=========================================="
echo ""

# 检查主项目配置
echo "📦 检查主项目配置..."
if grep -q '"type": "module"' package.json; then
    echo "✅ 主项目使用ES模块配置"
else
    echo "❌ 主项目ES模块配置缺失"
fi

# 检查后端独立配置
echo "📁 检查后端独立配置..."
if [ -f "src/backend/package.json" ]; then
    echo "✅ 后端package.json存在"
    if grep -q '"type": "commonjs"' src/backend/package.json; then
        echo "✅ 后端使用CommonJS配置"
    else
        echo "❌ 后端CommonJS配置缺失"
    fi
else
    echo "❌ 后端package.json不存在"
fi

# 检查后端启动脚本
echo "🔧 检查启动脚本..."
if grep -q '"backend:dev"' package.json; then
    echo "✅ 后端启动脚本配置正确"
else
    echo "❌ 后端启动脚本缺失"
fi

# 检查Electron构建配置
echo "🖥️ 检查Electron构建配置..."
if grep -q '"src/backend/src/**' package.json; then
    echo "✅ Electron构建路径配置正确"
else
    echo "❌ Electron构建路径配置缺失"
fi

# 检查文档完整性
echo "📚 检查文档完整性..."
if [ -f "docs/MODULE_SYSTEM_SOLUTION.md" ]; then
    echo "✅ 模块系统解决方案文档存在"
else
    echo "❌ 模块系统解决方案文档缺失"
fi

echo ""
echo "=========================================="
echo "🔍 启动测试命令:"
echo ""
echo "启动前端 (支持内网访问):"
echo "  npm run dev -- --port 8080 --host 0.0.0.0"
echo ""
echo "启动后端 (新终端):"
echo "  npm run backend:dev"
echo ""
echo "或者分别启动:"
echo "  cd src/backend && npm run dev"
echo ""
echo "=========================================="