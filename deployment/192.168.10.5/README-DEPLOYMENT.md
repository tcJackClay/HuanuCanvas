# HuanuCanvas 192.168.10.5 服务器部署指南

## 📋 概述

本文档提供HuanuCanvas项目在192.168.10.5服务器上的完整部署指南，包括环境配置、服务部署、监控设置和安全配置。

### 项目信息
- **项目名称**: HuanuCanvas (企鹅工坊AI图像创意管理应用)
- **技术栈**: React 19 + Vite + Node.js + Electron + Gemini AI
- **目标服务器**: 192.168.10.5
- **部署环境**: 测试环境
- **登录凭据**: root / huanu888

## 🚀 快速部署

### 1. 环境准备
```bash
# 在本地机器上执行
# 下载项目文件到本地
git clone <repository>
cd huanu-canvas/deployment/192.168.10.5

# 给脚本执行权限
chmod +x scripts/*.sh
```

### 2. 一键部署
```bash
# 执行自动化部署脚本
./scripts/deploy.sh

# 部署过程会自动：
# - 初始化服务器环境
# - 安装Docker和依赖
# - 上传项目文件
# - 配置服务和数据库
# - 启动应用服务
# - 执行健康检查
```

### 3. 验证部署
```bash
# 登录服务器验证
ssh root@192.168.10.5

# 检查服务状态
/opt/huanu-canvas/scripts/service-manager.sh status

# 执行健康检查
/opt/huanu-canvas/scripts/health-check.sh

# 查看访问地址
curl http://192.168.10.5:5206
```

## 📊 部署架构

### 服务架构图
```
                    用户访问
                         ↓
                    Nginx (80/443)
                         ↓
        ┌─────────────────────────────┐
        |                             |
    前端服务                      后端API
  (React+Vite)                 (Node.js)
      5206                         8765
        ↓                             ↓
    静态资源                    SQLite数据库
                               AI服务集成
                              (Gemini API)
```

### 服务端口分配
| 服务 | 端口 | 用途 | 访问范围 |
|------|------|------|----------|
| 前端 | 5206 | Web应用 | 内网 |
| 后端 | 8765 | API服务 | 内网 |
| Grafana | 3001 | 监控面板 | 内网 |
| Prometheus | 9091 | 监控指标 | 内网 |

## 🔧 详细配置

### 数据库选择: SQLite

**选择理由**:
- ✅ 零配置，适合测试环境
- ✅ 轻量级，资源占用少
- ✅ 易于备份和恢复
- ✅ 无需专门DBA维护

**配置位置**: `/opt/huanu-canvas/app/data/huanu_canvas_test.db`

### 监控级别: 基础监控 + 日志收集

**监控内容**:
- ✅ 进程状态和端口连通性
- ✅ 系统资源使用情况 (CPU/内存/磁盘)
- ✅ HTTP服务响应状态
- ✅ 应用日志分析
- ✅ 数据库完整性检查

**监控工具**:
- Prometheus (端口9091)
- Grafana (端口3001, 默认账号: admin/admin123)

### 备份策略: 按需备份

**备份类型**:
- **快速备份**: 关键数据 (数据库 + 配置文件)
- **完整备份**: 完整应用数据
- **自动备份**: 每日凌晨2点执行
- **手动备份**: 部署前后执行

**备份位置**: `/opt/huanu-canvas/backup/`

## 📁 目录结构

```
/opt/huanu-canvas/
├── app/                    # 应用文件
│   ├── frontend/          # React前端构建
│   ├── backend/           # Node.js后端
│   └── data/              # SQLite数据库
├── config/                # 配置文件
│   ├── nginx/             # Nginx配置
│   ├── ssl/               # SSL证书
│   └── environment/       # 环境变量
├── scripts/               # 管理脚本
│   ├── deploy.sh          # 部署脚本
│   ├── service-manager.sh # 服务管理
│   ├── health-check.sh    # 健康检查
│   ├── backup.sh          # 备份脚本
│   └── database-manager.sh # 数据库管理
├── logs/                  # 日志文件
├── backup/               # 备份文件
├── docker/               # Docker配置
└── monitoring/            # 监控配置
```

