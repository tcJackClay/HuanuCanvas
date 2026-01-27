# HuanuCanvas 🎨

<<<<<<< HEAD
[![Deploy](https://github.com/yourusername/huanu-canvas/actions/workflows/deploy.yml/badge.svg)](https://github.com/yourusername/huanu-canvas/actions/workflows/deploy.yml)

> HuanuCanvas 是一个现代化的AI驱动的Canvas设计应用，支持智能图像生成和创意管理。
=======
HuanuCanvas 是一个现代化的AI驱动的Canvas设计应用，支持智能图像生成和创意管理。
>>>>>>> 75be0b1286bc4219ece9724b60912456c057eaed

## ✨ 特性

- 🎨 **智能画布编辑**: 基于XYFlow的节点式画布编辑器
- 🤖 **AI图像生成**: 集成Google Gemini AI，支持创意内容生成
- 🖥️ **桌面模拟**: 完整的桌面应用体验
- 📱 **响应式设计**: 支持多设备访问

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 8.0.0

### 本地开发

1. **克隆仓库**
   ```bash
<<<<<<< HEAD
   git clone https://github.com/yourusername/huanu-canvas.git
   cd huanu-canvas
=======
   git clone https://github.com/tcJackClay/HuanuCanvas.git
   cd HuanuCanvas
>>>>>>> 75be0b1286bc4219ece9724b60912456c057eaed
   ```

2. **配置环境**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，填入必要的配置
   ```

3. **启动开发服务**
   ```bash
   # 启动前端开发服务器
   cd frontend && npm run dev
   
   # 启动后端服务（新终端）
   cd backend && npm run dev
   ```

## 🌍 部署

### 自动部署

本项目支持通过GitHub Actions进行自动化部署：

1. **推送到 `develop` 分支** → 自动部署到测试环境
2. **手动触发部署** → 部署到指定环境

### 手动部署

1. **克隆到服务器**
   ```bash
<<<<<<< HEAD
   git clone https://github.com/yourusername/huanu-canvas.git
   cd huanu-canvas
=======
   git clone https://github.com/tcJackClay/HuanuCanvas.git
   cd HuanuCanvas
>>>>>>> 75be0b1286bc4219ece9724b60912456c057eaed
   ```

2. **执行部署**
   ```bash
   chmod +x scripts/*.sh
   ./scripts/deploy-from-github.sh deploy test
   ```

### 部署环境

- **测试环境**: http://192.168.10.5:5206
- **生产环境**: https://yourdomain.com

## 🛠️ 开发指南

### 代码规范

```bash
# 代码格式化
npm run format

# 代码检查
npm run lint

# 类型检查
npm run typecheck
```

### 构建

```bash
# 构建前端
cd frontend && npm run build

# 构建后端
cd backend && npm run build
```

## 📚 API文档

### 健康检查
- `GET /health` - 服务健康状态
- `GET /api/health` - API健康状态

### 画布API
- `GET /api/canvas` - 获取画布列表
- `POST /api/canvas` - 创建新画布

## 🐛 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 查看端口占用
   netstat -tlnp | grep :5206
   
   # 停止占用进程
   pm2 stop huanu-canvas-frontend
   ```

2. **权限问题**
   ```bash
   # 设置正确权限
   sudo chown -R $USER:$USER /opt/huanu-canvas
   chmod +x scripts/*.sh
   ```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。

---

**HuanuCanvas** - 让创意无限可能 ✨
