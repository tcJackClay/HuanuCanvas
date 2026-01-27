# HuanuCanvas 部署快速启动指南

## 🚀 5分钟快速部署

### 前置要求
- Docker 20.10+
- Docker Compose 2.0+
- Git
- 2GB+ 可用内存
- 10GB+ 可用磁盘空间

### 第一步：克隆项目
```bash
git clone <repository-url>
cd HuanuCanvas
```

### 第二步：配置环境变量
```bash
# 复制环境配置模板
cp deployment/.env.development .env

# 编辑配置文件，填入您的API密钥
vim .env
```

**必需配置**:
```bash
# Google Gemini API密钥 (必需)
GEMINI_API_KEY=your_actual_gemini_api_key_here

# 安全密钥 (生产环境必须更改)
JWT_SECRET=your_jwt_secret_min_32_chars
SESSION_SECRET=your_session_secret_min_32_chars
```

### 第三步：启动服务
```bash
# 启动开发环境
docker-compose -f deployment/docker-compose.yml --env-file .env up -d

# 查看服务状态
docker-compose -f deployment/docker-compose.yml ps
```

### 第四步：验证部署
```bash
# 运行健康检查
./deployment/scripts/health-check.sh development
```

### 第五步：访问应用
- **前端**: http://localhost:80
- **后端API**: http://localhost:8765
- **Grafana监控**: http://localhost:3000 (admin/admin)

---

## 🔧 开发环境详细配置

### 本地开发启动
```bash
# 1. 安装依赖
npm install

# 2. 启动后端开发服务器
cd backend-nodejs
npm start

# 3. 启动前端开发服务器
npm run dev

# 4. 启动Electron开发版本
npm run electron:dev
```

### 环境变量说明

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `NODE_ENV` | 环境标识 | development/staging/production |
| `GEMINI_API_KEY` | Google Gemini API密钥 | sk-xxxxx |
| `JWT_SECRET` | JWT签名密钥 | your_32_char_secret |
| `POSTGRES_PASSWORD` | 数据库密码 | secure_password |
| `GRAFANA_PASSWORD` | Grafana管理员密码 | admin_password |

---

## 🌐 多环境部署

### 开发环境 (development)
```bash
# 启动
docker-compose -f deployment/docker-compose.yml --env-file deployment/.env.development up -d

# 端口映射
# 前端: 3000
# 后端: 8765
# Grafana: 3000
# Redis: 6379
# PostgreSQL: 5432
```

### 测试环境 (staging)
```bash
# 配置
cp deployment/.env.staging .env.staging.local
# 编辑 .env.staging.local 填入真实配置

# 启动
docker-compose -f deployment/docker-compose.yml --env-file .env.staging.local up -d

# 部署到远程服务器
./deployment/scripts/deploy.sh staging
```

### 生产环境 (production)
```bash
# 配置SSL证书
mkdir -p ssl
# 将您的SSL证书放入 ssl/ 目录

# 启动
docker-compose -f deployment/docker-compose.yml --env-file deployment/.env.production up -d

# Kubernetes部署
kubectl apply -f deployment/k8s-production.yaml
```

---

## 📊 监控和日志

### 访问监控面板
```bash
# Grafana 监控面板
open http://localhost:3000
# 用户名: admin
# 密码: (在.env文件中配置)

# Prometheus 指标收集
open http://localhost:9090
```

### 查看日志
```bash
# 所有服务日志
docker-compose -f deployment/docker-compose.yml logs -f

# 特定服务日志
docker-compose -f deployment/docker-compose.yml logs -f backend

# 实时日志流
tail -f logs/backend/app.log
```

### 健康检查
```bash
# 快速健康检查
./deployment/scripts/health-check.sh development

# 详细检查
./deployment/scripts/health-check.sh --verbose development
```

---

## 💾 数据备份

### 自动备份
```bash
# 手动备份
./deployment/scripts/backup.sh development

# 查看备份文件
ls -la /opt/huanu-canvas/backups/
```