## 🛠️ 管理命令

### 服务管理
```bash
# 查看服务状态
/opt/huanu-canvas/scripts/service-manager.sh status

# 启动所有服务
/opt/huanu-canvas/scripts/service-manager.sh start

# 停止所有服务
/opt/huanu-canvas/scripts/service-manager.sh stop

# 重启服务
/opt/huanu-canvas/scripts/service-manager.sh restart

# 查看日志
/opt/huanu-canvas/scripts/service-manager.sh logs [服务名]

# 健康检查
/opt/huanu-canvas/scripts/service-manager.sh health
```

### 备份管理
```bash
# 快速备份
/opt/huanu-canvas/scripts/backup.sh quick

# 完整备份
/opt/huanu-canvas/scripts/backup.sh full

# 查看备份状态
/opt/huanu-canvas/scripts/restore.sh list

# 恢复数据
/opt/huanu-canvas/scripts/restore.sh restore <备份文件>
```

### 数据库管理
```bash
# 初始化数据库
/opt/huanu-canvas/scripts/database-manager.sh init

# 备份数据库
/opt/huanu-canvas/scripts/database-manager.sh backup

# 检查数据库状态
/opt/huanu-canvas/scripts/database-manager.sh check
```

## 🔍 监控和日志

### 监控面板
- **Grafana**: http://192.168.10.5:3001 (admin/admin123)
- **Prometheus**: http://192.168.10.5:9091

### 重要日志文件
```bash
# 应用日志
/opt/huanu-canvas/logs/app.log

# Nginx访问日志
/opt/huanu-canvas/logs/nginx/access.log

# Nginx错误日志
/opt/huanu-canvas/logs/nginx/error.log

# 健康检查日志
/opt/huanu-canvas/logs/health-check.log

# 备份日志
/opt/huanu-canvas/logs/backup.log
```

### 监控检查项
- 服务进程状态
- 端口连通性
- HTTP响应状态
- 系统资源使用
- 数据库完整性
- SSL证书有效期

## 🔒 安全配置

### 网络安全
- **防火墙**: UFW + iptables双重保护
- **SSH**: 禁用root登录，密钥认证
- **SSL**: 自签名证书(测试)或Let's Encrypt(生产)
- **访问控制**: IP白名单限制

### 安全命令
```bash
# 配置防火墙
/opt/huanu-canvas/scripts/setup-firewall.sh

# 生成SSL证书
/opt/huanu-canvas/scripts/create-self-signed-cert.sh

# 系统安全加固
/opt/huanu-canvas/scripts/system-hardening.sh
```

## 📞 故障排除

### 常见问题

#### 1. 服务启动失败
```bash
# 检查Docker状态
docker --version
docker-compose --version

# 检查服务日志
/opt/huanu-canvas/scripts/service-manager.sh logs

# 重启服务
/opt/huanu-canvas/scripts/service-manager.sh restart
```

#### 2. 数据库连接失败
```bash
# 检查数据库文件
ls -la /opt/huanu-canvas/app/data/

# 检查数据库完整性
sqlite3 /opt/huanu-canvas/app/data/huanu_canvas_test.db "PRAGMA integrity_check;"

# 重新初始化数据库
/opt/huanu-canvas/scripts/database-manager.sh init
```

#### 3. 端口无法访问
```bash
# 检查端口占用
netstat -tlnp | grep -E ':5206|:8765'

# 检查防火墙状态
ufw status
iptables -L

# 测试端口连通性
curl http://localhost:5206
curl http://localhost:8765/health
```

#### 4. 监控数据异常
```bash
# 检查Prometheus状态
curl http://localhost:9091/-/healthy

# 检查Grafana状态
curl http://localhost:3001/api/health

# 重启监控服务
docker-compose -f /opt/huanu-canvas/deployment/docker-compose.test.yml restart prometheus grafana
```

