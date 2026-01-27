# HuanuCanvas 部署文档

## 📋 概述

本文档提供HuanuCanvas项目的完整部署方案，包括开发、测试和生产环境的部署配置。

### 项目信息
- **项目名称**: PenguinMagic (企鹅工坊)
- **版本**: v1.4.1
- **技术栈**: React 19 + Node.js + Electron
- **部署方案**: Docker + 容器化

## 🏗️ 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                      用户访问层                             │
│  HTTP/HTTPS (80/443) → Nginx 反向代理                      │
├─────────────────────────────────────────────────────────────┤
│                      应用层                                │
│  React 前端 (端口: 5206) │ Node.js API (端口: 8765)     │
├─────────────────────────────────────────────────────────────┤
│                      数据层                                │
│  文件系统 / PostgreSQL / Redis 缓存                        │
├─────────────────────────────────────────────────────────────┤
│                      监控层                                │
│  Prometheus + Grafana + 健康检查                          │
└─────────────────────────────────────────────────────────────┘
```

## 📦 部署文件说明

### 核心配置文件
| 文件名 | 说明 | 用途 |
|--------|------|------|
| `deployment.yaml` | Kubernetes部署配置 | K8s集群部署 |
| `docker-compose.yml` | Docker Compose配置 | 容器编排 |
| `Dockerfile.frontend` | 前端镜像构建 | React应用容器化 |
| `Dockerfile.backend` | 后端镜像构建 | Node.js服务容器化 |
| `nginx.conf` | Nginx配置 | 反向代理和负载均衡 |

### 脚本文件
| 文件名 | 说明 | 功能 |
|--------|------|------|
| `scripts/deploy.sh` | 一键部署脚本 | 自动化部署流程 |
| `scripts/health-check.sh` | 健康检查脚本 | 服务状态监控 |
| `scripts/maintenance.sh` | 维护脚本 | 日常维护任务 |

### 配置模板
| 文件名 | 说明 | 用途 |
|--------|------|------|
| `.env.example` | 环境变量模板 | 配置管理 |
| `monitoring/prometheus.yml` | 监控配置 | 指标收集 |

## 🚀 快速开始

### 1. 环境准备
```bash
# 安装Docker和Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 克隆项目
git clone <repository-url>
cd huanu-canvas
```

### 2. 配置环境
```bash
# 复制环境变量模板
cp deployment/.env.example .env

# 编辑配置文件 (必须设置 GEMINI_API_KEY)
nano .env
```

### 3. 执行部署
```bash
# 方式1: 使用一键部署脚本
chmod +x deployment/scripts/deploy.sh
./deployment/scripts/deploy.sh

# 方式2: 手动部署
docker-compose -f deployment/docker-compose.yml up -d
```

### 4. 验证部署
```bash
# 执行健康检查
./deployment/scripts/health-check.sh

# 访问应用
# 前端: http://localhost
# 监控: http://localhost:3000
```

## 🔧 配置详解

### 环境变量说明

#### 必需配置
```bash
# API密钥 (Google Gemini)
GEMINI_API_KEY=your_actual_api_key

# 应用环境
NODE_ENV=production
APP_VERSION=1.4.1
```

#### 可选配置
```bash
# 服务端口
FRONTEND_PORT=80
BACKEND_PORT=8765

# 数据库
POSTGRES_PASSWORD=secure_password
DATABASE_URL=postgresql://user:pass@host:5432/db

# 监控
GRAFANA_PASSWORD=admin_password
PROMETHEUS_PORT=9090

# 存储路径
DATA_PATH=/app/data
OUTPUT_PATH=/app/output
```

### Docker服务配置

#### 前端服务
- **镜像**: `huanu-canvas:v1.4.1`
- **端口**: 80 (HTTP), 443 (HTTPS)
- **环境变量**: NODE_ENV, GEMINI_API_KEY
- **健康检查**: HTTP /health

#### 后端服务
- **镜像**: `huanu-backend:v1.4.1`
- **端口**: 8765
- **环境变量**: NODE_ENV, GEMINI_API_KEY
- **健康检查**: TCP :8765

#### 辅助服务
- **Redis**: 6379 (缓存)
- **PostgreSQL**: 5432 (数据库)
- **Grafana**: 3000 (监控面板)
- **Prometheus**: 9090 (指标收集)

## 📊 监控和运维

### 健康检查
```bash
# 基础健康检查
./deployment/scripts/health-check.sh

# 详细健康检查
./deployment/scripts/health-check.sh --verbose

# JSON格式输出
./deployment/scripts/health-check.sh --json
```

### 日常维护
```bash
# 完整维护任务
./deployment/scripts/maintenance.sh

# 仅清理资源
./deployment/scripts/maintenance.sh cleanup

# 仅更新依赖
./deployment/scripts/maintenance.sh update

