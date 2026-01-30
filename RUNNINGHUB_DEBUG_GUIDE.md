# RunningHub 调试指南

## 🔍 问题诊断步骤

为了准确诊断RunningHub文件识别问题，请按照以下步骤进行调试：

### 📋 第一步：确认文件上传状态

1. **打开浏览器控制台**
2. **进入RunningHub功能**
3. **选择功能并上传图片**
4. **查看以下关键日志信息**：

```
🔍 文件上传成功，完整响应分析: {
  success: true,
  hasThirdParty: true,
  thirdPartyData: { fileName: "文件名.jpg", fileType: "input" },
  fileUploadSuccess: true,  // ⭐ 这必须是true
  rawThirdPartyResponse: { ... },  // ⭐ 检查原始响应
  serverFilePath: "文件名.jpg"
}
```

### 📋 第二步：确认任务提交流程

1. **点击"运行AI应用"**
2. **查看以下关键日志**：

```
🚨 关键调试信息: {
  taskSubmissionTime: "2024-...",
  webappId: "正确的webappId",
  nodeCount: 1,
  detailedNodes: [{
    nodeId: "15",
    fieldName: "image",
    fieldValue: "文件名.jpg",  // ⭐ 这应该是正确的文件名
    uploadStatus: "success"   // ⭐ 这必须是success
  }],
  serverFilePaths: ["文件名.jpg"]  // ⭐ 这应该有内容
}
```

### 📋 第三步：检查后端调试信息

1. **查看后端控制台**
2. **查找以下日志**：

```
🔍 cleanNodeInfoList调试: {
  inputCount: 1,
  fileNodes: [{
    nodeId: "15",
    fieldName: "image", 
    fieldValue: "文件名.jpg",  // ⭐ 这应该是正确的文件名
    fieldValueLength: 文件名长度
  }]
}

🔍 提交任务前调试信息: {
  originalNodeInfoList: [...],
  cleanedNodeInfoList: [...],
  nodeInfoWithFiles: [{
    nodeId: "15",
    fieldName: "image",
    fieldValue: "文件名.jpg"  // ⭐ 最终发送给RunningHub的应该就是这个
  }]
}
```

### 📋 第四步：检查RunningHub响应

查看后端的最终提交日志：

```
🚨 最终提交给RunningHub的数据: {
  webappId: "正确的webappId",
  nodeInfoList: [{
    nodeId: "15",
    fieldName: "image",
    fieldValue: "文件名.jpg"  // ⭐ RunningHub收到的应该就是这个
  }]
}
```

## 🎯 问题定位

### ✅ 正常情况应该看到的日志：

1. **文件上传成功**: `fileUploadSuccess: true`
2. **任务提交成功**: `uploadStatus: "success"`
3. **后端处理正常**: `cleanNodeInfoList` 输出正确的文件名
4. **RunningHub接收**: 最终数据包含正确的文件名

### ❌ 异常情况及对应问题：

1. **fileUploadSuccess: false**
   - 文件上传到RunningHub失败
   - 检查网络连接和API Key

2. **uploadStatus: 不为 "success"**
   - 前端状态管理问题
   - 文件上传响应处理有问题

3. **fieldValue: 包含 "api/" 前缀**
   - 路径清理逻辑有问题
   - 但这个我们已经在修复

4. **fieldValue: 是哈希值**
   - RunningHub上传失败，使用fallback值
   - 需要检查文件上传流程

## 🔧 立即调试建议

请按照以上步骤运行，并分享以下关键信息：

1. **文件上传后的完整响应日志**
2. **任务提交时的调试信息**
3. **cleanNodeInfoList的输出**
4. **最终提交给RunningHub的数据**

这样我们就能精确定位问题所在了！