### 日志分析方法
```bash
# 实时查看应用日志
tail -f /opt/huanu-canvas/logs/app.log

# 查找错误信息
grep -i error /opt/huanu-canvas/logs/app.log

# 查看Docker容器日志
docker-compose -f /opt/huanu-canvas/deployment/docker-compose.test.yml logs -f backend-test
```

## 📈 性能优化

### 系统优化
- 启用Gzip压缩
- 配置静态文件缓存
- 设置合理的连接池大小
- 优化数据库查询

### 监控指标
- CPU使用率 < 80%
- 内存使用率 < 85%
- 磁盘使用率 < 90%
- API响应时间 < 500ms

## 🔄 更新和升级

### 应用更新
```bash
# 备份当前版本
/opt/huanu-canvas/scripts/backup.sh full

# 更新应用代码
./scripts/deploy.sh

# 重启服务
/opt/huanu-canvas/scripts/service-manager.sh restart

# 验证更新
/opt/huanu-canvas/scripts/health-check.sh
```

### 版本回滚
```bash
# 列出可用备份
/opt/huanu-canvas/scripts/restore.sh list

# 恢复备份
/opt/huanu-canvas/scripts/restore.sh restore <备份文件>

# 重启服务
/opt/huanu-canvas/scripts/service-manager.sh restart
```

## ✅ 验收标准

### 功能验收
- [ ] 前端页面正常加载
- [ ] 后端API服务响应正常
- [ ] AI功能(Gemini)集成成功
- [ ] 文件上传下载功能正常
- [ ] 数据库操作正常

### 性能验收
- [ ] 首屏加载时间 < 3秒
- [ ] API平均响应时间 < 500ms
- [ ] 内存使用 < 1GB
- [ ] CPU使用率 < 50%

### 安全验收
- [ ] HTTPS配置正确
- [ ] 防火墙规则有效
- [ ] 访问控制正常
- [ ] SSL证书有效

### 运维验收
- [ ] 监控面板正常显示
- [ ] 备份策略执行正常
- [ ] 健康检查通过
- [ ] 日志收集正常

## 📚 文档参考

### 重要文档
- [部署配置文档](config/deployment-config.md)
- [测试环境配置](config/test-environment-config.md)
- [数据库配置](config/database-selection.md)
- [监控设计](config/monitoring-level.md)
- [备份策略](config/backup-strategy.md)
- [安全配置](config/security-config.md)

### 脚本参考
- [部署脚本](scripts/deploy.sh)
- [服务管理](scripts/service-manager.sh)
- [健康检查](scripts/health-check.sh)
- [备份管理](scripts/backup.sh)

## 🎯 部署完成检查清单

部署完成后，请检查以下项目：

- [ ] 服务器环境初始化完成
- [ ] Docker和Docker Compose安装成功
- [ ] 项目文件上传和构建完成
- [ ] 数据库初始化成功
- [ ] 服务启动成功
- [ ] 健康检查通过
- [ ] 监控面板可访问
- [ ] 备份策略配置完成
- [ ] 安全配置生效
- [ ] 防火墙规则配置正确
- [ ] SSL证书生成并配置
- [ ] 定时任务配置完成

## 📞 技术支持

### 联系方式
- **部署文档**: 本README文件
- **配置文档**: config/目录下的详细文档
- **脚本帮助**: ./scripts/<script-name> help

### 紧急处理
如遇到紧急问题，请按以下顺序处理：
1. 执行健康检查：`/opt/huanu-canvas/scripts/health-check.sh`
2. 查看服务状态：`/opt/huanu-canvas/scripts/service-manager.sh status`
3. 查看错误日志：`/opt/huanu-canvas/scripts/service-manager.sh logs`
4. 尝试服务重启：`/opt/huanu-canvas/scripts/service-manager.sh restart`
5. 考虑数据恢复：`/opt/huanu-canvas/scripts/restore.sh list`

---

**部署版本**: v1.4.1  
**部署日期**: 2026-01-27  
**文档版本**: v1.0  
**适用环境**: 测试环境

