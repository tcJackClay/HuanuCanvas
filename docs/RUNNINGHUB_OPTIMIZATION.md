# RunningHub 后端优化总结

## 优化日期
2026-01-31

## 优化内容

### 1. 错误码体系 (ERROR_CODES)

定义了统一的错误码，便于前端统一处理：

```javascript
const ERROR_CODES = {
  // 配置错误 (4xx)
  API_KEY_NOT_CONFIGURED: { status: 400, message: 'API Key未配置' },
  WEBAPP_ID_NOT_CONFIGURED: { status: 400, message: 'WebApp ID未配置' },
  INVALID_API_KEY: { status: 400, message: 'API Key格式无效' },
  INVALID_WEBAPP_ID: { status: 400, message: 'WebApp ID格式无效' },
  
  // 请求参数错误 (4xx)
  MISSING_REQUIRED_FIELD: { status: 400, message: '缺少必填字段' },
  INVALID_REQUEST_BODY: { status: 400, message: '请求体格式无效' },
  INVALID_NODE_INFO_LIST: { status: 400, message: '节点信息列表无效' },
  INVALID_TASK_ID: { status: 400, message: '任务ID无效' },
  
  // 文件处理错误 (4xx/5xx)
  FILE_NOT_FOUND: { status: 404, message: '文件不存在' },
  FILE_READ_FAILED: { status: 500, message: '文件读取失败' },
  FILE_UPLOAD_FAILED: { status: 500, message: '文件上传失败' },
  FILE_SIZE_EXCEEDED: { status: 400, message: '文件大小超出限制' },
  
  // RunningHub API 错误 (5xx)
  TASK_SUBMIT_FAILED: { status: 500, message: '任务提交失败' },
  TASK_STATUS_QUERY_FAILED: { status: 500, message: '任务状态查询失败' },
  TASK_TIMEOUT: { status: 408, message: '任务执行超时' },
  TASK_FAILED: { status: 500, message: '任务执行失败' },
  
  // 通用错误 (5xx)
  INTERNAL_SERVER_ERROR: { status: 500, message: '服务器内部错误' },
  UNKNOWN_ERROR: { status: 500, message: '发生未知错误' }
};
```

### 2. 统一响应格式

**成功响应**：
```javascript
{
  "success": true,
  "message": "success",
  "data": { ... }
}
```

**错误响应**：
```javascript
{
  "success": false,
  "code": "API_KEY_NOT_CONFIGURED",
  "message": "API Key未配置",
  "status": 400,
  "details": "..." // 开发环境显示
}
```

### 3. 输入验证函数

| 函数 | 用途 |
|------|------|
| `validateApiKey(apiKey)` | 验证 API Key 格式 |
| `validateWebappId(webappId)` | 验证 WebAppId 格式 |
| `validateNodeInfoList(list)` | 验证节点信息列表 |
| `validateTaskId(taskId)` | 验证任务 ID |
| `validateRequestBody(req, fields)` | 验证请求体必填字段 |

### 4. 统一配置管理

```javascript
// 获取有效的 API Key
const { apiKey, source } = getEffectiveApiKey(requestApiKey);

// 获取有效的 WebAppId
const { webappId, source } = getEffectiveWebappId(requestWebappId);
```

### 5. 文件预处理

```javascript
// 预处理节点列表，上传本地文件到 RunningHub
const processedNodeInfoList = await preprocessNodeList(nodeInfoList, apiKey);
```

## 修改的端点

| 端点 | 修改内容 |
|------|---------|
| `GET /api/runninghub/config` | 使用 successResponse |
| `POST /api/runninghub/config` | 添加输入验证 |
| `POST /api/runninghub/submit-task` | 添加输入验证，使用统一响应 |
| `GET /api/runninghub/task-status/:taskId` | 添加 taskId 验证，使用统一响应 |
| `POST /api/runninghub/save_nodes` | 使用统一的 API Key 获取 |

## 文件统计

- **修改文件**: `src/backend/src/routes/runningHub.js`
- **文件行数**: 1126 行
- **新增代码**: ~250 行 (工具函数和验证)

## 响应示例

### 获取配置
```json
{
  "success": true,
  "message": "success",
  "data": {
    "apiKey": "5d9bcfcd...",
    "baseUrl": "https://www.runninghub.cn",
    "enabled": true,
    "availableWebApps": [...]
  }
}
```

### 错误响应
```json
{
  "success": false,
  "code": "API_KEY_NOT_CONFIGURED",
  "message": "API Key未配置",
  "status": 400
}
```

## 后续优化建议

1. 添加请求日志中间件
2. 实现请求速率限制
3. 添加 API 版本控制
4. 实现 WebSocket 实时推送任务状态
