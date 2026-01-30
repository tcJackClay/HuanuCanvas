const path = require('path');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const RunningHubService = require('../utils/runningHubService');
const JsonStorage = require('../utils/jsonStorage');
const config = require('../config');

// 创建RunningHubService实例
const runningHubService = new RunningHubService();

console.log('[RunningHub] Service实例创建检查:', {
  serviceType: typeof runningHubService,
  hasUploadMethod: typeof runningHubService.uploadFileFromBuffer,
  constructorName: runningHubService.constructor.name,
  serviceKeys: Object.getOwnPropertyNames(Object.getPrototypeOf(runningHubService)).filter(key => key !== 'constructor')
});

// 添加一个简单的测试路由来验证
router.get('/health-check', (req, res) => {
  res.json({
    message: 'RunningHub routes are loaded',
    hasService: !!runningHubService,
    hasUploadMethod: typeof runningHubService.uploadFileFromBuffer === 'function'
  });
});



// 配置multer用于文件上传
const upload = multer({
  limits: {
    fileSize: 30 * 1024 * 1024, // 最大30MB，符合RunningHub要求
  },
});

// 获取RunningHub配置
router.get('/config', async (req, res) => {
  try {
    // 使用统一配置读取方式
    const apiKey = config.RUNNINGHUB.DEFAULT_API_KEY || '';
    const defaultWebAppId = config.RUNNINGHUB.DEFAULT_WEBAPP_ID || '';
    
    // 从app-config.json读取webappId列表
    const appConfigPath = path.join(config.BASE_DIR, 'data', 'app-config.json');
    let availableWebApps = [];
    
    if (require('fs').existsSync(appConfigPath)) {
      try {
        const appConfigData = require('fs').readFileSync(appConfigPath, 'utf8');
        const appConfig = JSON.parse(appConfigData);
        
        const functions = appConfig.features?.runningHubFunctions || [];
        if (functions.length > 0) {
          availableWebApps = functions.map(func => ({
            id: func.id,
            name: func.name,
            webappId: func.webappId,
            category: func.category,
            description: func.description,
            icon: func.icon,
            color: func.color
          }));
          
          console.log('[RunningHub] 从app-config.json读取可用应用:', {
            count: availableWebApps.length,
            defaultId: defaultWebAppId,
            names: availableWebApps.map(app => app.name)
          });
        }
      } catch (error) {
        console.warn('[RunningHub] 读取app-config.json失败:', error.message);
      }
    }
    
    // 使用统一配置的值
    const effectiveWebappId = defaultWebAppId;
    
    const response = {
      apiKey: apiKey || '',
      webappId: effectiveWebappId,
      baseUrl: config.RUNNINGHUB.API_BASE_URL || 'https://www.runninghub.cn',
      enabled: !!(apiKey && effectiveWebappId),
      configured: !!(apiKey && effectiveWebappId),
      availableWebApps: availableWebApps,
      defaultWebAppId: defaultWebAppId,
      appConfigPath: appConfigPath
    };
    
    console.log('[RunningHub] 返回配置:', {
      hasApiKey: !!response.apiKey,
      hasWebappId: !!response.webappId,
      availableApps: response.availableWebApps.length,
      defaultApp: response.availableWebApps[0]?.name || '未设置',
      effectiveWebappId: effectiveWebappId,
      baseUrl: response.baseUrl
    });
    
    res.json(response);
  } catch (error) {
    console.error('[RunningHub] 获取配置失败:', error);
    res.status(500).json({ 
      error: '获取配置失败', 
      details: error.message,
      apiKey: config.RUNNINGHUB.DEFAULT_API_KEY || '',
      webappId: config.RUNNINGHUB.DEFAULT_WEBAPP_ID || '',
      availableWebApps: []
    });
  }
});

// 保存RunningHub配置
router.post('/config', async (req, res) => {
  try {
    const { webappId, apiKey } = req.body;
    
    // 保存到新的专用配置文件
    const runningHubConfigPath = path.join(config.BASE_DIR, 'data', 'runninghub_config.json');
    const runningHubConfig = JsonStorage.load(runningHubConfigPath, {});
    
    runningHubConfig.runningHub = {
      webappId: webappId || '',
      apiKey: apiKey || '',
    };
    
    JsonStorage.save(runningHubConfigPath, runningHubConfig);
    res.json({ success: true, message: '配置保存成功' });
  } catch (error) {
    console.error('保存RunningHub配置失败:', error);
    res.status(500).json({ error: '保存配置失败', details: error.message });
  }
});

