#!/bin/bash
# Tailwind CSS 依赖安装脚本

echo "=========================================="
echo "HuanuCanvas Tailwind CSS 依赖安装"
echo "=========================================="
echo ""

# 检查Node.js版本
NODE_VERSION=$(node --version)
echo "当前Node.js版本: $NODE_VERSION"

# 检查npm版本
NPM_VERSION=$(npm --version)
echo "当前npm版本: $NPM_VERSION"
echo ""

# 安装Tailwind CSS相关依赖
echo "📦 安装Tailwind CSS依赖..."

npm install -D tailwindcss@latest postcss@latest autoprefixer@latest

if [ $? -eq 0 ]; then
    echo "✅ Tailwind CSS依赖安装成功！"
else
    echo "❌ Tailwind CSS依赖安装失败"
    echo "💡 尝试手动安装："
    echo "   npm install -D tailwindcss postcss autoprefixer"
    exit 1
fi

# 验证安装
echo ""
echo "🔍 验证安装结果..."

# 检查package.json
if grep -q "tailwindcss" package.json; then
    echo "✅ package.json中已添加Tailwind CSS"
else
    echo "❌ package.json中未找到Tailwind CSS"
fi

# 检查配置文件
if [ -f "tailwind.config.js" ]; then
    echo "✅ tailwind.config.js 配置文件存在"
else
    echo "❌ tailwind.config.js 配置文件不存在"
fi

if [ -f "postcss.config.js" ]; then
    echo "✅ postcss.config.js 配置文件存在"
else
    echo "❌ postcss.config.js 配置文件不存在"
fi

echo ""
echo "🧹 清理构建缓存..."
rm -rf node_modules/.vite dist

echo ""
echo "🚀 重新构建项目..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ 项目构建成功！"
else
    echo "❌ 项目构建失败"
    exit 1
fi

echo ""
echo "=========================================="
echo "🎉 Tailwind CSS 配置完成！"
echo ""
echo "📋 下一步操作："
echo "1. 启动开发服务器："
echo "   npm run dev -- --port 8080 --host 0.0.0.0"
echo ""
echo "2. 验证界面显示："
echo "   - 访问 http://localhost:8080"
echo "   - 检查面板布局是否正常"
echo "   - 验证响应式设计"
echo ""
echo "3. 如有问题，可删除 quick-fix.css："
echo "   rm src/frontend/quick-fix.css"
echo "=========================================="