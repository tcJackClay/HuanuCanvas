const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const config = require('../config');

class RunningHubService {
  constructor() {
    // 确保使用HTTPS协议
    this.apiBaseUrl = config.RUNNINGHUB.API_BASE_URL.replace('http://', 'https://');
    this.defaultApiKey = config.RUNNINGHUB.DEFAULT_API_KEY;
    this.defaultWebappId = config.RUNNINGHUB.DEFAULT_WEBAPP_ID;
    
    console.log('[RunningHub] Service初始化:', {
      apiBaseUrl: this.apiBaseUrl,
      hasApiKey: !!this.defaultApiKey,
      hasWebappId: !!this.defaultWebappId
    });
  }

  /**
   * 发送HTTP请求到RunningHub API (按照官方Python实现简化)
   * @param {string} endpoint - API端点
   * @param {object} data - 请求数据
   * @param {string} apiKey - API密钥
   * @param {string} method - HTTP方法 (GET或POST)
   * @returns {Promise<object>} - API响应
   */
  async sendRequest(endpoint, data, apiKey, method = 'POST') {
    const effectiveApiKey = apiKey || this.defaultApiKey;
    const url = `${this.apiBaseUrl}${endpoint}`;
    
    console.log(`[RunningHub] ${method} ${endpoint}`);

    return new Promise((resolve, reject) => {
      const options = {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${effectiveApiKey}`,
          'Host': 'www.runninghub.cn'
        }
      };

      const req = https.request(url, options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            console.log(`[RunningHub] 响应数据:`, parsed);
            resolve(parsed);
          } catch (e) {
            reject(new Error(`响应解析失败: ${responseData}`));
          }
        });
      });

      req.on('error', (error) => {
        console.error(`[RunningHub] 请求失败:`, error);
        reject(error);
      });
      
      if (method === 'POST' && data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  /**
   * 清理节点信息，只保留RunningHub API需要的字段
   * @param {Array} nodeInfoList - 原始节点信息列表
   * @returns {Array} - 清理后的节点信息列表
   */
  cleanNodeInfoList(nodeInfoList) {
    console.log('[RunningHub] 🔍 cleanNodeInfoList开始, 输入类型:', typeof nodeInfoList, '是否为数组:', Array.isArray(nodeInfoList));
    
    if (!Array.isArray(nodeInfoList)) {
      console.warn('[RunningHub] cleanNodeInfoList: 输入不是数组', nodeInfoList);
      return [];
    }
    
    console.log('[RunningHub] 🔍 开始处理', nodeInfoList.length, '个节点');
    
    const cleaned = nodeInfoList.map((node, index) => {
      console.log(`[RunningHub] 处理节点 ${index}:`, JSON.stringify(node, null, 2));
      
      const result = {
        nodeId: node.nodeId || node.id || 'unknown',
        fieldName: node.fieldName || 'image',  // 默认为image字段
        fieldValue: node.fieldValue || node.widgets_values?.[0] || '',
        description: node.description || ''
      };
      
      console.log(`[RunningHub] 节点 ${index} 处理结果:`, JSON.stringify(result, null, 2));
      return result;
    });
    
    console.log('[RunningHub] 🔍 cleanNodeInfoList调试:', {
      inputCount: nodeInfoList.length,
      outputCount: cleaned.length,
      fileNodes: cleaned.filter(n => {
        const hasImageField = n.fieldName && (n.fieldName === 'image' || n.fieldName === 'input_image' || n.fieldName.includes('image'));
        console.log(`[RunningHub] 检查节点 ${n.nodeId}, fieldName: ${n.fieldName}, 包含图像字段: ${hasImageField}`);
        return hasImageField;
      }).map(n => ({
        nodeId: n.nodeId,
        fieldName: n.fieldName,
        fieldValue: n.fieldValue,
        fieldValueLength: n.fieldValue?.length || 0,
        fieldValuePreview: n.fieldValue ? (n.fieldValue.substring(0, 100) + (n.fieldValue.length > 100 ? '...' : '')) : null
      }))
    });
    
    return cleaned;
  }

  /**
   * 提交RunningHub任务
   * @param {string} webappId - 应用ID
   * @param {Array} nodeInfoList2 - 节点信息列表
   * @param {string} apiKey - API密钥
   * @returns {Promise<object>} - 任务结果
   */
  async submitTask(webappId, nodeInfoList2, apiKey) {
    try {
      const effectiveApiKey = apiKey || this.defaultApiKey;
      const effectiveWebappId = webappId || this.defaultWebappId;
      
      // 清理节点信息，只保留RunningHub API需要的字段
      const cleanedNodeInfoList = this.cleanNodeInfoList(nodeInfoList2);
      
      console.log('[RunningHub] 原始节点信息:', JSON.stringify(nodeInfoList2, null, 2));
      console.log('[RunningHub] 清理后的节点信息:', JSON.stringify(cleanedNodeInfoList, null, 2));
      
      // 根据RunningHub官方API文档，webappId保持字符串格式以避免JavaScript Number精度丢失
      const webappIdStr = effectiveWebappId.toString();
      
      // 根据API文档，提交任务的数据结构
      const requestData = {
        webappId: webappIdStr,
        nodeInfoList: cleanedNodeInfoList,
        apiKey: effectiveApiKey,
      };
      console.log('[RunningHub] 🚨 最终提交给RunningHub的数据:', JSON.stringify(requestData, null, 2));
      
      // 根据文档，提交任务的端点是/task/openapi/ai-app/run
      const response = await this.sendRequest('/task/openapi/ai-app/run', requestData, apiKey);
      console.log('[RunningHub] 任务提交响应:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error('[RunningHub] 提交任务失败:', error.message);
      throw error;
    }
  }

  /**
   * 单次轮询任务状态
   * @param {string} taskId - 任务ID
   * @param {string} apiKey - API密钥
   * @param {string} webappId - 应用ID (可选，但建议提供)
   * @returns {Promise<object>} - 轮询结果
   */
  async pollTaskStatusOnce(taskId, apiKey, webappId = null) {
    try {
      const effectiveApiKey = apiKey || this.defaultApiKey;
      const effectiveWebappId = webappId || this.defaultWebappId;
      
      const requestData = {
        taskId: taskId,
        apiKey: effectiveApiKey,
      };
      
      // 按照官方Python实现，简化参数处理
      console.log('[RunningHub] 查询任务状态:', { taskId, hasApiKey: !!effectiveApiKey });
      
      // 注意：任务状态查询可能需要不同的处理方式
      // 暂时使用相同的认证方式，但可能需要不同的端点
      const response = await this.sendRequest('/task/openapi/status', requestData, apiKey);
      
      // 检查响应中的错误
      if (response.code === 805 || response.error?.includes('APIKEY')) {
        console.error('[RunningHub] API密钥错误:', response);
        const errorMsg = this.getDetailedErrorMessage(response);
        throw new Error(errorMsg);
      }
      
      return response;
    } catch (error) {
      console.error('[RunningHub] 轮询任务状态失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取详细的错误信息
   * @param {object} response - API响应
   * @returns {string} - 详细错误信息
   */
  getDetailedErrorMessage(response) {
    // 按照官方Python实现简化错误处理
    const errorCode = response.code;
    const errorMessage = response.msg || response.message || '未知错误';
    
    switch (errorCode) {
      case 805:
        const failedReason = response.data?.failedReason;
        if (failedReason) {
          console.error(`❌ 任务失败！节点 ${failedReason.node_name} 失败原因: ${failedReason.exception_message}`);
          console.error("Traceback:", failedReason.traceback);
        }
        return `任务执行失败: ${errorMessage}`;
      
      case 404:
        return `WebApp ID错误: ${errorMessage}`;
      
      case 403:
        return `权限不足: ${errorMessage}`;
      
      default:
        return `任务执行失败 (${errorCode}): ${errorMessage}`;
    }
  }

  /**
   * 从RunningHub响应中提取文件路径
   * @param {object} response - RunningHub响应
   * @returns {string|null} - 文件路径
   */
  extractFilePath(response) {
    // 根据RunningHub官方API文档，正确路径查找顺序
    const possiblePaths = [
      // 优先检查 RunningHub 实际返回的字段 (最可能的正确格式)
      response?.thirdPartyResponse?.data?.fileName,
      response?.thirdPartyResponse?.data?.filePath,
      response?.thirdPartyResponse?.data?.path,
      response?.thirdPartyResponse?.data?.url,
      
      // 检查根级别的字段 (兼容格式)
      response?.data?.fileName,
      response?.data?.filePath,
      response?.data?.path,
      response?.data?.url,
      
      // 检查其他可能的字段 (最后的备选)
      response?.fileName,
      response?.filePath,
      response?.path,
      response?.url
    ];
    
    console.log('[RunningHub] 🔍 开始提取文件路径，响应结构分析:', {
      responseType: typeof response,
      hasThirdPartyResponse: !!response?.thirdPartyResponse,
      thirdPartyResponseType: typeof response?.thirdPartyResponse,
      hasData: !!response?.data,
      dataType: typeof response?.data,
      responseKeys: Object.keys(response || {}),
      thirdPartyKeys: Object.keys(response?.thirdPartyResponse || {}),
      dataKeys: Object.keys(response?.data || {}),
      tryingPaths: possiblePaths.map((path, i) => `${i}: ${path}`).filter(Boolean)
    });
    
    // 详细记录每个可能的路径值
    possiblePaths.forEach((path, index) => {
      const hasValue = !!(path && typeof path === 'string' && path.trim() !== '');
      console.log(`[RunningHub] 路径尝试 ${index}: ${path || 'undefined/null'} ${hasValue ? '✅' : '❌'}`);
    });
    
    for (const path of possiblePaths) {
      if (path && typeof path === 'string' && path.trim() !== '') {
        const hasApiPrefix = path.startsWith('api/');
        console.log(`[RunningHub] ✅ 成功提取到文件路径: ${path}`);
        console.log(`[RunningHub] 📊 路径分析:`, {
          pathLength: path.length,
          hasApiPrefix: hasApiPrefix,
          isAbsoluteUrl: path.startsWith('http'),
          pathType: typeof path
        });
        
        // 清理不必要的 "api/" 前缀，确保传递给RunningHub的路径格式正确
        let cleanedPath = path;
        if (hasApiPrefix) {
          console.log(`[RunningHub] 🧹 清理路径前缀: ${path} → ${cleanedPath.substring(4)}`);
          cleanedPath = cleanedPath.substring(4);
        }
        
        console.log(`[RunningHub] 📋 最终返回的清理后路径: ${cleanedPath}`);
        return cleanedPath;
      }
    }
    
    console.error('[RunningHub] ❌ 未找到有效的文件路径，详细分析:', {
      fullResponse: JSON.stringify(response, null, 2),
      attemptedPaths: possiblePaths,
      responseStructure: {
        hasResponse: !!response,
        responseKeys: Object.keys(response || {}),
        hasThirdPartyResponse: !!response?.thirdPartyResponse,
        thirdPartyKeys: Object.keys(response?.thirdPartyResponse || {}),
        hasData: !!response?.data,
        dataKeys: Object.keys(response?.data || {})
      },
      possibleIssues: [
        'RunningHub API响应格式可能已更改',
        '文件路径字段名可能不正确',
        '响应可能包含嵌套结构'
      ]
    });
    return null;
  }

  /**
   * 上传文件到RunningHub (按照官方Python实现简化)
   * @param {Buffer} fileBuffer - 文件内容
   * @param {string} fileName - 文件名
   * @param {string} fileType - 文件类型
   * @param {string} apiKey - API密钥
   * @returns {Promise<object>} - 上传结果
   */
  async uploadFileFromBuffer(fileBuffer, fileName, fileType, apiKey) {
    try {
      const effectiveApiKey = apiKey || this.defaultApiKey;
      
      console.log('[RunningHub] 开始上传文件:', { 
        fileName, 
        fileType, 
        size: fileBuffer.length,
        apiKey: effectiveApiKey ? effectiveApiKey.substring(0, 8) + '...' : '未提供'
      });

      // 构建简单的表单数据 (按照官方Python实现)
      const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;
      const formData = [
        `--${boundary}`,
        `Content-Disposition: form-data; name="file"; filename="${fileName}"`,
        `Content-Type: application/octet-stream`,
        ``,
        fileBuffer.toString(),
        `--${boundary}`,
        `Content-Disposition: form-data; name="fileType"`,
        ``,
        fileType,
        `--${boundary}`,
        `Content-Disposition: form-data; name="apiKey"`,
        ``,
        effectiveApiKey,
        `--${boundary}--`
      ].join('\r\n');
      
      // 直接调用官方API端点
      const url = `${this.apiBaseUrl}/task/openapi/upload`;
      
      return await this.uploadWithSimpleRequest(url, formData, boundary);
    } catch (error) {
      console.error('[RunningHub] 文件上传失败:', error);
      throw error;
    }
  }

  async uploadWithSimpleRequest(url, formData, boundary) {
    return new Promise((resolve, reject) => {
      const options = {
        method: 'POST',
        headers: {
          'Host': 'www.runninghub.cn',
          'Content-Type': `multipart/form-data; boundary=${boundary}`
        }
      };

      const req = https.request(url, options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            console.log('[RunningHub] 文件上传响应:', parsed);
            
            // 标准化响应格式，保持与官方Python一致
            const normalizedResponse = {
              success: parsed.success !== false,
              data: parsed.data || parsed,
              thirdPartyResponse: parsed,
              filePath: this.extractFilePath(parsed),
              message: parsed.message || parsed.msg || '文件上传完成'
            };
            
            resolve(normalizedResponse);
          } catch (e) {
            reject(new Error(`响应解析失败: ${responseData}`));
          }
        });
      });

      req.on('error', (error) => {
        console.error('[RunningHub] 文件上传失败:', error);
        reject(error);
      });

      // 写入表单数据
      req.write(formData);
      req.end();
    });
  }

  /**
   * 获取MIME类型
   * @param {string} fileType - 文件类型
   * @returns {string} - MIME类型
   */
  getMimeType(fileType) {
    const mimeTypes = {
      'image': 'image/jpeg',
      'audio': 'audio/mpeg',
      'video': 'video/mp4',
      'input': 'application/octet-stream'
    };
    return mimeTypes[fileType] || 'application/octet-stream';
  }

  /**
   * 获取AI应用的节点信息
   * @param {string} webappId - 应用ID
   * @param {string} apiKey - API密钥
   * @returns {Promise<object>} - 节点信息结果
   */
  async getNodeInfo(webappId, apiKey) {
    try {
      const effectiveApiKey = apiKey || this.defaultApiKey;
      
      if (!webappId) {
        throw new Error('WebApp ID不能为空');
      }
      
      if (!effectiveApiKey) {
        throw new Error('API Key不能为空');
      }
      
      console.log('[RunningHub] 获取节点信息:', { 
        webappId, 
        hasApiKey: !!effectiveApiKey 
      });
      
      // 根据API文档，调用 /api/webapp/apiCallDemo 端点（GET请求）
      const requestData = {
        webappId: webappId,
        apiKey: effectiveApiKey
      };
      
      const response = await this.sendRequest('/api/webapp/apiCallDemo', requestData, effectiveApiKey, 'GET');
      
      console.log('[RunningHub] 节点信息响应:', {
        code: response.code,
        hasData: !!response.data,
        hasNodeInfoList: !!response.data?.nodeInfoList,
        nodeCount: response.data?.nodeInfoList?.length || 0,
        nodeInfoList: response.data?.nodeInfoList,
        covers: response.data?.covers,
        webappName: response.data?.webappName
      });
      
      return response;
      
    } catch (error) {
      console.error('[RunningHub] 获取节点信息失败:', error);
      throw error;
    }
  }
}

module.exports = RunningHubService;