# 仅数据备份
./deployment/scripts/maintenance.sh backup
```

### 监控面板访问
- **Grafana**: http://localhost:3000
  - 用户名: admin
  - 密码: admin (首次登录需要修改)
- **Prometheus**: http://localhost:9090
- **应用状态**: http://localhost/health

## 🔍 故障排除

### 常见问题

#### 1. 服务无法启动
```bash
# 检查Docker状态
docker --version
docker-compose --version

# 查看服务日志
docker-compose -f deployment/docker-compose.yml logs

# 检查端口占用
netstat -tuln | grep -E "(80|443|8765)"
```

#### 2. 前端页面无法访问
```bash
# 检查前端容器状态
docker ps | grep frontend

# 检查前端日志
docker-compose logs frontend

# 手动访问健康检查端点
curl http://localhost/health
```

#### 3. API调用失败
```bash
# 检查后端服务状态
docker ps | grep backend

# 检查环境变量配置
docker-compose exec backend env | grep GEMINI_API_KEY

# 测试API端点
curl http://localhost/api/health
```

#### 4. 内存或磁盘不足
```bash
# 检查系统资源
df -h
free -h

# 清理Docker资源
docker system prune -f

# 清理旧备份
find backup -name "*.tar.gz" -mtime +30 -delete
```

### 应急恢复
```bash
# 重启所有服务
docker-compose -f deployment/docker-compose.yml restart

# 完全重建服务
docker-compose -f deployment/docker-compose.yml down
docker-compose -f deployment/docker-compose.yml up -d

# 从备份恢复
tar -xzf backup/latest-backup.tar.gz -C /
docker-compose -f deployment/docker-compose.yml up -d
```

## 📈 性能优化

### 前端优化
- **代码分割**: Vite动态导入
- **资源压缩**: Gzip/Brotli
- **缓存策略**: 静态资源缓存1年
- **CDN**: 建议使用CDN加速

### 后端优化
- **连接池**: 数据库连接池配置
- **缓存**: Redis缓存热点数据
- **压缩**: 响应数据Gzip压缩
- **限流**: API请求频率限制

### 数据库优化
- **索引**: 常用查询字段索引
- **分区**: 大表按时间分区
- **备份**: 每日增量+每周全量
- **监控**: 慢查询监控

## 🔐 安全配置

### SSL/TLS配置
```bash
# 生成自签名证书 (开发环境)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem -out ssl/cert.pem

# 配置生产证书
# 将证书文件放置到 ssl/ 目录
cp your-cert.pem ssl/cert.pem
cp your-key.pem ssl/key.pem
```

### 安全检查
- **API密钥**: 定期轮换Gemini API密钥
- **文件权限**: .env文件权限设置为600
- **防火墙**: 仅开放必要端口
- **日志**: 定期检查访问和错误日志

### 访问控制
```bash
# Nginx访问限制
location /admin {
    allow 192.168.1.0/24;  # 允许内网
    deny all;               # 拒绝其他访问
}
```

## 📅 维护计划

### 日常任务 (自动化)
- **每日 02:00**: 清理日志、更新依赖、健康检查
- **每日 03:00**: 数据备份
- **每小时**: 基础健康检查

### 定期任务
- **每周**: 完整系统备份、SSL证书检查
- **每月**: 性能评估、安全扫描
- **每季度**: 依赖升级、架构优化

### 维护脚本调度
```bash
# 添加到crontab
crontab -e

# 每日维护
0 2 * * * /path/to/huanu-canvas/deployment/scripts/maintenance.sh all >> /var/log/huanu-cron.log 2>&1

# 每小时健康检查
0 * * * * /path/to/huanu-canvas/deployment/scripts/health-check.sh >> /var/log/huanu-health.log 2>&1
```

## 📞 技术支持

### 联系方式
- **GitHub Issues**: [项目地址]/issues
- **技术文档**: [文档中心链接]
- **紧急联系**: [紧急联系方式]

### 常用链接
- **项目状态**: http://status.yourdomain.com
- **API文档**: http://yourdomain.com/api/docs
- **监控面板**: http://yourdomain.com:3000

### 升级指南
```bash
# 1. 备份当前版本
./deployment/scripts/maintenance.sh backup

# 2. 更新代码
git pull origin main

# 3. 更新依赖
npm update

# 4. 重新构建
docker build -f deployment/Dockerfile.frontend -t huanu-canvas:v1.4.1 .
docker build -f deployment/Dockerfile.backend -t huanu-backend:v1.4.1 .

# 5. 滚动更新
docker-compose -f deployment/docker-compose.yml up -d

# 6. 验证升级
./deployment/scripts/health-check.sh
```

---

**文档版本**: v1.4.1  
**最后更新**: 2026-01-27  
**下次更新**: 2026-02-27  
**维护者**: HuanuCanvas团队
