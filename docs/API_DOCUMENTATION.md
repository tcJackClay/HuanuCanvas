# API文档

## 📋 概述

HuanuCanvas API提供了完整的Canvas编辑器、AI图像生成和项目管理功能。本文档详细描述了所有可用的API端点、请求参数和响应格式。

## 🔐 身份认证

### Bearer Token认证
所有API请求都需要在Header中包含有效的Bearer token:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

### 获取访问Token
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

## 🏥 健康检查

### 系统健康状态
```http
GET /health
GET /api/health
```

**响应示例**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-27T16:00:00Z",
  "version": "1.4.1",
  "services": {
    "database": "connected",
    "ai_service": "connected",
    "storage": "connected"
  }
}
```

## 🎨 画布管理API

### 获取画布列表
```http
GET /api/canvas
Authorization: Bearer {token}
```

**查询参数**:
- `page` (number): 页码，默认1
- `limit` (number): 每页数量，默认20
- `status` (string): 画布状态 (draft, published, archived)
- `tags` (string): 标签筛选

**响应示例**:
```json
{
  "success": true,
  "data": {
    "canvases": [
      {
        "id": "canvas_123",
        "name": "My Design",
        "description": "A beautiful canvas design",
        "status": "draft",
        "tags": ["design", "ai"],
        "thumbnail": "https://storage.example.com/thumbnails/canvas_123.jpg",
        "created_at": "2024-01-27T10:00:00Z",
        "updated_at": "2024-01-27T15:30:00Z",
        "author": {
          "id": "user_456",
          "name": "John Doe",
          "avatar": "https://cdn.example.com/avatars/user_456.jpg"
        },
        "stats": {
          "views": 1250,
          "likes": 89,
          "comments": 12
        }
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 100,
      "per_page": 20
    }
  }
}
```

### 创建新画布
```http
POST /api/canvas
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "New Canvas Design",
  "description": "A new canvas design created via API",
  "template_id": "template_789",
  "tags": ["new", "api-created"],
  "settings": {
    "width": 1920,
    "height": 1080,
    "background": "#ffffff",
    "grid": true
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "canvas_new_123",
    "name": "New Canvas Design",
    "description": "A new canvas design created via API",
    "status": "draft",
    "created_at": "2024-01-27T16:00:00Z",
    "updated_at": "2024-01-27T16:00:00Z"
  }
}
```

### 获取画布详情
```http
GET /api/canvas/{canvas_id}
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "canvas_123",
    "name": "My Design",
    "description": "A beautiful canvas design",
    "status": "draft",
    "tags": ["design", "ai"],
    "canvas_data": {
      "nodes": [
        {
          "id": "node_1",
          "type": "rectangle",
          "position": { "x": 100, "y": 100 },
          "data": {
            "label": "Rectangle Node",
            "width": 200,
            "height": 100,
            "fill": "#3498db",
            "stroke": "#2980b9"
          }
        }
      ],
      "edges": [
        {
          "id": "edge_1",
          "source": "node_1",
          "target": "node_2",
          "type": "smoothstep",
          "animated": true
        }
      ]
    },
    "created_at": "2024-01-27T10:00:00Z",
    "updated_at": "2024-01-27T15:30:00Z",
    "author": {
      "id": "user_456",
      "name": "John Doe"
    }
  }
}
```

### 更新画布
```http
PUT /api/canvas/{canvas_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Canvas Design",
  "description": "Updated via API",
  "canvas_data": {
    "nodes": [...],
    "edges": [...]
  }
}
```

### 删除画布
```http
DELETE /api/canvas/{canvas_id}
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "success": true,
  "message": "Canvas deleted successfully"
}
```

## 🤖 AI图像生成API

### 生成图像
```http
POST /api/ai/generate-image
Authorization: Bearer {token}
Content-Type: application/json

{
  "prompt": "A beautiful sunset over mountains",
  "style": "realistic",
  "size": "1024x1024",
  "quality": "high",
  "variations": 1,
  "canvas_id": "canvas_123",
  "position": { "x": 100, "y": 200 }
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "ai_generation_456",
    "prompt": "A beautiful sunset over mountains",
    "style": "realistic",
    "status": "completed",
    "result": {
      "image_url": "https://storage.example.com/generated/ai_generation_456.jpg",
      "thumbnail_url": "https://storage.example.com/generated/thumbs/ai_generation_456.jpg",
      "metadata": {
        "width": 1024,
        "height": 1024,
        "format": "jpg",
        "file_size": 245760,
        "generated_at": "2024-01-27T16:05:00Z"
      }
    }
  }
}
```

### 获取生成历史
```http
GET /api/ai/generations
Authorization: Bearer {token}
```

**查询参数**:
- `page` (number): 页码
- `limit` (number): 每页数量
- `status` (string): 状态 (pending, processing, completed, failed)

### 图像增强
```http
POST /api/ai/enhance-image
Authorization: Bearer {token}
Content-Type: application/json

