# HuanuCanvas 192.168.10.5 服务器部署配置

## 🏗️ 服务器基础配置

### 服务器信息
- **IP地址**: 192.168.10.5
- **登录凭据**: root / huanu888
- **操作系统**: Ubuntu 20.04+ / CentOS 8+
- **架构**: x86_64
- **内存要求**: 最小4GB，推荐8GB+
- **存储要求**: 最小50GB SSD

### SSH连接配置

#### 创建SSH配置
```bash
# ~/.ssh/config
Host huanu-canvas
    HostName 192.168.10.5
    User root
    Port 22
    IdentityFile ~/.ssh/huanu_canvas_key
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
```

#### SSH密钥生成（可选，更安全）
```bash
ssh-keygen -t rsa -b 4096 -C "huanu-canvas@192.168.10.5"
ssh-copy-id -i ~/.ssh/huanu_canvas_key.pub root@192.168.10.5
```

### 目录结构规划

```
/opt/huanu-canvas/
├── app/                    # 应用代码
│   ├── frontend/          # React前端构建文件
│   ├── backend/           # Node.js后端
│   └── data/              # 数据存储
├── config/                # 配置文件
│   ├── nginx/
│   ├── ssl/              # SSL证书
│   └── environment/
├── scripts/              # 部署和维护脚本
├── logs/                 # 日志文件
├── backup/              # 备份文件
├── ssl/                 # SSL证书目录
├── docker/              # Docker相关文件
└── monitoring/          # 监控配置
```

### 网络配置要求

#### 端口分配策略
| 服务 | 端口 | 用途 | 访问范围 |
|------|------|------|----------|
| SSH | 22 | 管理访问 | 内网 |
| HTTP | 80 | Web访问 | 公网 |
| HTTPS | 443 | 安全Web访问 | 公网 |
| API | 8765 | 后端API | 内网 |
| Grafana | 3000 | 监控面板 | 内网 |
| Prometheus | 9090 | 监控指标 | 内网 |

#### 防火墙规则
```bash
# UFW防火墙配置
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow from 192.168.0.0/16 to any port 3000  # Grafana内网访问
ufw allow from 192.168.0.0/16 to any port 9090  # Prometheus内网访问
ufw enable
```

### 权限设置

#### 应用用户创建
```bash
# 创建专用应用用户
useradd -r -s /bin/false -d /opt/huanu-canvas huanu
usermod -aG docker huanu
usermod -aG sudo huanu

# 设置目录权限
chown -R huanu:huanu /opt/huanu-canvas
chmod -R 755 /opt/huanu-canvas
chmod -R 600 /opt/huanu-canvas/config/environment/*
```

## 🔧 环境准备脚本

### 服务器初始化脚本 (init-server.sh)
```bash
#!/bin/bash
# HuanuCanvas服务器初始化脚本

set -e

echo "=== HuanuCanvas 服务器初始化 ==="

# 更新系统
apt update && apt upgrade -y

# 安装基础软件
apt install -y curl wget git unzip htop net-tools ufw

# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker root
usermod -aG docker huanu

# 安装Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 创建目录结构
mkdir -p /opt/huanu-canvas/{app,config,scripts,logs,backup,ssl,monitoring}
mkdir -p /opt/huanu-canvas/config/{nginx,ssl,environment}
mkdir -p /opt/huanu-canvas/app/{frontend,backend,data}

# 创建应用用户
useradd -r -s /bin/false -d /opt/huanu-canvas huanu
usermod -aG docker huanu

# 设置权限
chown -R huanu:huanu /opt/huanu-canvas
chmod -R 755 /opt/huanu-canvas

# 配置防火墙
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow from 192.168.0.0/16 to any port 3000
ufw allow from 192.168.0.0/16 to any port 9090
ufw --force enable

# 安装Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 安装PM2
npm install -g pm2

echo "=== 服务器初始化完成 ==="
```

## 📝 配置文件模板

### 环境变量配置 (.env)
```bash
# 复制模板并修改
cp /opt/huanu-canvas/config/environment/.env.example /opt/huanu-canvas/config/environment/.env
```

### 生产环境配置
```bash
# /opt/huanu-canvas/config/environment/.env
NODE_ENV=production
APP_NAME=PenguinMagic
APP_VERSION=1.4.1
SERVER_IP=192.168.10.5

# API密钥 (必需)
GEMINI_API_KEY=your_gemini_api_key_here

# 服务端口
FRONTEND_PORT=80
BACKEND_PORT=8765

# 数据库配置 (基于测试环境选择SQLite)
SQLITE_PATH=/opt/huanu-canvas/app/data/huanu_canvas.db

# 监控配置
GRAFANA_PASSWORD=admin123
GRAFANA_PORT=3000
PROMETHEUS_PORT=9090

# 存储路径
DATA_PATH=/opt/huanu-canvas/app/data
INPUT_PATH=/opt/huanu-canvas/app/input
OUTPUT_PATH=/opt/huanu-canvas/app/output
CREATIVE_IMAGES_PATH=/opt/huanu-canvas/app/creative_images
THUMBNAILS_PATH=/opt/huanu-canvas/app/thumbnails

# SSL配置
SSL_CERT_PATH=/opt/huanu-canvas/ssl/cert.pem
SSL_KEY_PATH=/opt/huanu-canvas/ssl/key.pem

# 性能配置
MAX_MEMORY_USAGE=1GB
MAX_CPU_USAGE=500m
CONCURRENT_REQUESTS=10

# 安全配置
ALLOWED_ORIGINS=http://192.168.10.5,https://192.168.10.5
SESSION_SECRET=your_session_secret_key_$(date +%s)
JWT_SECRET=your_jwt_secret_key_$(date +%s)
```

