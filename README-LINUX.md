# HuanuCanvas Linux环境安装指南

## 🚀 快速安装

### 自动化安装（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/tcJackClay/HuanuCanvas.git
cd HuanuCanvas

# 2. 运行自动化安装脚本
npm run install:linux

# 3. 配置环境变量
cp .env.linux .env
# 编辑 .env 文件，设置 GEMINI_API_KEY

# 4. 启动开发模式
npm run dev:linux
```

### 手动安装

```bash
# 1. 确保Node.js 18.x版本
node --version  # 应该是 v18.x.x

# 2. 安装系统依赖 (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y build-essential python3

# 3. 配置npm
npm config set registry https://registry.npmmirror.com

# 4. 清理环境
npm cache clean --force
rm -rf node_modules package-lock.json

# 5. 安装依赖
npm install

# 6. 构建测试
npm run build
```

## 📋 环境要求

- **Node.js**: 18.0.0 - 19.x.x (推荐 18.20.8)
- **npm**: 8.0.0+
- **操作系统**: Linux (Ubuntu 18.04+, CentOS 7+, Debian 9+)
- **系统工具**: build-essential, python3

## 🔧 配置说明

### 环境配置文件

- `.env.linux` - Linux环境专用配置
- `.npmrc` - npm镜像和兼容性配置

### npm脚本

- `npm run install:linux` - 自动化Linux环境安装
- `npm run build:linux` - Linux环境构建
- `npm run dev:linux` - Linux环境开发模式

## 🛠️ 故障排除

### 常见问题

1. **Electron下载失败**
   ```bash
   # 使用镜像源
   export ELECTRON_MIRROR=https://cdn.npmmirror.com/binaries/electron/
   ```

2. **Node-gyp编译错误**
   ```bash
   # 安装Python3和构建工具
   sudo apt-get install python3 build-essential
   ```

3. **权限问题**
   ```bash
   # 修复npm权限
   sudo chown -R $(whoami) ~/.npm
   ```

### 验证安装

```bash
# 检查Node.js版本
node --version

# 检查关键依赖
npm list electron vite typescript

# 测试构建
npm run build

# 测试开发模式
npm run dev:linux
```

## 📞 支持

如遇问题请检查：
1. Node.js版本是否符合要求
2. 系统依赖是否完整安装
3. 网络连接是否正常
4. 磁盘空间是否充足

---
*适用于Node.js 18.20.8环境的优化配置*