{
  "image_url": "https://storage.example.com/image.jpg",
  "enhancement_type": "upscale",
  "scale_factor": 2,
  "quality": "high"
}
```

## 📊 项目管理API

### 获取项目列表
```http
GET /api/projects
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "project_789",
        "name": "Website Design",
        "description": "Complete website design project",
        "status": "active",
        "canvases_count": 12,
        "collaborators": [
          {
            "id": "user_456",
            "name": "John Doe",
            "role": "owner"
          }
        ],
        "created_at": "2024-01-20T10:00:00Z",
        "updated_at": "2024-01-27T15:30:00Z"
      }
    ]
  }
}
```

### 创建项目
```http
POST /api/projects
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "New Design Project",
  "description": "A new design project",
  "canvas_ids": ["canvas_123", "canvas_456"]
}
```

## 👥 用户管理API

### 获取用户信息
```http
GET /api/user/profile
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "user_456",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://cdn.example.com/avatars/user_456.jpg",
    "role": "designer",
    "preferences": {
      "theme": "dark",
      "language": "zh-CN",
      "notifications": {
        "email": true,
        "push": false
      }
    },
    "stats": {
      "canvases_created": 45,
      "collaborations": 12,
      "total_views": 15420
    }
  }
}
```

### 更新用户信息
```http
PUT /api/user/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Smith",
  "preferences": {
    "theme": "light"
  }
}
```

## 🔄 Webhook API

### Canvas更新Webhook
当画布被更新时，系统会向配置的webhook URL发送POST请求:

```json
{
  "event": "canvas.updated",
  "timestamp": "2024-01-27T16:00:00Z",
  "data": {
    "canvas_id": "canvas_123",
    "user_id": "user_456",
    "changes": {
      "name": "Updated Canvas",
      "canvas_data": { ... }
    }
  }
}
```

### AI生成完成Webhook
```json
{
  "event": "ai.generation.completed",
  "timestamp": "2024-01-27T16:05:00Z",
  "data": {
    "generation_id": "ai_generation_456",
    "status": "completed",
    "result": {
      "image_url": "https://storage.example.com/generated/image.jpg"
    }
  }
}
```

## 📝 文件上传API

### 上传文件
```http
POST /api/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [binary file data]
type: "image" | "asset"
folder: "assets/images"
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "file_789",
    "filename": "image.jpg",
    "original_name": "my-image.jpg",
    "url": "https://storage.example.com/uploads/image_789.jpg",
    "size": 245760,
    "type": "image/jpeg",
    "uploaded_at": "2024-01-27T16:00:00Z"
  }
}
```

## 🔍 搜索API

### 搜索画布
```http
GET /api/search/canvases
Authorization: Bearer {token}
```

**查询参数**:
- `q` (string): 搜索关键词
- `tags` (string): 标签筛选
- `author` (string): 作者ID
- `date_from` (string): 开始日期 (ISO 8601)
- `date_to` (string): 结束日期 (ISO 8601)

**响应示例**:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "canvas_123",
        "name": "Matching Canvas",
        "description": "This canvas matches your search",
        "relevance_score": 0.95
      }
    ],
    "total": 1,
    "query": "design",
    "filters": {
      "tags": ["design"],
      "date_range": {
        "from": "2024-01-01T00:00:00Z",
        "to": "2024-01-31T23:59:59Z"
      }
    }
  }
}
```

## ⚠️ 错误处理

### 标准错误格式
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": {
      "field": "name",
      "issue": "Name is required"
    }
  },
  "timestamp": "2024-01-27T16:00:00Z",
  "request_id": "req_123456789"
}
```

### 常见错误码
- `VALIDATION_ERROR` (400): 输入参数验证失败
- `UNAUTHORIZED` (401): 未授权访问
- `FORBIDDEN` (403): 禁止访问
- `NOT_FOUND` (404): 资源不存在
- `RATE_LIMIT_EXCEEDED` (429): 超出速率限制
- `INTERNAL_ERROR` (500): 服务器内部错误
- `SERVICE_UNAVAILABLE` (503): 服务暂时不可用

### 速率限制
- **标准API**: 每分钟1000次请求
- **AI生成API**: 每分钟10次请求
- **文件上传**: 每小时100次请求

## 📚 SDK和工具

### JavaScript SDK
```javascript
import { HuanuCanvasAPI } from '@huanu-canvas/api';

const api = new HuanuCanvasAPI({
  baseURL: 'https://api.huanucanvas.com',
  token: 'your-access-token'
});

// 创建画布
const canvas = await api.canvases.create({
  name: 'My Canvas',
  description: 'Created via SDK'
});

// 生成AI图像
const image = await api.ai.generateImage({
  prompt: 'Beautiful landscape',
  style: 'realistic'
});
```

### Python SDK
```python
from huanu_canvas import HuanuCanvasAPI

api = HuanuCanvasAPI(
    base_url='https://api.huanucanvas.com',
    token='your-access-token'
)

# 获取画布列表
canvases = api.canvases.list(page=1, limit=20)

# 上传文件
uploaded = api.files.upload('path/to/image.jpg', type='image')
```

## 📊 监控和分析

### API使用统计
```http
GET /api/analytics/usage
Authorization: Bearer {token}
```

### 性能指标
```http
GET /api/analytics/performance
Authorization: Bearer {token}
```

## 🔄 版本管理

### API版本
当前支持的API版本:
- `v1`: 当前版本，推荐使用
- `v2`: 开发中，即将发布

### 版本升级
通过Header指定API版本:
```http
API-Version: v1
```

## 📞 支持

### 技术支持
- **文档**: https://docs.huanucanvas.com/api
- **示例**: https://github.com/tcJackClay/HuanuCanvas-examples
- **社区**: https://github.com/tcJackClay/HuanuCanvas/discussions

### 联系我们
- **技术支持**: api-support@huanucanvas.com
- **商务合作**: business@huanucanvas.com

---

**最后更新**: 2024-01-27  
**API版本**: v1  
**文档版本**: 1.0.0