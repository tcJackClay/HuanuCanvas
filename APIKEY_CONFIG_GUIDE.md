# 🔑 RUNNINGHUB APIKEY 配置指南

## 📁 配置文件位置

### **主要配置文件**:
- `src/data/runninghub_config.json` - **APIKEY配置文件**

### **功能配置文件**:
- `src/data/settings.json` - 功能列表和WebAppId配置

---

## 🔑 **APIKEY 配置步骤**

### **步骤1: 打开配置文件**
打开文件: `src/data/runninghub_config.json`

### **步骤2: 填写APIKEY**
在配置文件中找到 `runningHub` 部分：

```json
{
  "runningHub": {
    "apiKey": "YOUR_API_KEY_HERE"
  }
}
```

将 `YOUR_API_KEY_HERE` 替换为您的实际APIKEY：

```json
{
  "runningHub": {
    "apiKey": "你的实际APIKEY"
  }
}
```

### **步骤3: 保存文件**
保存配置文件

### **步骤4: 重启应用**
重启前端和后端服务以加载新配置

---

## 🔗 **完整配置文件示例**

### **runninghub_config.json**:
```json
{
  "runningHub": {
    "apiKey": "你的RUNNINGHUB_API_KEY"
  }
}
```

### **settings.json** (已有WebAppId配置):
```json
{
  "theme": "dark",
  "runningHubFunctions": [
    {
      "id": "ai_image_upscale",
      "name": "图片放大",
      "icon": "H",
      "color": "#3B82F6",
      "webappId": "2007596875607707650",
      "category": "图片处理",
      "description": "限制：4080最长边",
      "defaultInputs": {}
    }
  ]
}
```

---

## 🎯 **当前配置状态**

### ✅ **已完成的配置**:
- ✅ **WebAppId**: 所有功能都已配置正确的WebAppId
- ✅ **图标**: 图片放大功能图标已改为 "H"
- ✅ **功能列表**: 7个RUNNINGHUB功能已配置

### 🔑 **需要完成的配置**:
- ⏳ **APIKEY**: 需要在 `runninghub_config.json` 中填写

---

## 📋 **功能列表**

| 功能名称 | WebAppId | 状态 |
|---------|----------|------|
| 图片放大 | 2007596875607707650 | ✅ 已配置 |
| 人物多角度 | 1997953926043459586 | ✅ 已配置 |
| 图片融合 | 1954402676572340225 | ✅ 已配置 |
| 镜头分镜 | 2004018172321800193 | ✅ 已配置 |
| 道具迁移 | 1973744628144975874 | ✅ 已配置 |
| 动作迁移 | 1996522834732130305 | ✅ 已配置 |
| 视频高清 | 1933689617772404738 | ✅ 已配置 |

---

## 🔧 **配置验证**

配置完成后，您应该能看到：

1. **🚀按钮**: Canvas页面左上角
2. **功能面板**: 点击🚀按钮后右侧展开
3. **图标显示**: 图片放大功能显示 "H" 图标
4. **功能运行**: 填写APIKEY后可以正常运行RUNNINGHUB功能

---

## 💡 **获取APIKEY**

如果您还没有RUNNINGHUB的APIKEY，请：

1. 访问 RUNNINGHUB 官网
2. 注册账户并登录
3. 在账户设置中找到APIKEY
4. 复制APIKEY并粘贴到配置文件中

---

## 🎊 **配置完成后**

填写APIKEY后，您就可以正常使用所有RUNNINGHUB功能了！

**现在只需要填写APIKEY，其他配置都已经完成了！** 🚀