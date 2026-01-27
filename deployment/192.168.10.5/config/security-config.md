# HuanuCanvas 网络和安全配置

## 🔒 安全配置策略

### 1. 防火墙规则配置

#### UFW防火墙设置
```bash
#!/bin/bash
# setup-firewall.sh - 防火墙配置脚本

# 重置防火墙规则
ufw --force reset

# 默认策略
ufw default deny incoming
ufw default allow outgoing

# SSH管理访问 (限制IP范围)
ufw allow from 192.168.0.0/16 to any port 22

# HTTP/HTTPS Web访问
ufw allow 80/tcp
ufw allow 443/tcp

# 测试环境特定端口 (限制内网访问)
ufw allow from 192.168.0.0/16 to any port 5206  # 前端测试端口
ufw allow from 192.168.0.0/16 to any port 8765  # 后端API端口
ufw allow from 192.168.0.0/16 to any port 3001  # Grafana监控
ufw allow from 192.168.0.0/16 to any port 9091  # Prometheus

# 禁止不必要的端口
ufw deny 3000  # 禁止外部访问Grafana默认端口
ufw deny 9090  # 禁止外部访问Prometheus默认端口

# 启用防火墙
ufw --force enable

# 查看状态
ufw status verbose
```

#### iptables高级规则
```bash
#!/bin/bash
# advanced-firewall.sh - 高级防火墙配置

# 清理现有规则
iptables -F
iptables -X
iptables -t nat -F
iptables -t nat -X

# 默认策略
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# 允许本地回环
iptables -A INPUT -i lo -j ACCEPT

# 允许已建立的连接
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# SSH访问限制 (每分钟最多10次连接)
iptables -A INPUT -p tcp --dport 22 -m state --state NEW -m recent --set
iptables -A INPUT -p tcp --dport 22 -m state --state NEW -m recent --update --seconds 60 --hitcount 10 -j DROP

# HTTP/HTTPS访问
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# 测试环境端口限制 (仅内网)
iptables -A INPUT -p tcp --dport 5206 -s 192.168.0.0/16 -j ACCEPT
iptables -A INPUT -p tcp --dport 8765 -s 192.168.0.0/16 -j ACCEPT
iptables -A INPUT -p tcp --dport 3001 -s 192.168.0.0/16 -j ACCEPT
iptables -A INPUT -p tcp --dport 9091 -s 192.168.0.0/16 -j ACCEPT

# 防DDoS保护
iptables -A INPUT -p tcp --dport 80 -m limit --limit 25/minute --limit-burst 100 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -m limit --limit 25/minute --limit-burst 100 -j ACCEPT

# 记录被拒绝的连接
iptables -A INPUT -m limit --limit 5/min -j LOG --log-prefix "iptables denied: " --log-level 7

# 保存规则
iptables-save > /etc/iptables/rules.v4
```

### 2. SSH安全加固

#### SSH配置优化
```bash
# /etc/ssh/sshd_config
# 禁用root直接登录
PermitRootLogin no

# 禁用密码登录，强制使用密钥
PasswordAuthentication no
PubkeyAuthentication yes

# 限制用户访问
AllowUsers huanu-canvas admin

# 限制登录尝试
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2

# 端口修改 (可选，提高安全性)
Port 2222

# 禁用空密码
PermitEmptyPasswords no

# 使用强加密算法
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com,aes256-ctr,aes192-ctr,aes128-ctr
MACs hmac-sha2-256-etm@openssh.com,hmac-sha2-512-etm@openssh.com,hmac-sha2-256,hmac-sha2-512

# 重启SSH服务
systemctl restart sshd
```

#### SSH密钥配置
```bash
# 生成SSH密钥对
ssh-keygen -t ed25519 -C "huanu-canvas@192.168.10.5" -f ~/.ssh/huanu_canvas_key

# 复制公钥到服务器
ssh-copy-id -i ~/.ssh/huanu_canvas_key.pub huanu-canvas@192.168.10.5

# 本地SSH配置
# ~/.ssh/config
Host huanu-canvas
    HostName 192.168.10.5
    User huanu-canvas
    Port 22
    IdentityFile ~/.ssh/huanu_canvas_key
    IdentitiesOnly yes
    ServerAliveInterval 300
    ServerAliveCountMax 2
```

