# 🎨 HuanuCanvas

> AI驱动的Canvas设计应用 - 现代化的动画管理和创意设计工具

[![Node.js](https://img.shields.io/badge/Node.js-21.13.0+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-31.3.0+-green.svg)](https://electronjs.org/)

---

## 🚀 **快速开始**

### 📦 **一键安装**
```bash
# 克隆项目
git clone <repository-url>
cd HuanuCanvas

# 安装依赖
npm install

# 启动开发环境
npm run electron:dev
```

### 🎯 **核心功能**
- ✅ **AI图像生成** - 集成Gemini AI，支持智能创意生成
- ✅ **Canvas设计** - 基于React的直观设计界面
- ✅ **动画管理** - 完整的动画生命周期管理
- ✅ **桌面应用** - Electron跨平台桌面体验
- ✅ **多格式导出** - 支持多种输出格式

### 🛠️ **技术栈**
- **前端框架**: React 19 + TypeScript
- **构建工具**: Vite 5.1+
- **UI组件**: Tailwind CSS + Lucide Icons
- **状态管理**: React Hooks + Context
- **桌面框架**: Electron 31+
- **后端服务**: Node.js + Express
- **AI集成**: Google Gemini API

---

## 📚 **文档中心**

### **快速导航**
| 📖 文档 | 🎯 用途 | ⭐ 优先级 |
|---------|---------|-----------|
| [📋 快速开始](docs/QUICK_START.md) | 新用户上手指南 | ⭐⭐⭐ |
| [🔧 依赖整合说明](docs/DEPENDENCY_INTEGRATION.md) | Monorepo架构说明 | ⭐⭐⭐ |
| [🤝 贡献指南](docs/CONTRIBUTING.md) | 开发流程和规范 | ⭐⭐ |
| [📖 实现指南](docs/IMPLEMENTATION_GUIDE.md) | 技术实现细节 | ⭐⭐ |
| [📡 API文档](docs/API_DOCUMENTATION.md) | 接口文档 | ⭐ |

### **📖 详细文档分类**

#### **🚀 开发入门**
- [📋 快速开始指南](docs/QUICK_START.md) - 5分钟快速上手
- [🔧 依赖整合说明](docs/DEPENDENCY_INTEGRATION.md) - Monorepo架构详解
- [🤝 贡献指南](docs/CONTRIBUTING.md) - 开发环境设置和贡献流程

#### **💡 技术实现**
- [📖 实现指南](docs/IMPLEMENTATION_GUIDE.md) - 核心功能实现
- [📊 项目执行总结](docs/PROJECT_EXECUTION_SUMMARY.md) - 项目开发总结
- [📋 完整实现报告](docs/IMPLEMENTATION_COMPLETE_REPORT.md) - 功能实现报告

#### **🔧 开发流程**
- [🌳 GitFlow工作流](docs/GITFLOW_GUIDE.md) - 分支管理策略
- [📝 代码审查指南](docs/CODE_REVIEW_GUIDE.md) - 代码质量标准
- [🛡️ 分支保护指南](docs/BRANCH_PROTECTION_GUIDE.md) - 安全策略

#### **🔐 安全合规**
- [🔒 安全策略](docs/SECURITY_POLICY.md) - 安全规范和漏洞报告
- [📋 变更日志模板](docs/CHANGELOG_TEMPLATE.md) - 版本管理

---

## 🛠️ **开发命令**

### **基础命令**
```bash
npm install              # 安装所有依赖
npm run dev             # 启动前端开发服务器
npm run build           # 构建前端应用
npm run test            # 运行测试
```

### **开发环境**
```bash
npm run electron:dev    # 启动完整开发环境 (推荐)
npm run backend:dev     # 仅启动后端服务
npm run dev             # 仅启动前端服务
```

### **构建打包**
```bash
npm run electron:build  # 构建Electron应用
npm run backend:build   # 构建后端可执行文件
npm run package         # 打包应用
```

### **脚本管理**
```bash
./deploy.sh install    # 一键部署安装
./manage.sh start dev  # 启动开发服务
./health.sh quick      # 快速健康检查
```

---

## 🏗️ **项目架构**

### **Monorepo结构**
```
HuanuCanvas/
├── 📁 src/
│   ├── 🎨 frontend/      # React前端应用
│   ├── ⚡ backend/       # Node.js后端服务
│   └── 🔗 shared/        # 共享代码和类型
├── 🖥️ electron/          # Electron主进程配置
├── 🚀 deployment/        # Docker和部署配置
├── 📚 docs/             # 项目文档
└── 📜 scripts/          # 管理脚本
```

### **技术特性**
- 🎯 **现代化架构**: 基于Vite的快速构建
- 🔄 **热重载**: 开发时的实时更新
- 📱 **响应式设计**: 适配多种屏幕尺寸
- 🎨 **组件化**: 高度可复用的组件系统
- 🔒 **类型安全**: 完整的TypeScript支持

---

## 🌟 **核心功能**

### **🎨 Canvas设计**
- 拖拽式设计界面
- 实时预览和编辑
- 多图层管理
- 撤销/重做操作

### **🤖 AI集成**
- Gemini AI图像生成
- 智能创意建议
- 自动优化建议
- 多模态内容理解

### **📱 桌面体验**
- 跨平台支持 (Windows/macOS/Linux)
- 原生文件系统访问
- 系统集成功能
- 离线工作能力

### **📤 多格式导出**
- PNG/JPEG图片
- SVG矢量图
- PDF文档
- 动画GIF

---

## 📊 **开发状态**

### **✅ 已完成功能**
- [x] React 19 + TypeScript 架构
- [x] Monorepo依赖管理
- [x] Electron桌面应用
- [x] Gemini AI集成
- [x] Canvas设计界面
- [x] 多格式导出

### **🚧 开发中功能**
- [ ] 动画时间轴
- [ ] 协作编辑
- [ ] 云端同步
- [ ] 插件系统

### **📋 计划功能**
- [ ] VR/AR支持
- [ ] 高级动画效果
- [ ] AI助手升级
- [ ] 企业版功能

---

## 🤝 **贡献指南**

我们欢迎所有形式的贡献！

### **🐛 报告问题**
- 使用 [GitHub Issues](https://github.com/your-repo/issues)
- 提供详细的复现步骤
- 包含系统环境和版本信息

### **💡 提交改进**
- Fork 项目并创建功能分支
- 遵循 [代码审查指南](docs/CODE_REVIEW_GUIDE.md)
- 确保所有测试通过
- 提交Pull Request

### **📝 改进文档**
- 完善 [API文档](docs/API_DOCUMENTATION.md)
- 添加使用示例
- 改进文档清晰度

---

## 📄 **许可证**

MIT License - 详见 [LICENSE](LICENSE) 文件

---
</div>