# 模块系统兼容性问题解决方案

## 问题描述

### 原始问题
当在项目根目录设置 `"type": "module"` (ES模块) 后，后端代码使用CommonJS语法 (`require()`, `module.exports`) 导致运行时错误：

```javascript
ReferenceError: require is not defined in ES module scope
```

### 错误示例
```bash
# 启动后端时的错误
const express = require('express');
                ^

ReferenceError: require is not defined in ES module scope
```

## 解决方案

### 在后端目录创建独立配置

在 `src/backend/package.json` 中添加独立配置：

```json
{
  "name": "huanu-backend",
  "version": "1.0.0",
  "description": "Node.js后端服务",
  "main": "src/server.js",
  "bin": "src/server.js",
  "type": "commonjs",
  "scripts": {
    "start": "node src/server.js",
    "dev": "node src/server.js",
    "build": "echo 'Backend build completed'"
  }
}
```

### 关键配置项

- **`"type": "commonjs"`**: 告诉Node.js这个目录使用CommonJS语法
- **`"main": "src/server.js"`**: 指定入口文件
- **独立scripts**: 在backend目录中可以独立运行

## 使用方法

### 启动后端服务

```bash
# 方法1: 从项目根目录
npm run backend:dev

# 方法2: 进入backend目录
cd src/backend
npm run dev
```

### 启动完整开发环境

```bash
# 启动前端 (终端1)
npm run dev -- --port 8080 --host 0.0.0.0

# 启动后端 (终端2)
npm run backend:dev
```

## 技术原理

### ES模块 vs CommonJS

**ES模块** (在主项目使用):
- 使用 `import` 和 `export` 语法
- 静态分析，更好的Tree Shaking
- 文件扩展名通常是 `.js`

**CommonJS** (在后端使用):
- 使用 `require()` 和 `module.exports` 语法
- 动态加载
- 文件扩展名通常是 `.js`

### 为什么需要分离配置

1. **语法兼容性**: ES模块无法直接使用CommonJS语法
2. **构建优化**: 前端需要ES模块的Tree Shaking
3. **依赖隔离**: 后端可以独立管理依赖

## 部署指南

### 开发环境
```bash
# 克隆项目
git clone <repository-url>
cd HuanuCanvas

# 安装依赖
npm install

# 启动前端 (支持内网访问)
npm run dev -- --port 8080 --host 0.0.0.0

# 启动后端 (新终端)
npm run backend:dev
```

### 生产环境
```bash
# 构建前端
npm run build

# 启动后端生产服务
npm run backend:start

# 或使用Docker部署
./deploy.sh docker
```

## 故障排除

### 问题1: 仍然提示 "require is not defined"
**解决方案**: 确保在 `src/backend` 目录中有独立的 `package.json` 且设置了 `"type": "commonjs"`

### 问题2: 端口被占用
```bash
# 查看端口占用
netstat -tuln | grep :8765

# 停止占用进程
./manage.sh stop
```

### 问题3: 模块找不到
```bash
# 重新安装后端依赖
cd src/backend
npm install
```

## 最佳实践

1. **保持语法一致性**: 前后端模块系统分离，不要混合使用
2. **独立依赖管理**: 后端依赖在backend目录中管理
3. **清晰的启动流程**: 使用npm scripts提供清晰的服务启动方式
4. **文档说明**: 保持此文档更新，帮助新开发者理解配置

---

*最后更新: 2026-01-28*