### 3. SSL/TLS证书配置

#### Let's Encrypt免费证书
```bash
#!/bin/bash
# setup-ssl.sh - SSL证书配置

# 安装Certbot
apt update
apt install -y certbot

# 申请证书 (使用standalone模式)
certbot certonly --standalone \
    --domain 192.168.10.5 \
    --email admin@example.com \
    --agree-tos \
    --non-interactive

# 设置自动续期
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -

# 创建证书目录软链接
ln -sf /etc/letsencrypt/live/192.168.10.5/fullchain.pem /opt/huanu-canvas/ssl/cert.pem
ln -sf /etc/letsencrypt/live/192.168.10.5/privkey.pem /opt/huanu-canvas/ssl/key.pem

# 设置权限
chmod 600 /opt/huanu-canvas/ssl/*
chown huanu-canvas:huanu-canvas /opt/huanu-canvas/ssl/*
```

#### 自签名证书 (测试环境)
```bash
#!/bin/bash
# create-self-signed-cert.sh - 自签名证书生成

# 创建证书目录
mkdir -p /opt/huanu-canvas/ssl

# 生成私钥
openssl genrsa -out /opt/huanu-canvas/ssl/key.pem 2048

# 生成证书签名请求
openssl req -new -key /opt/huanu-canvas/ssl/key.pem -out /opt/huanu-canvas/ssl/cert.csr -subj "/C=CN/ST=Beijing/L=Beijing/O=Huanu/OU=IT/CN=192.168.10.5"

# 生成自签名证书
openssl x509 -req -days 365 -in /opt/huanu-canvas/ssl/cert.csr -signkey /opt/huanu-canvas/ssl/key.pem -out /opt/huanu-canvas/ssl/cert.pem

# 清理临时文件
rm /opt/huanu-canvas/ssl/cert.csr

# 设置权限
chmod 600 /opt/huanu-canvas/ssl/*
chown huanu-canvas:huanu-canvas /opt/huanu-canvas/ssl/*

echo "自签名证书已生成"
echo "证书文件: /opt/huanu-canvas/ssl/cert.pem"
echo "私钥文件: /opt/huanu-canvas/ssl/key.pem"
```

### 4. Nginx安全配置

#### 安全加固的Nginx配置
```nginx
# /opt/huanu-canvas/config/nginx/nginx.secure.conf

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 日志格式 (安全化)
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log main;

    # 基础安全配置
    server_tokens off;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # CSP安全策略
    add_header Content-Security-Policy "
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval';
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: blob:;
        font-src 'self';
        connect-src 'self' ws: wss:;
        media-src 'self';
        object-src 'none';
        child-src 'none';
        frame-ancestors 'none';
        form-action 'self';
        base-uri 'self';
    " always;

    # 隐藏Nginx版本
    server_tokens off;

    # 性能优化
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # 限制请求大小
    client_max_body_size 10M;
    client_body_timeout 60s;
    client_header_timeout 60s;

    # 限流配置
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    # 上游服务器定义
    upstream frontend_backend {
        server frontend-test:80;
        keepalive 32;
    }

    upstream api_backend {
        server backend-test:8765;
        keepalive 32;
    }

    # HTTP重定向到HTTPS
    server {
        listen 80;
        server_name 192.168.10.5;
        return 301 https://$host$request_uri;
    }

    # 主HTTPS服务器
    server {
        listen 443 ssl http2;
        server_name 192.168.10.5;

        # SSL证书配置
        ssl_certificate /opt/huanu-canvas/ssl/cert.pem;
        ssl_certificate_key /opt/huanu-canvas/ssl/key.pem;

        # SSL安全配置
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        ssl_session_tickets off;

        # OCSP装订
        ssl_stapling on;
        ssl_stapling_verify on;
        resolver 8.8.8.8 8.8.4.4 valid=300s;
        resolver_timeout 5s;

        # HSTS安全头
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

        # 前端静态文件
        location / {
            proxy_pass http://frontend_backend;
            proxy_set_header Host $host;
        
