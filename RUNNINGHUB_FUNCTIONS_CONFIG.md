# 🚀 RUNNINGHUB 功能配置指南

## 📍 配置文件位置

**主要配置文件**: `src/data/settings.json`

## 🗂️ 配置结构说明

```json
{
  "theme": "dark",
  "runningHubFunctions": [
    {
      "id": "unique_function_id",           // 唯一标识符
      "name": "功能名称",                    // 显示名称
      "icon": "🎨",                        // Emoji图标
      "color": "#3B82F6",                  // 主题色彩（HEX格式）
      "webappId": "your_webapp_id_here",   // RUNNINGHUB应用ID
      "category": "功能分类",               // 分类标签
      "description": "功能描述",             // 详细描述
      "defaultInputs": {}                   // 默认输入参数
    }
  ]
}
```

## 🎨 图标和颜色建议

### 推荐图标 (Emoji)
- **图片处理**: 🎨 🖼️ 🎭 🔍 ✂️
- **音频处理**: 🎵 🎼 🎧 🔊
- **视频处理**: 🎬 🎞️ 📹 ⏯️
- **文本处理**: 📝 📄 📋 🌐
- **数据分析**: 📊 📈 📉 🔢
- **开发工具**: 💻 🔧 ⚡ 🛠️
- **其他**: 🎯 🚀 ⚙️ 🔮

### 推荐颜色 (HEX格式)
- **蓝色系**: #3B82F6 (主要蓝)
- **绿色系**: #10B981 (成功绿)  
- **紫色系**: #8B5CF6 (创意紫)
- **橙色系**: #F59E0B (活力橙)
- **红色系**: #EF4444 (警示红)
- **粉色系**: #EC4899 (可爱粉)
- **青色系**: #0891B2 (科技青)
- **灰色系**: #6B7280 (中性灰)

## 📝 如何添加新功能

1. **打开配置文件**: `src/data/settings.json`

2. **在 `runningHubFunctions` 数组中添加新对象**:
```json
{
  "id": "my_new_function",
  "name": "我的新功能", 
  "icon": "🆕",
  "color": "#FF6B6B",
  "webappId": "your_actual_webapp_id",
  "category": "新分类",
  "description": "这是一个很棒的新功能",
  "defaultInputs": {
    "param1": "default_value1",
    "param2": "default_value2"
  }
}
```

3. **重启应用**以加载新配置

## 🔧 功能分类建议

建议使用以下标准分类：
- **图片处理**: 图片生成、编辑、增强等
- **音频处理**: 语音合成、音乐生成等  
- **视频处理**: 视频编辑、生成等
- **文本处理**: 翻译、分析、写作等
- **数据分析**: 可视化、统计分析等
- **开发工具**: 代码生成、调试等
- **其他**: 未能归类的功能

## ⚠️ 注意事项

1. **ID唯一性**: 每个功能的 `id` 必须唯一
2. **WebAppID**: 需要替换为实际的RUNNINGHUB应用ID
3. **颜色格式**: 必须使用HEX格式的颜色值 (#RRGGBB)
4. **JSON格式**: 确保JSON语法正确，可使用在线JSON验证器检查

## 🎯 实际使用示例

```json
{
  "id": "stable_diffusion",
  "name": "Stable Diffusion",
  "icon": "🎨",
  "color": "#8B5CF6",
  "webappId": "sd_webapp_v1_0",
  "category": "图片生成",
  "description": "基于Stable Diffusion的AI图片生成",
  "defaultInputs": {
    "model": "stable-diffusion-v1-5",
    "steps": 20,
    "guidance_scale": 7.5
  }
}
```

## 🔄 更新配置

修改配置文件后，需要重启应用或刷新页面以使更改生效。

---

**配置完成后，点击画布左上角的新按钮（🚀）即可使用这些功能！**