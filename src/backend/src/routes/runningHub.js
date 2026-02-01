const path = require('path');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const RunningHubService = require('../utils/runningHubService');
const JsonStorage = require('../utils/jsonStorage');
const config = require('../config');
const FileHelper = require('../utils/fileHelper');

// ============================================
// 错误码定义
// ============================================
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

// 创建RunningHubService实例
const runningHubService = new RunningHubService();

// 任务状态管理器：存储 taskId 到 webappId 的映射
const taskWebappMap = new Map();

console.log('[RunningHub] Service实例创建检查:', {
  serviceType: typeof runningHubService,
  hasUploadMethod: typeof runningHubService.uploadFileFromBuffer,
  constructorName: runningHubService.constructor.name,
  serviceKeys: Object.getOwnPropertyNames(Object.getPrototypeOf(runningHubService)).filter(key => key !== 'constructor')
});

// ============================================
// 统一响应格式
// ============================================

/**
 * 成功响应
 * @param {Response} res - Express Response 对象
 * @param {any} data - 响应数据
 * @param {string} [message] - 成功消息
 */
function successResponse(res, data, message = 'success') {
  return res.json({
    success: true,
    message,
    data
  });
}

/**
 * 错误响应
 * @param {Response} res - Express Response 对象
 * @param {string} errorCode - 错误码（ERROR_CODES 的键）
 * @param {any} [details] - 详细信息
 */
function errorResponse(res, errorCode, details = null) {
  const error = ERROR_CODES[errorCode] || ERROR_CODES.UNKNOWN_ERROR;
  const response = {
    success: false,
    code: errorCode,
    message: error.message,
    status: error.status
  };
  
  if (details) {
    response.details = typeof details === 'string' ? details : (details.message || JSON.stringify(details));
  }
  
  if (process.env.NODE_ENV === 'development') {
    response.debug = {
      timestamp: new Date().toISOString(),
      path: res.req?.path
    };
  }
  
  return res.status(error.status).json(response);
}

// ============================================
// 输入验证函数
// ============================================

/**
 * 验证 API Key 格式
 * @param {string} apiKey - API Key
 * @returns {boolean} 是否有效
 */
function validateApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') return false;
  return apiKey.trim().length >= 8;
}

/**
 * 验证 WebAppId 格式
 * @param {string} webappId - WebAppId
 * @returns {boolean} 是否有效
 */
function validateWebappId(webappId) {
  if (!webappId || typeof webappId !== 'string') return false;
  return /^\d+$/.test(webappId.trim());
}

/**
 * 验证节点信息列表
 * @param {Array} nodeInfoList - 节点信息列表
 * @returns {object} { valid: boolean, errors: string[] }
 */
function validateNodeInfoList(nodeInfoList) {
  const errors = [];
  
  if (!Array.isArray(nodeInfoList)) {
    return { valid: false, errors: ['nodeInfoList必须是数组'] };
  }
  
  if (nodeInfoList.length === 0) {
    errors.push('nodeInfoList不能为空');
  }
  
  nodeInfoList.forEach((node, index) => {
    if (!node.nodeId && !node.id) {
      errors.push(`节点 ${index}: 缺少nodeId或id字段`);
    }
    if (!node.fieldName) {
      errors.push(`节点 ${index}: 缺少fieldName字段`);
    }
  });
  
  return { valid: errors.length === 0, errors };
}

/**
 * 验证任务 ID 格式
 * @param {string} taskId - 任务 ID
 * @returns {boolean} 是否有效
 */
function validateTaskId(taskId) {
  if (!taskId || typeof taskId !== 'string') return false;
  return taskId.trim().length > 0;
}

/**
 * 验证请求体
 * @param {object} req - Express Request 对象
 * @param {string[]} requiredFields - 必填字段
 * @returns {object} { valid: boolean, errors: string[], body: object }
 */
function validateRequestBody(req, requiredFields) {
  const errors = [];
  const body = req.body;
  
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['请求体无效'], body: null };
  }
  
  requiredFields.forEach(field => {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      errors.push(`缺少必填字段: ${field}`);
    }
  });
  
  return { valid: errors.length === 0, errors, body };
}

// ============================================
// 统一配置管理工具函数
// ============================================

/**
 * 获取有效的 API Key（支持多来源）
 * @param {string} [requestApiKey] - 请求中的 API Key
 * @returns {object} { apiKey: string, source: string }
 */