// ============== RUNNINGHUB功能管理API ==============

// 获取所有RUNNINGHUB功能
router.get('/functions', async (req, res) => {
  try {
    // 先尝试从新的统一配置文件读取
    const appConfigPath = path.join(config.BASE_DIR, 'data', 'app-config.json');
    let functions = [];
    
    if (require('fs').existsSync(appConfigPath)) {
      const appConfig = JsonStorage.load(appConfigPath, {});
      functions = appConfig.features?.runningHubFunctions || [];
    }
    
    // 如果新配置文件中没有，则从旧文件读取
    if (functions.length === 0) {
      const settings = JsonStorage.load(config.SETTINGS_FILE, {});
      functions = settings.runningHubFunctions || [];
    }
    
    res.json({
      success: true,
      data: functions,
      count: functions.length
    });
  } catch (error) {
    console.error('获取RUNNINGHUB功能失败:', error);
    res.status(500).json({ error: '获取功能列表失败', details: error.message });
  }
});

// 添加新RUNNINGHUB功能
router.post('/functions', async (req, res) => {
  try {
    const { id, name, icon, color, webappId, category, description, defaultInputs } = req.body;
    
    // 验证必填字段
    if (!id || !name || !icon || !color || !webappId) {
      return res.status(400).json({
        error: '缺少必填字段',
        details: 'id, name, icon, color, webappId 为必填项'
      });
    }
    
    const settings = JsonStorage.load(config.SETTINGS_FILE, {});
    const functions = settings.runningHubFunctions || [];
    
    // 检查ID是否已存在
    if (functions.find(f => f.id === id)) {
      return res.status(400).json({
        error: '功能ID已存在',
        details: '请使用不同的ID'
      });
    }
    
    // 添加新功能
    const newFunction = {
      id,
      name,
      icon,
      color,
      webappId,
      category: category || '其他',
      description: description || '',
      defaultInputs: defaultInputs || {}
    };
    
    functions.push(newFunction);
    settings.runningHubFunctions = functions;
    
    JsonStorage.save(config.SETTINGS_FILE, settings);
    
    res.json({
      success: true,
      message: '功能添加成功',
      data: newFunction
    });
  } catch (error) {
    console.error('添加RUNNINGHUB功能失败:', error);
    res.status(500).json({ error: '添加功能失败', details: error.message });
  }
});

// 更新RUNNINGHUB功能
router.put('/functions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const settings = JsonStorage.load(config.SETTINGS_FILE, {});
    const functions = settings.runningHubFunctions || [];
    
    // 查找功能索引
    const functionIndex = functions.findIndex(f => f.id === id);
    if (functionIndex === -1) {
      return res.status(404).json({
        error: '功能不存在',
        details: `未找到ID为 ${id} 的功能`
      });
    }
    
    // 更新功能（保留ID，不允许修改）
    const { id: _, ...allowedUpdates } = updateData;
    functions[functionIndex] = { ...functions[functionIndex], ...allowedUpdates };
    
    settings.runningHubFunctions = functions;
    JsonStorage.save(config.SETTINGS_FILE, settings);
    
    res.json({
      success: true,
      message: '功能更新成功',
      data: functions[functionIndex]
    });
  } catch (error) {
    console.error('更新RUNNINGHUB功能失败:', error);
    res.status(500).json({ error: '更新功能失败', details: error.message });
  }
});

// 删除RUNNINGHUB功能
router.delete('/functions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const settings = JsonStorage.load(config.SETTINGS_FILE, {});
    const functions = settings.runningHubFunctions || [];
    
    // 查找要删除的功能
    const functionToDelete = functions.find(f => f.id === id);
    if (!functionToDelete) {
      return res.status(404).json({
        error: '功能不存在',
        details: `未找到ID为 ${id} 的功能`
      });
    }
    
    // 过滤掉要删除的功能
    const updatedFunctions = functions.filter(f => f.id !== id);
    settings.runningHubFunctions = updatedFunctions;
    
    JsonStorage.save(config.SETTINGS_FILE, settings);
    
    res.json({
      success: true,
      message: '功能删除成功',
      deletedFunction: functionToDelete
    });
  } catch (error) {
    console.error('删除RUNNINGHUB功能失败:', error);
    res.status(500).json({ error: '删除功能失败', details: error.message });
  }
});

