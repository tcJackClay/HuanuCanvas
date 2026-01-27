# HuanuCanvas 🎨

<<<<<<< HEAD
[![Build Status](https://github.com/tcJackClay/HuanuCanvas/actions/workflows/enhanced-ci-cd.yml/badge.svg)](https://github.com/tcJackClay/HuanuCanvas/actions)
[![GitHub release](https://img.shields.io/github/release/tcJackClay/HuanuCanvas.svg)](https://GitHub.com/tcJackClay/HuanuCanvas/releases/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> HuanuCanvas 是一个现代化的AI驱动的Canvas设计应用，支持智能图像生成和创意管理。采用先进的GitFlow分支策略和完整的CI/CD流水线。
=======
<<<<<<< HEAD
[![Deploy](https://github.com/yourusername/huanu-canvas/actions/workflows/deploy.yml/badge.svg)](https://github.com/yourusername/huanu-canvas/actions/workflows/deploy.yml)

> HuanuCanvas 是一个现代化的AI驱动的Canvas设计应用，支持智能图像生成和创意管理。
=======
HuanuCanvas 是一个现代化的AI驱动的Canvas设计应用，支持智能图像生成和创意管理。
>>>>>>> 75be0b1286bc4219ece9724b60912456c057eaed
>>>>>>> develop

## ✨ 特性

- 🎨 **智能画布编辑**: 基于XYFlow的节点式画布编辑器
- 🤖 **AI图像生成**: 集成Google Gemini AI，支持创意内容生成
- 🖥️ **桌面模拟**: 完整的桌面应用体验
- 📱 **响应式设计**: 支持多设备访问

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 8.0.0
- Git (了解GitFlow工作流)

### 开发工作流

本项目采用GitFlow分支策略：

1. **克隆仓库**
   ```bash
<<<<<<< HEAD
   git clone https://github.com/tcJackClay/HuanuCanvas.git
   cd HuanuCanvas
=======
<<<<<<< HEAD
   git clone https://github.com/yourusername/huanu-canvas.git
   cd huanu-canvas
=======
   git clone https://github.com/tcJackClay/HuanuCanvas.git
   cd HuanuCanvas
>>>>>>> 75be0b1286bc4219ece9724b60912456c057eaed
>>>>>>> develop
   ```

2. **初始化GitFlow**
   ```bash
   chmod +x scripts/gitflow.sh
   ./scripts/gitflow.sh init-flow
   ```

3. **开始新功能开发**
   ```bash
   # 使用自动化脚本
   ./scripts/gitflow.sh start-feature your-feature-name
   
   # 或手动创建
   git checkout develop
   git checkout -b feature/your-feature-name
   ```

4. **配置环境**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，填入必要的配置
   ```

5. **启动开发服务**
   ```bash
   npm run dev
   
   # 或启动Electron应用
   npm run electron:dev
   ```

## 🌍 部署

### 自动化部署

本项目支持完整的CI/CD自动化部署：

1. **推送到 `develop` 分支** → 自动部署到测试环境
2. **推送到 `main` 分支** → 自动部署到生产环境
3. **创建 `release/*` 分支** → 准备新版本发布
4. **手动触发** → 部署到指定环境

**CI/CD特性**:
- ✅ 智能项目分析
- ✅ 多层次质量检查 (ESLint, TypeScript, Security)
- ✅ 全面测试套件 (单元, 集成, E2E, 性能)
- ✅ 自动化安全扫描
- ✅ 蓝绿部署策略
- ✅ 自动回滚机制
- ✅ 实时监控和报警

### 手动部署

1. **克隆到服务器**
   ```bash
<<<<<<< HEAD
   git clone https://github.com/tcJackClay/HuanuCanvas.git
   cd HuanuCanvas
=======
<<<<<<< HEAD
   git clone https://github.com/yourusername/huanu-canvas.git
   cd huanu-canvas
=======
   git clone https://github.com/tcJackClay/HuanuCanvas.git
   cd HuanuCanvas
>>>>>>> 75be0b1286bc4219ece9724b60912456c057eaed
>>>>>>> develop
   ```

2. **执行部署**
   ```bash
   chmod +x scripts/*.sh
   ./scripts/deploy-from-github.sh deploy test
   ```

### 部署环境

- **测试环境**: 自动化部署到内部测试服务器
- **生产环境**: 自动化部署到生产环境
- **监控面板**: 内置监控和报警系统

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

### GitFlow工作流

我们采用标准的GitFlow分支策略来确保代码质量和团队协作效率。

#### 分支类型
- **main**: 生产环境分支，始终保持稳定
- **develop**: 开发集成分支
- **feature/***: 功能开发分支
- **hotfix/***: 紧急修复分支
- **release/***: 发布准备分支

#### 贡献流程

1. **Fork仓库** 或 **克隆主仓库**
   ```bash
   git clone https://github.com/tcJackClay/HuanuCanvas.git
   ```

2. **初始化GitFlow**
   ```bash
   ./scripts/gitflow.sh init-flow
   ```

3. **开始新功能开发**
   ```bash
   # 使用自动化脚本
   ./scripts/gitflow.sh start-feature new-feature-name
   
   # 或手动操作
   git checkout develop
   git pull origin develop
   git checkout -b feature/new-feature-name
   ```

4. **开发工作**
   ```bash
   # 开发过程中
   git add .
   git commit -m "feat: add new feature description"
   
   # 推送到远程
   git push origin feature/new-feature-name
   ```

5. **创建Pull Request**
   - 在GitHub网页界面创建PR到`develop`分支
   - 填写PR模板，提供清晰描述
   - 等待代码审查

6. **完成功能开发**
   ```bash
   # PR审查通过后，使用脚本或手动操作
   ./scripts/gitflow.sh finish-feature new-feature-name
   ```

#### 提交消息规范

遵循[约定式提交](https://www.conventionalcommits.org/)规范:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型示例**:
- `feat:` 新功能
- `fix:` 修复bug
- `docs:` 文档更新
- `style:` 代码格式化
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建/工具相关

**示例**:
```bash
git commit -m "feat(auth): add JWT authentication system

Implement comprehensive JWT-based authentication with refresh token support, including login, logout, and token refresh endpoints.

Closes #123"
```

### 代码质量要求

- ✅ 通过所有CI/CD检查
- ✅ ESLint代码规范检查
- ✅ TypeScript类型检查
- ✅ 单元测试覆盖率 >= 80%
- ✅ 至少1个代码审查者批准
- ✅ 所有讨论已解决

### PR模板

创建PR时请包含:
- **变更类型**: 功能/修复/文档/重构
- **变更描述**: 详细描述本次PR的变更内容
- **测试**: 描述如何测试这些变更
- **检查清单**: 
  - [ ] 代码遵循项目规范
  - [ ] 自测通过
  - [ ] 文档已更新
  - [ ] 测试已添加/更新

### 快速命令参考

```bash
# 常用GitFlow操作
./scripts/gitflow.sh start-feature feature-name    # 开始新功能
./scripts/gitflow.sh finish-feature feature-name   # 完成功能开发
./scripts/gitflow.sh start-hotfix hotfix-name     # 开始热修复
./scripts/gitflow.sh finish-hotfix hotfix-name    # 完成热修复
./scripts/gitflow.sh status                        # 查看分支状态
./scripts/gitflow.sh cleanup                       # 清理已合并分支
./scripts/gitflow.sh sync                          # 同步最新变更
```

### 开发最佳实践

1. **小而频繁的PR**: 保持PR小而专注
2. **及时同步**: 定期从develop分支同步最新变更
3. **清晰描述**: 提供详细的PR和提交描述
4. **测试优先**: 先写测试，再实现功能
5. **文档更新**: 相关文档及时更新
6. **代码审查**: 认真进行代码审查，提供建设性反馈

## 📄 许可证

本项目采用 MIT 许可证。

---

**HuanuCanvas** - 让创意无限可能 ✨
