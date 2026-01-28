# HuanuCanvas 混合架构部署设计

## 🏗️ 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    HuanuCanvas 混合架构                         │
├─────────────────────────────────────────────────────────────┤
│  前端层 (React + Vite)           │  桌面层 (Electron)           │
│  ┌─────────────────────────────┐  │  ┌─────────────────────┐    │
│  │  Web服务 (192.168.10.5:8080) │  │  │  Electron应用      │    │
│  │  - 静态资源服务             │  │  │  - 桌面客户端       │    │
│  │  - 开发热重载               │  │  │  - 本地文件访问     │    │
│  │  - 生产构建优化             │  │  │  - 系统集成         │    │
│  └─────────────────────────────┘  │  └─────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│  API层 (Node.js Express)                                      │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  后端服务 (localhost:8765)                               │ │
│  │  ┌─────────────┬─────────────┬─────────────────────────┐ │ │
│  │  │  图像处理   │  AI集成     │  文件管理              │ │ │
│  │  │  Sharp      │  Gemini     │  Multer               │ │ │
│  │  └─────────────┴─────────────┴─────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  数据层 & 资源层                                               │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │  文件系统               │  │  缓存层                 │   │
│  │  - 输入文件 (/input)    │  │  - Redis (可选)       │   │
│  │  - 输出文件 (/output)   │  │  - 内存缓存            │   │
│  │  - 临时文件 (/tmp)      │  │  - Electron缓存        │   │
│  └─────────────────────────┘  └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 🌐 网络拓扑设计

### 开发环境架构
```
开发者机器
    │
    ├── React开发服务器 (localhost:5173)
    │   ├── Vite HMR (热模块替换)
    │   └── 代理到后端API
    │
    ├── Electron开发客户端
    │   ├── 加载React应用
    │   └── 访问本地API服务
    │
    └── Node.js后端 (localhost:8765)
        ├── RESTful API
        ├── 文件上传处理
        └── AI图像生成
```

### 生产环境架构
```
负载均衡器 (192.168.10.5:8080)
    │
    ├── Nginx反向代理
    │   ├── 静态文件服务 (/assets)
    │   ├── API代理 (/api -> localhost:8765)
    │   └── 压缩优化
    │
    ├── React构建产物
    │   ├── 静态资源
    │   ├── 代码分割
    │   └── 缓存策略
    │
    ├── Electron打包分发
    │   ├── Windows安装包
    │   ├── macOS DMG
    │   └── Linux AppImage
    │
    └── 后端服务集群
        ├── 主服务 (8765)
        ├── 负载均衡
        └── 监控日志
```

## 📦 容器化部署设计

### Docker多阶段构建
```dockerfile
# Dockerfile
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:18-alpine AS backend-builder  
WORKDIR /app
COPY src/backend/package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=frontend-builder /app/dist ./dist
COPY --from=backend-builder /app/node_modules ./backend-node_modules
COPY src/backend/ ./backend/
COPY electron/ ./electron/
COPY package*.json ./
EXPOSE 8080 8765
CMD ["npm", "start"]
```

### Docker Compose编排
```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - API_URL=http://backend:8765
    depends_on:
      - backend
    networks:
      - huanu-network

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "8765:8765"
    environment:
      - NODE_ENV=production
      - PORT=8765
    volumes:
      - ./data:/app/data
      - ./input:/app/input
      - ./output:/app/output
    networks:
      - huanu-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - frontend
      - backend
    networks:
      - huanu-network

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - huanu-network

volumes:
  redis-data:

networks:
  huanu-network:
    driver: bridge
```

## 🔧 服务网格和API网关

### Nginx配置
```nginx
# nginx.conf
upstream frontend {
    server frontend:8080;
}

upstream backend {
    server backend:8765;
}

server {
    listen 80;
    server_name 192.168.10.5;
    
    # 静态文件缓存
    location /assets/ {
        proxy_pass http://frontend;
        expires 1y;
        add_header Cache-Control "public, immutable";
        gzip_static on;
    }
    
    # API代理
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket支持
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # 文件上传
    location /upload/ {
        proxy_pass http://backend;
        client_max_body_size 100M;
        proxy_request_buffering off;
    }
    
    # SPA路由
    location / {
        proxy_pass http://frontend;
        try_files $uri $uri/ /index.html;
    }
}
```

## 🚀 性能优化策略

### 前端优化
1. **代码分割**: 路由级别和组件级别分割
2. **懒加载**: 图像和组件按需加载
3. **CDN加速**: 静态资源CDN分发
4. **缓存策略**: 浏览器缓存和Service Worker
5. **Bundle优化**: Tree shaking和压缩

### 后端优化
1. **连接池**: 数据库连接复用
2. **缓存机制**: Redis缓存热点数据
3. **负载均衡**: 多实例负载分担
4. **压缩传输**: Gzip压缩响应
5. **异步处理**: 图像处理队列

### Electron优化
1. **asar打包**: 减少文件I/O
2. **资源分离**: 动态资源外部加载
3. **进程优化**: 主进程和渲染进程分离
4. **内存管理**: 及时释放资源
5. **更新机制**: 增量更新支持

## 📊 监控和日志设计

### 应用监控
```javascript
// 监控配置
const monitoringConfig = {
  metrics: {
    responseTime: true,
    errorRate: true,
    throughput: true,
    memory: true,
    cpu: true
  },
  alerts: {
    errorThreshold: 5, // 5%错误率
    responseTimeThreshold: 2000, // 2秒
    memoryThreshold: 80 // 80%内存使用率
  },
  logging: {
    level: 'info',
    format: 'json',
    retention: '7d'
  }
};
```

### 健康检查端点
```javascript
// 健康检查
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      disk: await checkDisk(),
      memory: checkMemory()
    }
  };
  res.json(health);
});
```

## 🔐 安全架构

### 安全措施
1. **HTTPS强制**: 全站HTTPS加密
2. **CORS配置**: 跨域访问控制
3. **输入验证**: 参数和文件验证
4. **文件上传安全**: 限制文件类型和大小
5. **API限流**: 防止DDoS攻击
6. **环境隔离**: 开发和生产环境分离

### 权限控制
```javascript
// JWT认证中间件
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

## 🔄 部署流程设计

### 蓝绿部署
1. **环境准备**: 新环境部署和测试
2. **流量切换**: 逐步切换用户流量
3. **监控验证**: 监控系统指标
4. **回滚机制**: 快速回滚能力

### 滚动更新
1. **分批更新**: 10% -> 50% -> 100%
2. **健康检查**: 每批次健康检查
3. **自动回滚**: 异常自动回滚
4. **零停机**: 用户无感知更新

这个架构设计确保了HuanuCanvas项目的高可用性、可扩展性和可维护性。
