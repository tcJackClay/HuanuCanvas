# HuanuCanvas 测试环境特定配置

## 🧪 测试环境特点

### 环境区分策略
- **开发环境**: 本地开发，代码热重载，详细日志
- **测试环境**: 模拟生产环境，功能验证，性能测试
- **生产环境**: 真实用户环境，高可用，安全加固

### 测试环境配置

#### 环境变量区分
```bash
# 测试环境专用配置
ENVIRONMENT=test
NODE_ENV=production
DEBUG_MODE=false
LOG_LEVEL=info
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_ERROR_REPORTING=true
```

#### 端口分配策略 (测试环境)
| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 | 5206 | Vite开发服务器端口 |
| 后端 | 8765 | Express API端口 |
| Grafana | 3001 | 避免与生产冲突 |
| Prometheus | 9091 | 独立监控实例 |

#### 测试数据管理
```bash
# 创建测试数据目录
mkdir -p /opt/huanu-canvas/app/test-data/{images,fixtures,samples}

# 测试用户数据
echo '{"users":[{"id":"test1","name":"测试用户1","email":"test1@example.com"}]}' > /opt/huanu-canvas/app/test-data/users.json

# 测试图片资源
mkdir -p /opt/huanu-canvas/app/test-data/images/{input,output}
```

## 🔧 测试环境部署配置

### Docker Compose (测试环境)
```yaml
# /opt/huanu-canvas/docker/docker-compose.test.yml
version: '3.8'

services:
  # 前端服务
  frontend-test:
    build:
      context: ../..
      dockerfile: deployment/Dockerfile.frontend
    container_name: huanu-frontend-test
    ports:
      - "5206:80"
    environment:
      - NODE_ENV=production
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - VITE_API_URL=http://192.168.10.5:8765
    volumes:
      - ./config/nginx/nginx.test.conf:/etc/nginx/nginx.conf:ro
      - /opt/huanu-canvas/ssl:/etc/nginx/ssl:ro
      - test-data:/app/data
    restart: unless-stopped
    networks:
      - huanu-test-network

  # 后端API服务
  backend-test:
    build:
      context: ../..
      dockerfile: deployment/Dockerfile.backend
    container_name: huanu-backend-test
    ports:
      - "8765:8765"
    environment:
      - NODE_ENV=production
      - ENVIRONMENT=test
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - FRONTEND_URL=http://frontend-test:80
      - SQLITE_PATH=/app/data/huanu_canvas_test.db
    volumes:
      - test-data:/app/data
    restart: unless-stopped
    networks:
      - huanu-test-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8765/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # SQLite数据库 (轻量级，适合测试)
  sqlite-test:
    image: alpine:latest
    container_name: huanu-sqlite-test
    volumes:
      - test-data:/app/data
    command: ["sh", "-c", "apk add --no-cache sqlite && tail -f /dev/null"]
    restart: unless-stopped
    networks:
      - huanu-test-network

  # Redis缓存 (开发测试)
  redis-test:
    image: redis:7-alpine
    container_name: huanu-redis-test
    ports:
      - "6380:6379"
    volumes:
      - test-redis:/data
    command: redis-server --appendonly yes
    restart: unless-stopped
    networks:
      - huanu-test-network

  # 监控服务 (简化版)
  prometheus-test:
    image: prom/prometheus:latest
    container_name: huanu-prometheus-test
    ports:
      - "9091:9090"
    volumes:
      - ./monitoring/prometheus.test.yml:/etc/prometheus/prometheus.yml:ro
      - test-prometheus:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
    restart: unless-stopped
    networks:
      - huanu-test-network

volumes:
  test-data:
    driver: local
  test-redis:
    driver: local
  test-prometheus:
    driver: local

networks:
  huanu-test-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.21.0.0/16
```

## 🧪 测试配置

### API测试配置
```javascript
// 测试API端点
const testEndpoints = {
  health: 'http://192.168.10.5:8765/health',
  api: 'http://192.168.10.5:8765/api',
  frontend: 'http://192.168.10.5:5206'
};

// 测试用户凭据
const testCredentials = {
  admin: {
    username: 'admin',
    password: 'admin123'
  },
  user: {
    username: 'testuser',
    password: 'test123'
  }
};
```

### 自动化测试脚本
```bash
#!/bin/bash
# test-deployment.sh - 测试部署验证

echo "=== HuanuCanvas 测试环境验证 ==="

# 检查服务状态
check_service() {
    local service=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo "检查 $service 服务..."
    status=$(curl -s -o /dev/null -w "%{http_code}" $url)
    
    if [ "$status" = "$expected_status" ]; then
        echo "✅ $service 服务正常 (HTTP $status)"
    else
        echo "❌ $service 服务异常 (HTTP $status)"
        return 1
    fi
}

# 执行检查
check_service "前端" "http://192.168.10.5:5206" "200"
check_service "后端API" "http://192.168.10.5:8765/health" "200"
check_service "监控" "http://192.168.10.5:9091/-/healthy" "200"

# 功能测试
echo "执行功能测试..."

# 测试API端点
curl -X GET "http://192.168.10.5:8765/api/projects" || echo "API测试失败"

echo "=== 测试验证完成 ==="
```