### 恢复数据
```bash
# 停止服务
docker-compose -f deployment/docker-compose.yml down

# 恢复数据
tar -xzf /opt/huanu-canvas/backups/huanu-canvas-backup-*.tar.gz

# 启动服务
docker-compose -f deployment/docker-compose.yml up -d
```

---

## 🔒 SSL证书配置

### Let's Encrypt (推荐)
```bash
# 安装certbot
sudo apt-get install certbot

# 获取证书
sudo certbot certonly --standalone -d yourdomain.com

# 复制证书
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
```

### 自签名证书 (开发环境)
```bash
# 生成自签名证书
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/dev-key.pem -out ssl/dev-cert.pem \
  -subj "/C=CN/ST=State/L=City/O=Organization/CN=localhost"
```

---

## 🛠️ 常用维护命令

### 服务管理
```bash
# 重启服务
docker-compose -f deployment/docker-compose.yml restart

# 更新镜像
docker-compose -f deployment/docker-compose.yml pull
docker-compose -f deployment/docker-compose.yml up -d

# 清理资源
docker system prune -f
docker volume prune -f
```

### 性能监控
```bash
# 查看资源使用
docker stats

# 查看磁盘使用
df -h

# 查看内存使用
free -m

# 查看系统负载
uptime
```

### 日志管理
```bash
# 清理旧日志
find logs/ -name "*.log" -mtime +7 -delete

# 压缩旧日志
find logs/ -name "*.log" -mtime +1 -exec gzip {} \;
```

---

## 🚨 故障排除

### 常见问题

#### 1. 服务启动失败
```bash
# 检查端口占用
netstat -tulpn | grep :80

# 检查磁盘空间
df -h

# 检查内存使用
free -m

# 查看容器日志
docker-compose logs --tail=50
```

#### 2. API调用失败
```bash
# 检查API密钥配置
grep GEMINI_API_KEY .env

# 检查后端服务状态
curl http://localhost:8765/health

# 检查网络连接
docker network ls
```

#### 3. 数据库连接问题
```bash
# 检查PostgreSQL状态
docker-compose exec postgres pg_isready

# 检查Redis状态
docker-compose exec redis redis-cli ping

# 重置数据库
docker-compose down -v
docker-compose up -d postgres
```

#### 4. 性能问题
```bash
# 检查资源使用
docker stats --no-stream

# 查看慢查询
docker-compose exec postgres psql -U huanu -c "
  SELECT query, mean_time, calls 
  FROM pg_stat_statements 
  ORDER BY mean_time DESC 
  LIMIT 10;
"

# 清理缓存
echo "FLUSHALL" | docker-compose exec - redis redis-cli
```

---

## 📞 获取帮助

### 文档资源
- [部署配置总结](./DEPLOYMENT_CONFIG_SUMMARY.md)
- [API文档](./docs/api.md)
- [开发指南](./docs/development.md)

### 监控面板
- **Grafana**: http://localhost:3000
- **Prometheus**: http://localhost:9090
- **健康检查**: ./deployment/scripts/health-check.sh

### 日志位置
- 应用日志: `logs/` 目录
- 容器日志: `docker-compose logs`
- 系统日志: `/var/log/`

### 紧急联系
- **技术支持**: support@huanu.com
- **紧急热线**: +86-xxx-xxxx-xxxx
- **GitHub Issues**: [项目Issues](https://github.com/user/repo/issues)

---

## ✅ 部署检查清单

部署完成后，请确认以下项目：

- [ ] 所有容器运行正常 (`docker-compose ps`)
- [ ] 前端可访问 (http://localhost:80)
- [ ] 后端API响应正常 (http://localhost:8765/health)
- [ ] 数据库连接正常
- [ ] Redis缓存正常
- [ ] 监控面板可访问 (http://localhost:3000)
- [ ] 健康检查通过 (`./deployment/scripts/health-check.sh`)
- [ ] SSL证书有效 (生产环境)
- [ ] API密钥配置正确
- [ ] 备份任务正常
- [ ] 告警规则配置正确

恭喜！您已成功部署 HuanuCanvas 🎉