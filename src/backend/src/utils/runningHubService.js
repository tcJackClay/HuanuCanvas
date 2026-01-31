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
   * 简化的RunningHub API请求（按照官方Python实现）
   * 不使用Authorization头，API Key在URL参数或请求体中
   * @param {string} endpoint - API端点
   * @param {object} data - 请求数据
   * @param {string} method - HTTP方法 (GET或POST)
   * @returns {Promise<object>} - API响应
   */
  async sendRequestSimple(endpoint, data, method = 'POST') {
    const url = `${this.apiBaseUrl}${endpoint}`;
    
    console.log(`[RunningHub] Simple ${method} ${endpoint}`);

    return new Promise((resolve, reject) => {
      const options = {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Host': 'www.runninghub.cn'
          // 不使用Authorization头，按照官方文档
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
      
      // 根据官方文档，提交任务的端点是 /task/openapi/ai-app/run
      // 使用简化的请求方式，不带Authorization头
      const response = await this.sendRequestSimple('/task/openapi/ai-app/run', requestData, 'POST');
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
      
      // 使用简化的请求方式，查询任务结果端点 /task/openapi/outputs
      const response = await this.sendRequestSimple('/task/openapi/outputs', requestData, 'POST');
      
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
   * 根据官方文档，返回的 fileName 格式为 "api/xxx.jpg"，需要保持原格式
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
    
    for (const path of possiblePaths) {
      if (path && typeof path === 'string' && path.trim() !== '') {
        // RunningHub 返回的 fileName 格式为 "api/xxx.jpg"
        // 保持原格式，不添加前导 /
        const hasApiPrefix = path.startsWith('api/');
        const hasHttpPrefix = path.startsWith('http://') || path.startsWith('https://');
        const hasLeadingSlash = path.startsWith('/');
        
        let cleanedPath = path;
        
        if (hasHttpPrefix) {
          // 已经是完整 URL，保持不变
          cleanedPath = path;
        } else if (hasApiPrefix) {
          // 已有 api/ 前缀，保持原格式（官方文档格式）
          cleanedPath = path;  // api/xxx.jpg → api/xxx.jpg ✅
        } else if (hasLeadingSlash) {
          // 只有前导 /，没有 api/ 前缀，添加 api/ 前缀
          cleanedPath = 'api' + path;  // /xxx.jpg → api/xxx.jpg
        } else {
          // 没有前缀，添加 api/ 前缀
          cleanedPath = 'api/' + path;  // xxx.jpg → api/xxx.jpg
        }
        
        console.log(`[RunningHub] ✅ 成功提取到文件路径: ${path} → ${cleanedPath}`);
        return cleanedPath;
      }
    }
    
    console.error('[RunningHub] ❌ 未找到有效的文件路径');
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
      });

      // 构建 multipart/form-data (使用 Buffer 正确处理二进制数据)
      const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;
      
      // 文件头部分
      const fileHeader = Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
        `Content-Type: application/octet-stream\r\n\r\n`
      );
      
      // 文件类型部分
      const fileTypePart = Buffer.from(
        `\r\n--${boundary}\r\n` +
        `Content-Disposition: form-data; name="fileType"\r\n\r\n` +
        `${fileType}`
      );
      
      // API Key 部分
      const apiKeyPart = Buffer.from(
        `\r\n--${boundary}\r\n` +
        `Content-Disposition: form-data; name="apiKey"\r\n\r\n` +
        `${effectiveApiKey}\r\n--${boundary}--`
      );

      // 正确拼接：文件头 + 文件内容（二进制） + 文件类型 + API Key
      const formData = Buffer.concat([
        fileHeader,
        fileBuffer,
        fileTypePart,
        apiKeyPart
      ]);

      // 调用上传 API
      const url = `${this.apiBaseUrl}/task/openapi/upload`;
      
      return await this.uploadWithBufferRequest(url, formData, boundary, formData.length);
    } catch (error) {
      console.error('[RunningHub] 文件上传失败:', error);
      throw error;
    }
  }

async uploadWithBufferRequest(url, formData, boundary, contentLength) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname,
        method: 'POST',
        headers: {
          'Host': 'www.runninghub.cn',
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': contentLength
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            console.log('[RunningHub] 文件上传响应:', parsed);
            
            // 标准化响应格式
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

      // 写入二进制表单数据
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
      
      // 根据官方文档，GET请求：/api/webapp/apiCallDemo?apiKey={apiKey}&webappId={webappId}
      // 不使用Authorization头，API Key在URL参数中
      const url = `/api/webapp/apiCallDemo?apiKey=${effectiveApiKey}&webappId=${webappId}`;
      console.log('[RunningHub] GET请求URL:', url.replace(effectiveApiKey, '***API_KEY***'));
      
      const response = await this.sendRequestSimple(url, null, 'GET');
      
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