// 获取节点信息
router.post('/node-info', async (req, res) => {
  try {
    const { webappId } = req.body;
    
    if (!webappId) {
      return res.status(400).json({ error: 'WebAppId不能为空', code: 'MISSING_WEBAPP_ID' });
    }
    
    // 使用统一的API Key配置
    const apiKey = config.RUNNINGHUB.DEFAULT_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ 
        error: 'API Key未配置', 
        code: 'API_KEY_NOT_CONFIGURED',
        details: '请检查data/app-config.json中的apis.runninghub.apiKey配置'
      });
    }
    
    console.log('[RunningHub] 收到节点信息请求:', { webappId: webappId.substring(0, 8) + '...' });
    
    const result = await runningHubService.getNodeInfo(webappId, apiKey);
    
    // 检查是否有节点数据
    const hasNodes = result?.data?.nodeInfoList?.length > 0 || 
                     result?.nodeInfoList?.length > 0 || 
                     result?.data?.nodeList?.length > 0;
    
    res.json({
      success: true,
      hasNodes: !!hasNodes,
      nodeCount: result?.data?.nodeInfoList?.length || result?.nodeInfoList?.length || 0,
      data: result
    });
  } catch (error) {
    console.error('获取节点信息失败:', error.message);
    res.status(500).json({ 
      error: '获取节点信息失败', 
      details: error.message,
      code: 'GET_NODE_INFO_FAILED'
    });
  }
});

// 提交任务
router.post('/submit-task', async (req, res) => {
  try {
    const { webappId, nodeInfoList2, apiKey } = req.body;
    const result = await runningHubService.submitTask(webappId, nodeInfoList2, apiKey);
    res.json(result);
  } catch (error) {
    console.error('提交任务失败:', error);
    res.status(500).json({ error: '提交任务失败', details: error.message });
  }
});

// 运行 AI 应用 (兼容前端调用) - 使用 submit-task 的别名
router.post('/ai-app-run', async (req, res) => {
  try {
    const { webappId, nodeInfoList, cost, apiKey } = req.body;
    console.log('[RunningHub] 收到 AI 应用运行请求:', { 
      webappId, 
      nodeCount: nodeInfoList?.length, 
      cost,
      apiKeyProvided: !!apiKey 
    });
    
    // 优先使用请求体中的apiKey，回退到配置文件
    const settings = JsonStorage.load(config.SETTINGS_FILE, {});
    const settingsApiKey = settings.runningHub?.apiKey;
    const effectiveApiKey = apiKey || settingsApiKey;
    
    console.log('[RunningHub] 使用APIKey:', effectiveApiKey ? effectiveApiKey.substring(0, 8) + '...' : '未提供');
    
    if (!effectiveApiKey) {
      return res.status(400).json({ 
        success: false, 
        error: 'API Key未配置，请先在设置中配置 RunningHub API Key' 
      });
    }
    
    // 调用现有的 submitTask 方法
    const result = await runningHubService.submitTask(webappId, nodeInfoList, effectiveApiKey);
    
    console.log('[RunningHub] 任务提交响应:', JSON.stringify(result, null, 2));
    
    // 检查错误码
    if (result.code === 805) {
      // 任务失败 - APIKEY_INVALID_NODE_INFO 错误
      return res.status(400).json({
        success: false,
        error: 'API Key无效或节点信息错误',
        details: result.message || result.msg || result.data
      });
    }
    
    if (result.code === 0) {
      res.json({
        success: true,
        data: {
          taskId: result.data?.taskId,
          outputs: []
        }
      });
    } else {
      res.json({
        success: false,
        error: result.msg || result.message || '任务提交失败',
        code: result.code,
        details: result.data
      });
    }
  } catch (error) {
    console.error('运行 AI 应用失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '运行 AI 应用失败', 
      details: error.message 
    });
  }
});

