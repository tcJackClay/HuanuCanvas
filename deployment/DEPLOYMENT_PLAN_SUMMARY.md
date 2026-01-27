# HuanuCanvas项目部署计划总结

## 📋 部署方案概述

**项目类型**: React 19 + Node.js + Electron全栈应用
**部署方案**: Docker + 容器化部署
**版本**: v1.4.1

## 🏗️ 部署架构

```
前端 (React+Vite) ──┐
                    ├── Nginx 负载均衡 ──── 外部用户
后端 (Node.js) ────┘
                    │
AI服务 (Gemini API) ─┘
```

## 📦 部署文件清单

### 核心配置文件
- `deployment.yaml` - Kubernetes部署配置
- `docker-compose.yml` - Docker Compose配置
- `Dockerfile.frontend` - 前端Docker镜像构建
- `Dockerfile.backend` - 后端Docker镜像构建
- `nginx.conf` - Nginx反向代理配置

### 环境配置
- `.env.example` - 环境变量模板
- `prometheus.yml` - 监控配置

### 自动化脚本
- `deploy.sh` - 一键部署脚本
- `health-check.sh` - 健康检查脚本
- `maintenance.sh` - 维护脚本

## 🚀 快速部署步骤

### 1. 环境准备 (30分钟)
```bash
# 安装Docker和Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 配置环境变量
cp deployment/.env.example .env
# 编辑 .env 文件，设置 GEMINI_API_KEY
```

### 2. 应用构建 (60分钟)
```bash
# 构建前端
npm ci && npm run build

# 构建Docker镜像
docker build -f deployment/Dockerfile.frontend -t huanu-canvas:v1.4.1 .
docker build -f deployment/Dockerfile.backend -t huanu-backend:v1.4.1 .
```

### 3. 服务部署 (30分钟)
```bash
# 启动所有服务
docker-compose -f deployment/docker-compose.yml up -d

# 验证部署
curl -f http://localhost/health
```

## 📊 服务端口配置

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 | 80/443 | Web界面 |
| 后端 | 8765 | API服务 |
| Redis | 6379 | 缓存 |
| PostgreSQL | 5432 | 数据库 |
| Grafana | 3000 | 监控面板 |
| Prometheus | 9090 | 指标收集 |

## 🔐 安全配置

### 环境变量管理
- `GEMINI_API_KEY` - AI服务密钥
- `NODE_ENV=production` - 生产环境
- `SSL_CERT_PATH` - SSL证书路径

### 安全策略
- HTTPS强制重定向
- 安全头配置
- API访问限制
- 定期安全更新

## 📈 监控方案

### 核心指标
- 服务可用性 (uptime)
- 响应时间 (latency)
- 内存使用 (memory usage)
- CPU使用率 (cpu usage)
- 错误率 (error rate)

### 告警规则
- 服务停止 > 1分钟
- 内存使用 > 1GB
- 响应时间 > 2秒
- 磁盘使用 > 90%

## 🔧 维护计划

### 日常维护 (自动化)
- 每日: 日志清理、健康检查
- 每周: 依赖更新、完整备份
- 每月: 性能优化、安全扫描

### 备份策略
- 每日增量备份
- 每周完整备份
- 云存储冗余
- 30天保留期

## ⚠️ 风险缓解

### 技术风险
- **依赖冲突**: 使用Docker固定版本
- **内存泄漏**: 监控+自动重启
- **API限制**: 密钥轮换机制

### 运营风险
- **数据丢失**: 多地备份
- **服务中断**: 负载均衡
- **安全漏洞**: 定期扫描

## 📞 应急响应

### 快速恢复
```bash
# 重启服务
./emergency-recovery.sh restart

# 回滚版本
./emergency-recovery.sh rollback

# 从备份恢复
./emergency-recovery.sh backup-restore <backup_file>
```

### 联系方式
- **技术支持**: GitHub Issues
- **紧急联系**: [联系方式]
- **状态页面**: [状态页面地址]

## ✅ 验收标准

### 功能验收
- [ ] 前端页面正常加载
- [ ] API服务响应正常
- [ ] AI功能集成成功
- [ ] Electron应用打包正常

### 性能验收
- [ ] 首屏加载 < 3秒
- [ ] API响应 < 500ms
- [ ] 内存使用 < 1GB
- [ ] 支持100+并发用户

### 安全验收
- [ ] HTTPS配置正确
- [ ] API密钥安全管理
- [ ] 访问控制配置
- [ ] 安全扫描通过

---

**文档版本**: v1.4.1
**创建日期**: 2026-01-27
**下次更新**: 2026-02-27
