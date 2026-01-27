const express = require('express');
const router = express.Router();
const multer = require('multer');
const runningHubService = require('../utils/runningHubService');
const JsonStorage = require('../utils/jsonStorage');
const config = require('../config');

// 配置multer用于文件上传
const upload = multer({
  limits: {
    fileSize: 30 * 1024 * 1024, // 最大30MB，符合RunningHub要求
  },
});

// 获取RunningHub配置
router.get('/config', async (req, res) => {
  try {
    const settings = JsonStorage.load(config.SETTINGS_FILE, {});
    res.json({
      webappId: settings.runningHub?.webappId || '',
      apiKey: settings.runningHub?.apiKey || '',
    });
  } catch (error) {
    console.error('获取RunningHub配置失败:', error);
    res.status(500).json({ error: '获取配置失败', details: error.message });
  }
});

// 保存RunningHub配置
router.post('/config', async (req, res) => {
  try {
    const { webappId, apiKey } = req.body;
    const settings = JsonStorage.load(config.SETTINGS_FILE, {});
    
    settings.runningHub = {
      webappId: webappId || '',
      apiKey: apiKey || '',
    };
    
    JsonStorage.save(config.SETTINGS_FILE, settings);
    res.json({ success: true, message: '配置保存成功' });
  } catch (error) {
    console.error('保存RunningHub配置失败:', error);
    res.status(500).json({ error: '保存配置失败', details: error.message });
  }
});

// 获取节点信息
router.post('/node-info', async (req, res) => {
  try {
    const { webappId, apiKey } = req.body;
    
    if (!webappId) {
      return res.status(400).json({ error: 'WebAppId不能为空', code: 'MISSING_WEBAPP_ID' });
    }
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API Key不能为空', code: 'MISSING_API_KEY' });
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
    const apiKey = req.body.apiKey || req.form?.apiKey;
    const fileType = req.body.fileType || 'input';
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: '文件上传失败', details: '未提供文件' });
    }
    
    const fileContent = req.file.buffer;
    const fileName = req.file.originalname;
    
    console.log('[RunningHub] 收到文件上传请求:', { fileName, fileType, size: req.file.size });
    
    const result = await runningHubService.uploadFileFromBuffer(fileContent, fileName, fileType, apiKey);
    res.json(result);
  } catch (error) {
    console.error('上传文件失败:', error);
    res.status(500).json({ success: false, error: '文件上传失败', details: error.message });
  }
});

// 获取任务状态
router.get('/task-status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { apiKey } = req.query;
    
    console.log('[RunningHub] 轮询任务状态:', { 
      taskId, 
      apiKey: apiKey ? apiKey.substring(0, 8) + '...' : '未提供' 
    });
    
    const result = await runningHubService.pollTaskStatus(taskId, apiKey);
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

// 保存节点并执行任务（包含后端轮询）- 参考官方API文档
router.post('/save_nodes', async (req, res) => {
  try {
    const { webappId, nodeInfoList2, apiKey } = req.body;
    
    console.log('[RunningHub] save_nodes收到请求:', {
      webappId,
      nodeCount: nodeInfoList2?.length,
      apiKeyProvided: !!apiKey
    });
    
    // 优先使用请求体中的apiKey，回退到配置文件
    const settings = JsonStorage.load(config.SETTINGS_FILE, {});
    const settingsApiKey = settings.runningHub?.apiKey;
    const effectiveApiKey = apiKey || settingsApiKey;
    
    if (!effectiveApiKey) {
      return res.status(400).json({ 
        success: false, 
        error: 'API Key未配置' 
      });
    }
    
    // 1. 提交任务
    console.log('[RunningHub] 提交任务到RunningHub...');
    const submitResult = await runningHubService.submitTask(webappId, nodeInfoList2, effectiveApiKey);
    
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
    
    // 2. 后端轮询任务状态（参考官方Python示例）
    console.log('[RunningHub] 开始轮询任务状态...');
    const timeout = 600; // 10分钟超时
    const startTime = Date.now();
    const pollInterval = 5000; // 5秒轮询间隔
    
    while (Date.now() - startTime < timeout * 1000) {
      const pollResult = await runningHubService.pollTaskStatusOnce(taskId, effectiveApiKey);
      
      console.log('[RunningHub] 轮询结果:', {
        code: pollResult.code,
        message: pollResult.message || pollResult.msg
      });
      
      if (pollResult.code === 0 && pollResult.data) {
        // 任务成功
        console.log('[RunningHub] 任务执行成功!');
        return res.json({
          success: true,
          taskId: taskId,
          message: '任务执行成功',
          thirdPartyResponse: pollResult,
          data: pollResult.data
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
      
      // 运行中或排队中，继续轮询
      const statusText = pollResult.code === 804 ? '运行中' : pollResult.code === 813 ? '排队中' : '处理中';
      console.log(`[RunningHub] 任务${statusText}，继续轮询...`);
      
      // 等待后继续轮询
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    // 超时
    console.error('[RunningHub] 任务轮询超时');
    return res.json({
      success: false,
      message: '任务执行超时（超过10分钟）',
      taskId: taskId
    });
    
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