function getEffectiveApiKey(requestApiKey) {
  const configApiKey = config.RUNNINGHUB.DEFAULT_API_KEY;
  
  if (requestApiKey) {
    return { apiKey: requestApiKey, source: 'request' };
  }
  if (configApiKey) {
    return { apiKey: configApiKey, source: 'config' };
  }
  return { apiKey: '', source: 'none' };
}

/**
 * 获取有效的 WebAppId（支持多来源）
 * @param {string} [requestWebappId] - 请求中的 WebAppId
 * @returns {object} { webappId: string, source: string }
 */
function getEffectiveWebappId(requestWebappId) {
  const configWebappId = config.RUNNINGHUB.DEFAULT_WEBAPP_ID;
  
  if (requestWebappId) {
    return { webappId: requestWebappId, source: 'request' };
  }
  if (configWebappId) {
    return { webappId: configWebappId, source: 'config' };
  }
  return { webappId: '', source: 'none' };
}

/**
 * 预处理节点列表，上传本地文件到 RunningHub
 * @param {Array} nodeInfoList - 节点信息列表
 * @param {string} apiKey - API Key
 * @returns {Promise<Array>} 处理后的节点列表
 */
async function preprocessNodeList(nodeInfoList, apiKey) {
  return Promise.all(
    nodeInfoList.map(async (node, index) => {
      const fieldValue = node.fieldValue || '';
      
      if (fieldValue.startsWith('/files/input/')) {
        console.log(`[RunningHub] 节点 ${index} 需要上传本地文件:`, fieldValue);
        
        try {
          const readResult = FileHelper.readFromUrl(fieldValue);
          if (!readResult.success) {
            console.error(`[RunningHub] 读取本地文件失败:`, fieldValue);
            return node;
          }
          
          const fileName = fieldValue.split('/').pop() || `file_${index}.jpg`;
          const uploadResult = await runningHubService.uploadFileFromBuffer(
            readResult.buffer, fileName, 'input', apiKey
          );
          
          if (uploadResult.filePath) {
            console.log(`[RunningHub] 本地文件上传成功:`, fieldValue, '->', uploadResult.filePath);
            return { ...node, fieldValue: uploadResult.filePath, uploadedToRemote: true };
          }
          return node;
        } catch (uploadError) {
          console.error(`[RunningHub] 上传本地文件失败:`, fieldValue, uploadError.message);
          return node;
        }
      }
      return node;
    })
  );
}

// ============================================
// 路由定义
// ============================================

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
            names: availableWebApps.map(app => app.name)
          });
        }
      } catch (error) {
        console.warn('[RunningHub] 读取app-config.json失败:', error.message);
      }
    }
    
    const response = {
      apiKey: apiKey || '',
      webappId: '', // 不再使用统一的webappId
      baseUrl: config.RUNNINGHUB.API_BASE_URL || 'https://www.runninghub.cn',
      enabled: !!apiKey, // 只要有API Key就启用
      configured: !!apiKey, // 只要有API Key就配置完成
      availableWebApps: availableWebApps,
      appConfigPath: appConfigPath
    };
    
    const { webappId: effectiveWebappId } = getEffectiveWebappId('');
    
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

// 根据功能ID获取节点信息（从前端接收功能ID，从配置查找webappId）
router.post('/node-info-by-function', async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: '功能ID不能为空', code: 'MISSING_FUNCTION_ID' });
    }

    // 从配置文件获取功能列表
    const functions = config.getRunningHubFunctions();
    const func = functions.find(f => f.id === id);

    if (!func) {
      return res.status(404).json({
        error: '功能不存在',
        code: 'FUNCTION_NOT_FOUND',
        details: `未找到ID为 ${id} 的功能`
      });
    }

    const webappId = func.webappId;
    const apiKey = config.RUNNINGHUB.DEFAULT_API_KEY;

    if (!apiKey) {
      return res.status(400).json({
        error: 'API Key未配置',
        code: 'API_KEY_NOT_CONFIGURED',
        details: '请检查data/app-config.json中的apis.runninghub.apiKey配置'
      });
    }

    console.log('[RunningHub] 根据功能ID获取节点信息:', {
      functionId: id,
      functionName: func.name,
      webappId: webappId.substring(0, 8) + '...'
    });

    const result = await runningHubService.getNodeInfo(webappId, apiKey);

    // 检查是否有节点数据
    const hasNodes = result?.data?.nodeInfoList?.length > 0 ||
                     result?.nodeInfoList?.length > 0 ||
                     result?.data?.nodeList?.length > 0;

    res.json({
      success: true,
      functionName: func.name,
      hasNodes: !!hasNodes,
      nodeCount: result?.data?.nodeInfoList?.length || 0,
      data: result.data
    });
  } catch (error) {
    console.error('[RunningHub] 根据功能ID获取节点信息失败:', error.message);
    res.status(500).json({
      error: '获取节点信息失败',
      details: error.message,
      code: 'GET_NODE_INFO_BY_FUNCTION_FAILED'
    });
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
    const { webappId, nodeInfoList2, apiKey: requestApiKey } = req.body;
    
    // 验证必填字段
    if (!nodeInfoList2) {
      return errorResponse(res, 'MISSING_REQUIRED_FIELD', '缺少 nodeInfoList2');
    }
    
    // 验证节点列表
    const nodeValidation = validateNodeInfoList(nodeInfoList2);
    if (!nodeValidation.valid) {
      return errorResponse(res, 'INVALID_NODE_INFO_LIST', nodeValidation.errors.join('; '));
    }
    
    const { apiKey: effectiveApiKey } = getEffectiveApiKey(requestApiKey);
    const { webappId: effectiveWebappId } = getEffectiveWebappId(webappId);
    
    if (!effectiveApiKey) {
      return errorResponse(res, 'API_KEY_NOT_CONFIGURED');
    }
    
    const result = await runningHubService.submitTask(effectiveWebappId, nodeInfoList2, effectiveApiKey);
    return successResponse(res, result);
  } catch (error) {
    console.error('提交任务失败:', error);
    return errorResponse(res, 'TASK_SUBMIT_FAILED', error.message);
  }
});

