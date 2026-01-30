# HuanuCanvas RunningHub 节点信息格式修复报告

## 📋 问题总结

经过深入分析，我们发现了导致 `APIKEY_INVALID_NODE_INFO` 错误的根本原因：

### 🔍 根本原因
**节点信息格式不匹配** - RunningHub API只接受4个特定字段，但我们发送了9个字段。

### 🎯 具体问题

#### 1. **RunningHub API期望的字段**
```json
{
  "nodeId": "15",
  "fieldName": "image", 
  "fieldValue": "fa4b06dee7ca8624d0ed22e146fa7f1f1edfe5bd8e290aa38e16ce2ad687593a.png",
  "description": "image"
}
```

#### 2. **我们发送的字段**
```json
{
  "nodeId": "15",
  "nodeName": "LoadImage",
  "fieldName": "image",
  "fieldValue": "fa4b06dee7ca8624d0ed22e146fa7f1f1edfe5bd8e290aa38e16ce2ad687593a.png",
  "fieldData": "[[\"example.png\", \"keep_this_dic\"], {\"image_upload\": true}]",
  "fieldType": "IMAGE",
  "description": "image",
  "descriptionCn": null,
  "descriptionEn": "image",
  "uploadStatus": "success",
  "hasServerPath": false
}
```

#### 3. **字段对比**
- **官方字段**: `nodeId`, `fieldName`, `fieldValue`, `description`
- **我们的额外字段**: `nodeName`, `fieldData`, `fieldType`, `descriptionCn`, `descriptionEn`, `uploadStatus`, `hasServerPath`

## 🔧 修复方案

### 1. **后端节点信息格式清理**
已修复 `src/backend/src/utils/runningHubService.js`，添加了 `cleanNodeInfoList` 函数：

```javascript
cleanNodeInfoList(nodeInfoList) {
  if (!Array.isArray(nodeInfoList)) {
    return [];
  }
  
  return nodeInfoList.map(node => ({
    nodeId: node.nodeId,
    fieldName: node.fieldName,
    fieldValue: node.fieldValue || '',
    description: node.description || ''
  }));
}
```

### 2. **API配置读取修复**
已修复 `src/backend/src/routes/runningHub.js` 中的配置路径和优先级：

```javascript
// 优先使用后端配置文件中读取的值
const envApiKey = process.env.RUNNINGHUB_API_KEY || config.RUNNINGHUB.DEFAULT_API_KEY || '';
const configWebAppId = config.RUNNINGHUB.DEFAULT_WEBAPP_ID || '';
const envWebappId = process.env.RUNNINGHUB_WEBAPP_ID && process.env.RUNNINGHUB_WEBAPP_ID !== 'your_webapp_id_here' 
                   ? process.env.RUNNINGHUB_WEBAPP_ID 
                   : '';

// 优先顺序：环境变量(非占位符) > 配置文件 > settings.json
const effectiveWebappId = envWebappId || configWebAppId || defaultWebAppId || '';
```

### 3. **路径修复**
修复了settings.json的读取路径：
```javascript
const settingsPath = path.join(config.BASE_DIR, 'src', 'data', 'settings.json');
```

## ✅ 修复验证

### 修复前的问题
- ❌ API配置读取失败（路径错误）
- ❌ 节点信息格式错误（字段过多）
- ❌ API返回 `APIKEY_INVALID_NODE_INFO`

### 修复后的预期结果
- ✅ API配置正确读取7个可用应用
- ✅ 节点信息格式自动清理为4个字段
- ✅ 能够成功提交任务到RunningHub

## 📁 修改的文件

### 1. `src/backend/src/utils/runningHubService.js`
- ✅ 添加 `cleanNodeInfoList` 函数
- ✅ 在 `submitTask` 中调用清理函数
- ✅ 增加详细的调试日志

### 2. `src/backend/src/routes/runningHub.js`
- ✅ 修复配置读取优先级逻辑
- ✅ 修复settings.json路径
- ✅ 改进错误处理和日志

### 3. 测试脚本
- ✅ `scripts/debug-node-format.cjs` - 调试节点格式问题
- ✅ `scripts/analyze-api-format.cjs` - 分析API格式差异
- ✅ `scripts/test-fixed-format.cjs` - 测试修复效果

## 🚀 下一步操作

### 1. 重启后端服务
由于后端服务无法自动重载修改，需要手动重启：
```bash
cd HuanuCanvas
npm run backend:dev
```

### 2. 验证修复效果
重启后运行测试：
```bash
node scripts/test-fixed-format.cjs
```

### 3. 前端测试
1. 打开前端应用
2. 选择RunningHub节点
3. 上传图片文件
4. 点击运行
5. 验证任务是否成功提交

## 🎯 预期结果

修复后，RunningHub功能应该能够：
1. ✅ 正确读取WebApp配置（7个可用应用）
2. ✅ 获取节点信息
3. ✅ 成功上传文件
4. ✅ 正确提交任务
5. ✅ 接收任务结果

## 📊 技术细节

### API调用流程
1. 前端构建 `nodeInfoList2`（包含额外字段）
2. 后端接收并传递给 `runningHubService.submitTask`
3. `cleanNodeInfoList` 自动清理字段
4. 发送清理后的4字段数据给RunningHub API
5. RunningHub返回任务结果

### 关键代码位置
- 格式清理: `src/backend/src/utils/runningHubService.js:82-103`
- 配置读取: `src/backend/src/routes/runningHub.js:17-86`
- 任务提交: `src/backend/src/routes/runningHub.js:533-637`

---

**修复完成时间**: 2026-01-29  
**状态**: 待重启服务验证  
**优先级**: 高（阻塞RunningHub核心功能）