// 上传文件 - 使用multer中间件处理单个文件上传
router.post('/upload-file', upload.single('file'), async (req, res) => {
  try {
    // 使用统一的API Key配置，不再从formData中读取
    const apiKey = config.RUNNINGHUB.DEFAULT_API_KEY;
    const fileType = req.body.fileType || 'input';
    
    console.log('[RunningHub] 收到文件上传请求:', { 
      fileName: req.file?.originalname,
      fileType,
      fileSize: req.file?.size,
      hasBuffer: !!req.file?.buffer,
      hasApiKey: !!apiKey
    });
    
    // 验证API Key
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'API Key未配置',
        details: '请检查data/app-config.json中的apis.runninghub.apiKey配置',
        code: 'API_KEY_NOT_CONFIGURED'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: '文件上传失败', 
        details: '未提供文件',
        code: 'NO_FILE_PROVIDED'
      });
    }
    
    // 验证文件
    const file = req.file;
    if (!file.buffer || file.buffer.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: '文件内容为空', 
        details: '文件Buffer为空或无效',
        code: 'EMPTY_FILE_BUFFER'
      });
    }
    
    // 验证文件大小
    if (file.size > 30 * 1024 * 1024) { // 30MB限制
      return res.status(400).json({ 
        success: false, 
        error: '文件过大', 
        details: '文件大小不能超过30MB',
        code: 'FILE_TOO_LARGE',
        maxSize: '30MB',
        currentSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`
      });
    }
    
    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!file.mimetype || !allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ 
        success: false, 
        error: '不支持的文件类型', 
        details: `文件类型 ${file.mimetype} 不支持`,
        code: 'UNSUPPORTED_FILE_TYPE',
        allowedTypes: allowedTypes,
        currentType: file.mimetype
      });
    }
    
    const fileContent = file.buffer;
    const fileName = file.originalname;
    
    console.log('[RunningHub] 开始上传到RunningHub:', { 
      fileName, 
      fileType, 
      size: file.size,
      mimeType: file.mimetype
    });
    
    console.log('[RunningHub] 调用uploadFileFromBuffer前检查:', {
      serviceType: typeof runningHubService,
      uploadMethodType: typeof runningHubService.uploadFileFromBuffer,
      servicePrototype: Object.getPrototypeOf(runningHubService),
      methodExists: 'uploadFileFromBuffer' in runningHubService
    });
    
    const result = await runningHubService.uploadFileFromBuffer(fileContent, fileName, fileType, apiKey);
    
    console.log('[RunningHub] 文件上传结果:', { 
      fileName, 
      success: result.success,
      hasFilePath: !!result.filePath,
      filePath: result.filePath,
      dataKeys: Object.keys(result.data || {}),
      thirdPartyKeys: Object.keys(result.thirdPartyResponse || {})
    });
    
    // 返回标准化的响应格式
    const response = {
      success: result.success !== false,
      message: result.message || (result.success ? '文件上传成功' : '文件上传失败'),
      data: {
        filePath: result.filePath,
        originalName: fileName,
        fileSize: file.size,
        mimeType: file.mimetype
      },
      thirdPartyResponse: result.thirdPartyResponse || result.data,
      // 为了兼容性，也保留原来的格式
      filePath: result.filePath,
      originalResponse: result
    };
    
    console.log('[RunningHub] 返回给前端的响应:', {
      success: response.success,
      message: response.message,
      hasFilePath: !!response.data.filePath,
      filePath: response.data.filePath
    });
    
    res.json(response);
  } catch (error) {
    console.error('[RunningHub] 文件上传失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '文件上传失败', 
      details: error.message,
      code: 'UPLOAD_FAILED',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 获取任务状态
router.get('/task-status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { apiKey, webappId } = req.query;
    
    console.log('[RunningHub] 轮询任务状态:', { 
      taskId, 
      apiKey: apiKey ? apiKey.substring(0, 8) + '...' : '未提供',
      webappId: webappId || '未提供'
    });
    
    const result = await runningHubService.pollTaskStatusOnce(taskId, apiKey, webappId);
    
    console.log('[RunningHub] 轮询任务状态结果:', {
      taskId,
      code: result.code,
      message: result.message || result.msg,
      hasData: !!result.data
    });
    
    res.json(result);
  } catch (error) {
    console.error('获取任务状态失败:', error);
    res.status(500).json({ 
      error: '获取任务状态失败', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 保存节点并执行任务（简化版，避免长时间轮询）
router.post('/save_nodes', async (req, res) => {
  try {
    const { webappId, nodeInfoList2, apiKey } = req.body;
    
    console.log('[RunningHub] save_nodes收到请求:', {
      webappId,
      nodeCount: nodeInfoList2?.length,
      apiKeyProvided: !!apiKey
    });
    
    // 优先使用请求体中的apiKey，回退到后端配置
    const backendConfig = config.RUNNINGHUB;
    const settingsApiKey = backendConfig.DEFAULT_API_KEY;
    const effectiveApiKey = apiKey || settingsApiKey;
    const effectiveWebappId = webappId || backendConfig.DEFAULT_WEBAPP_ID;
    
    if (!effectiveApiKey) {
      return res.status(400).json({ 
        success: false, 
        error: 'API Key未配置' 
      });
    }
    
    console.log('[RunningHub] 使用配置:', {
      effectiveApiKey: effectiveApiKey ? effectiveApiKey.substring(0, 8) + '...' : '未提供',
      effectiveWebappId: effectiveWebappId || '未提供'
    });
    
    // 1. 提交任务
    console.log('[RunningHub] 提交任务到RunningHub...');
    
    let submitResult;
    try {
      submitResult = await runningHubService.submitTask(effectiveWebappId, nodeInfoList2, effectiveApiKey);
      console.log('[RunningHub] submitTask调用成功');
    } catch (submitError) {
      console.error('[RunningHub] submitTask调用失败:', submitError.message);
      console.error('[RunningHub] submitTask错误堆栈:', submitError.stack);
      return res.status(500).json({ 
        success: false, 
        error: '任务提交异常', 
        details: submitError.message,
        stack: submitError.stack 
      });
    }
    
    if (submitResult.code !== 0) {
      console.error('[RunningHub] 任务提交失败:', submitResult);
      return res.json({
        success: false,
        message: submitResult.msg || submitResult.message || '任务提交失败',
        data: submitResult
      });
    }
    
    const taskId = submitResult.data?.taskId;
    console.log('[RunningHub] 任务提交成功, taskId:', taskId);
    
    // 2. 持续轮询任务状态直到完成或失败（按照官方Python实现）
    console.log('[RunningHub] 开始持续轮询任务状态...');
    
    try {
      const maxPolls = 60; // 最多轮询60次 (10分钟)
      const pollInterval = 10000; // 10秒间隔
      
      for (let pollCount = 1; pollCount <= maxPolls; pollCount++) {
        const pollResult = await runningHubService.pollTaskStatusOnce(taskId, effectiveApiKey, effectiveWebappId);
        
        console.log(`[RunningHub] 第${pollCount}次轮询结果:`, {
          code: pollResult.code,
          message: pollResult.message || pollResult.msg
        });
        
        if (pollResult.code === 0 && pollResult.data) {
          // 任务成功完成
          console.log('[RunningHub] 任务执行成功!', pollResult.data);
          return res.json({
            success: true,
            taskId: taskId,
            message: '任务执行成功',
            data: pollResult.data,
            thirdPartyResponse: pollResult
          });
        }
        
        if (pollResult.code === 805) {
          // 任务失败
          console.error('[RunningHub] 任务执行失败:', pollResult.message || pollResult.msg);
          return res.json({
            success: false,
            message: pollResult.message || pollResult.msg || '任务执行失败',
            taskId: taskId,
            data: pollResult
          });
        }
        
        // 任务仍在进行中 (804: 运行中, 813: 排队中)
        if (pollResult.code === 804 || pollResult.code === 813) {
          const statusText = pollResult.code === 804 ? '运行中' : '排队中';
          console.log(`[RunningHub] 任务${statusText}，继续轮询...`);
          
          // 等待后继续
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          continue;
        }
        
        // 未知状态
        console.warn('[RunningHub] 任务状态未知:', pollResult);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        continue;
      }
      
      // 轮询超时
      console.error('[RunningHub] 轮询超时，任务未完成');
      return res.json({
        success: false,
        message: '任务执行超时，请稍后重试',
        taskId: taskId,
        error: 'TIMEOUT'
      });
      
    } catch (pollError) {
      console.error('[RunningHub] 轮询失败:', pollError.message);
      return res.json({
        success: false,
        message: `轮询失败: ${pollError.message}`,
        taskId: taskId,
        error: 'POLL_ERROR'
      });
    }
    
  } catch (error) {
    console.error('[RunningHub] save_nodes执行失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '任务执行失败', 
      details: error.message 
    });
  }
});

module.exports = router;
