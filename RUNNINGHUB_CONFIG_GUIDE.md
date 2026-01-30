# RunningHub配置指南

## 问题诊断

如果遇到"任务执行失败"错误，通常是因为缺少必要的API配置。

## 解决方案

### 1. 配置环境变量

在项目根目录创建 `.env` 文件，添加以下配置：

```bash
# RunningHub API配置
RUNNINGHUB_API_KEY=your_actual_api_key_here
RUNNINGHUB_WEBAPP_ID=your_actual_webapp_id_here
RUNNINGHUB_API_BASE_URL=https://www.runninghub.cn
```

### 2. 获取API密钥

1. 访问 [RunningHub官网](https://www.runninghub.cn)
2. 登录您的账户
3. 转到API设置页面
4. 生成新的API密钥
5. 记录您的WebApp ID

### 3. 重启服务

配置完成后，需要重启后端服务：

```bash
# 停止当前服务 (Ctrl+C)
# 重新启动
npm run backend:dev
```

### 4. 验证配置

配置正确后，RunningHub功能应该能够正常工作。

## 常见错误

### "API Key未配置"
- 检查环境变量是否正确设置
- 确认API Key格式正确

### "NOT_FOUND"
- 验证WebApp ID是否正确
- 确认应用存在且可访问

### 网络请求失败
- 确认后端服务运行在 http://127.0.0.1:8766
- 检查防火墙设置

## 调试

如果仍然遇到问题，请查看浏览器开发者工具的Console面板和后端日志以获取更多调试信息。