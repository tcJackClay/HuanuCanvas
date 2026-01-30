# RunningHub 问题诊断脚本

## 🔍 快速诊断步骤

### 1. 启动服务
```bash
# 启动后端
PORT=8770 npm run backend:dev

# 启动前端（新终端）
npm run dev
```

### 2. 打开浏览器控制台
1. 进入RunningHub功能
2. 上传一张图片
3. 查看控制台中的🔍调试信息

### 3. 关键检查点

#### ✅ 正常文件上传应该显示：
```
🔍 文件上传成功，完整响应分析: {
  success: true,
  fileUploadSuccess: true,  // ⭐ 必须为true
  serverFilePath: "正确的文件名.jpg"
}
```

#### ❌ 如果看到以下内容说明有问题：
```
fileUploadSuccess: false  // 文件上传失败
serverFilePath: null      // 没有返回文件路径
fieldValue: "哈希值.jpg"  // 上传失败，使用fallback
```

### 4. 任务提交调试

#### ✅ 正常任务提交应该显示：
```
🚨 关键调试信息: {
  nodeCount: 1,
  detailedNodes: [{
    uploadStatus: "success",  // ⭐ 必须为success
    fieldValue: "正确的文件名.jpg"
  }]
}
```

### 5. 后端调试信息

查看后端控制台，查找：
```
🔍 cleanNodeInfoList调试: {
  fileNodes: [{
    fieldValue: "正确的文件名.jpg"  // 最终发送给RunningHub的
  }]
}

🚨 最终提交给RunningHub的数据: {
  nodeInfoList: [{
    fieldValue: "正确的文件名.jpg"  // RunningHub收到的
  }]
}
```

## 🎯 常见问题快速诊断

| 问题现象 | 可能原因 | 解决方案 |
|---------|---------|---------|
| fileUploadSuccess: false | 网络/配置问题 | 检查API Key和网络 |
| uploadStatus: 不为success | 前端状态管理问题 | 检查文件上传响应处理 |
| fieldValue: 哈希值 | 文件上传失败 | 检查RunningHub配置 |
| 最终路径包含"api/" | 路径清理问题 | 检查extractFilePath逻辑 |

## 📋 调试信息收集

请提供以下信息以便进一步诊断：

1. **文件上传日志**: 🔍 文件上传成功，完整响应分析 的完整内容
2. **任务提交日志**: 🚨 关键调试信息 的完整内容  
3. **后端清理日志**: 🔍 cleanNodeInfoList调试 的完整内容
4. **最终提交日志**: 🚨 最终提交给RunningHub的数据 的完整内容

有了这些信息，我们就能精确定位问题所在了！