// 运行 AI 应用 (兼容前端调用) - 使用 submit-task 的别名
router.post('/ai-app-run', async (req, res) => {
  try {
    const { webappId, nodeInfoList, cost, apiKey: requestApiKey } = req.body;
    console.log('[RunningHub] 收到 AI 应用运行请求:', { 
      webappId, 
      nodeCount: nodeInfoList?.length, 
      cost,
      apiKeyProvided: !!requestApiKey 
    });
    
    // 使用统一函数获取有效的 API Key
    const { apiKey: effectiveApiKey } = getEffectiveApiKey(requestApiKey);
    const { webappId: effectiveWebappId } = getEffectiveWebappId(webappId);
    
    console.log('[RunningHub] 使用APIKey:', effectiveApiKey ? effectiveApiKey.substring(0, 8) + '...' : '未提供');
    
    if (!effectiveApiKey) {
      return errorResponse(res, 400, 'API_KEY_NOT_CONFIGURED', 'API Key未配置，请先在设置中配置 RunningHub API Key');
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

// 上传文件 - 保存到本地 input 目录
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
    
    console.log('[RunningHub] 保存文件到本地 input 目录:', { 
      fileName, 
      fileType, 
      size: file.size,
      mimeType: file.mimetype
    });
    
    // 保存到本地 input 目录
    const saveResult = FileHelper.saveToInput(fileContent, fileName);
    
    if (!saveResult.success) {
      return res.status(500).json({
        success: false,
        error: '保存文件失败',
        details: saveResult.error
      });
    }
    
    // 返回本地URL
    const response = {
      success: true,
      message: '文件上传成功',
      data: {
        localPath: saveResult.localPath,
        localUrl: saveResult.localUrl,
        originalName: fileName,
        fileSize: file.size,
        mimeType: file.mimetype
      }
    };
    
    console.log('[RunningHub] 文件保存成功:', {
      localUrl: saveResult.localUrl,
      originalName: fileName
    });
    
    res.json(response);
  } catch (error) {
    console.error('[RunningHub] 文件处理失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '文件处理失败', 
      details: error.message,
      code: 'FILE_PROCESS_FAILED',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 上传本地文件到 RunningHub
router.post('/upload-to-runninghub', async (req, res) => {
  try {
    const { localPath, fileType } = req.body;
    
    console.log('[RunningHub] 收到上传到RunningHub请求:', { localPath, fileType });
    
    if (!localPath) {
      return res.status(400).json({
        success: false,
        error: '本地文件路径不能为空',
        code: 'EMPTY_LOCAL_PATH'
      });
    }
    
    const apiKey = config.RUNNINGHUB.DEFAULT_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'API Key未配置',
        code: 'API_KEY_NOT_CONFIGURED'
      });
    }
    
    // 读取本地文件
    const readResult = FileHelper.readFromUrl(localPath);
    if (!readResult.success) {
      return res.status(400).json({
        success: false,
        error: '读取本地文件失败',
        details: readResult.error
      });
    }
    
    // 提取文件名
    const fileName = path.basename(localPath);
    const effectiveFileType = fileType || 'input';
    
    console.log('[RunningHub] 开始上传到RunningHub:', { fileName, fileType: effectiveFileType, size: readResult.buffer.length });
    
    // 上传到 RunningHub
    const uploadResult = await runningHubService.uploadFileFromBuffer(
      readResult.buffer,
      fileName,
      effectiveFileType,
      apiKey
    );
    
    console.log('[RunningHub] RunningHub上传结果:', uploadResult);
    
    if (uploadResult.success) {
      // RunningHub 返回的路径格式为 "api/xxx.jpg"
      // 保持原格式不变，因为提交任务时需要这个格式
      const runningHubPath = uploadResult.filePath;

      console.log('[RunningHub] 上传成功，路径:', runningHubPath);

      res.json({
        success: true,
        message: '上传到RunningHub成功',
        data: {
          localPath: localPath,
          runningHubPath: runningHubPath,  // 保持 api/ 前缀格式（用于显示）
          filePath: uploadResult.filePath,
          // 返回不含 api/ 前缀的文件名（用于提交任务）
          fileName: (uploadResult.data?.fileName || uploadResult.filePath || fileName).replace(/^api\//, ''),
          originalName: fileName
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: '上传到RunningHub失败',
        details: uploadResult.message
      });
    }
  } catch (error) {
    console.error('[RunningHub] 上传到RunningHub失败:', error);
    res.status(500).json({
      success: false,
      error: '上传失败',
      details: error.message
    });
  }
});


// 获取任务状态
router.get('/task-status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;

    // 验证 taskId
    if (!validateTaskId(taskId)) {
      return errorResponse(res, 'INVALID_TASK_ID');
    }

    // 从任务映射中获取 webappId
    const webappId = taskWebappMap.get(taskId);

    const apiKey = config.RUNNINGHUB.DEFAULT_API_KEY;

    console.log('[RunningHub] 任务状态查询:', {
      taskId,
      hasWebappId: !!webappId,
      hasApiKey: !!apiKey
    });

    if (!webappId) {
      return res.status(404).json({
        error: '任务不存在或已过期',
        code: 'TASK_NOT_FOUND'
      });
    }

    if (!apiKey) {
      return errorResponse(res, 'API_KEY_NOT_CONFIGURED');
    }

    const result = await runningHubService.pollTaskStatusOnce(taskId, apiKey, webappId);

    console.log('[RunningHub] 轮询任务状态结果:', {
      taskId,
      code: result.code,
      message: result.message || result.msg,
      hasData: !!result.data
    });

    // 任务完成后清除映射
    if (result.code === 0 || result.code === 805) {
      taskWebappMap.delete(taskId);
      console.log('[RunningHub] 已清除任务映射:', taskId);
    }

    return successResponse(res, result);
  } catch (error) {
    console.error('获取任务状态失败:', error);
    return errorResponse(res, 'TASK_STATUS_QUERY_FAILED', error.message);
  }
});

// 保存节点并执行任务（简化版，避免长时间轮询）
router.post('/save_nodes', async (req, res) => {
  try {
    const { id, nodeInfoList2 } = req.body;

    if (!id) {
      return errorResponse(res, 'MISSING_REQUIRED_FIELD', '缺少功能ID');
    }

    // 从配置文件获取功能列表，查找对应的 webappId
    const functions = config.getRunningHubFunctions();
    const func = functions.find(f => f.id === id);

    if (!func) {
      return res.status(404).json({
        success: false,
        error: '功能不存在',
        code: 'FUNCTION_NOT_FOUND',
        details: `未找到ID为 ${id} 的功能`
      });
    }

    const webappId = func.webappId;
    const apiKey = config.RUNNINGHUB.DEFAULT_API_KEY;

    if (!apiKey) {
      return errorResponse(res, 'API_KEY_NOT_CONFIGURED');
    }

    console.log('[RunningHub] save_nodes收到请求:', {
      functionId: id,
      functionName: func.name,
      webappId: webappId.substring(0, 8) + '...',
      nodeCount: nodeInfoList2?.length
    });
    
// 预处理：检查并上传本地文件到 RunningHub
    console.log('[RunningHub] 检查需要上传的本地文件...');
    const processedNodeInfoList = await preprocessNodeList(nodeInfoList2, apiKey);

    console.log('[RunningHub] 预处理完成，准备提交任务');

    // 1. 提交任务
    console.log('[RunningHub] 提交任务到RunningHub...');

    let submitResult;
    try {
      submitResult = await runningHubService.submitTask(webappId, processedNodeInfoList, apiKey);
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

    // 存储 taskId 到 webappId 的映射
    taskWebappMap.set(taskId, webappId);
    console.log('[RunningHub] 已存储任务映射:', { taskId, webappId: webappId.substring(0, 8) + '...' });

    // 2. 持续轮询任务状态直到完成或失败（按照官方Python实现）
    console.log('[RunningHub] 开始持续轮询任务状态...');

    try {
      const maxPolls = 60; // 最多轮询60次 (10分钟)
      const pollInterval = 10000; // 10秒间隔

       for (let pollCount = 1; pollCount <= maxPolls; pollCount++) {
        console.log(`[RunningHub] 🔍 诊断 - 轮询任务状态:`, {
          taskId,
          apiKey: apiKey ? apiKey.substring(0, 8) + '...' : '为空或未定义',
          webappId: webappId || '未提供'
        });

        const pollResult = await runningHubService.pollTaskStatusOnce(taskId, apiKey, webappId);
        
        console.log(`[RunningHub] 第${pollCount}次轮询结果:`, {
          code: pollResult.code,
          message: pollResult.message || pollResult.msg
        });
        
        if (pollResult.code === 0 && pollResult.data) {
          // 任务成功完成
          console.log('[RunningHub] 任务执行成功!', pollResult.data);

          // 保存任务结果到本地 output 目录
          const outputData = pollResult.data;
          const localOutput = {
            images: [],
            videos: [],
            files: [],
            message: outputData.message
          };

          // 处理图片结果
          if (outputData.images && Array.isArray(outputData.images)) {
            for (const imageUrl of outputData.images) {
              const downloadResult = await FileHelper.downloadAndSave(imageUrl, 'output');
              if (downloadResult.success) {
                localOutput.images.push(downloadResult.localUrl);
                console.log('[RunningHub] 保存结果图片:', downloadResult.localUrl);
              } else {
                // 如果下载失败，使用原始 URL
                localOutput.images.push(imageUrl);
                console.warn('[RunningHub] 保存图片失败，使用原始URL:', imageUrl);
              }
            }
          }

          // 处理视频结果
          if (outputData.videos && Array.isArray(outputData.videos)) {
            for (const videoUrl of outputData.videos) {
              const downloadResult = await FileHelper.downloadAndSave(videoUrl, 'output');
              if (downloadResult.success) {
                localOutput.videos.push(downloadResult.localUrl);
                console.log('[RunningHub] 保存结果视频:', downloadResult.localUrl);
              } else {
                localOutput.videos.push(videoUrl);
              }
            }
          }

           // 处理文件结果
          if (outputData.files && Array.isArray(outputData.files)) {
            for (const fileUrl of outputData.files) {
              const downloadResult = await FileHelper.downloadAndSave(fileUrl, 'output');
              if (downloadResult.success) {
                localOutput.files.push(downloadResult.localUrl);
              } else {
                localOutput.files.push(fileUrl);
              }
            }
          }

          // 处理 results 数组（RunningHub 新格式）
          if (outputData.results && Array.isArray(outputData.results)) {
            console.log('[RunningHub] 检测到 results 格式，共 ' + outputData.results.length + ' 个结果');
            for (const item of outputData.results) {
              if (item.url) {
                const ext = item.url.split('/').pop()?.split('.').pop() || item.outputType?.toLowerCase() || '';
                const downloadResult = await FileHelper.downloadAndSave(item.url, 'output');
                if (downloadResult.success) {
                  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) {
                    localOutput.images.push(downloadResult.localUrl);
                    console.log('[RunningHub] 保存结果图片:', downloadResult.localUrl);
                  } else if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) {
                    localOutput.videos.push(downloadResult.localUrl);
                    console.log('[RunningHub] 保存结果视频:', downloadResult.localUrl);
                  } else {
                    localOutput.files.push(downloadResult.localUrl);
                    console.log('[RunningHub] 保存结果文件:', downloadResult.localUrl);
                  }
                } else {
                  // 下载失败，使用原始 URL
                  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) {
                    localOutput.images.push(item.url);
                  } else if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) {
                    localOutput.videos.push(item.url);
                  } else {
                    localOutput.files.push(item.url);
                  }
                  console.warn('[RunningHub] 保存失败，使用原始URL:', item.url);
                }
              }
            }
          }

          // 返回结果，将本地路径添加到响应中
          const responseData = {
            ...outputData,
            localImages: localOutput.images,
            localVideos: localOutput.videos,
            localFiles: localOutput.files
          };

          return res.json({
            success: true,
            taskId: taskId,
            message: '任务执行成功',
            data: responseData,
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
