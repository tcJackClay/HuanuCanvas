const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const config = require('../config');

class RunningHubService {
  constructor() {
    this.apiBaseUrl = config.RUNNINGHUB.API_BASE_URL;
    this.defaultApiKey = config.RUNNINGHUB.DEFAULT_API_KEY;
    this.defaultWebappId = config.RUNNINGHUB.DEFAULT_WEBAPP_ID;
  }

  /**
   * 发送HTTP请求到RunningHub API
   * @param {string} endpoint - API端点
   * @param {object} data - 请求数据
   * @param {string} apiKey - API密钥
   * @returns {Promise<object>} - API响应
   */
  async sendRequest(endpoint, data, apiKey) {
    const url = new URL(endpoint, this.apiBaseUrl);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const effectiveApiKey = apiKey || this.defaultApiKey;
    
    // 根据RunningHub API文档，所有端点都只支持在请求体中传递apiKey
    // 不支持Authorization: Bearer头认证
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    console.log(`[RunningHub] 请求 ${endpoint}`, {
      url: url.toString(),
      headers: options.headers,
      data: data
    });

    return new Promise((resolve, reject) => {
      const req = protocol.request(url, options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          console.log(`[RunningHub] 响应 ${endpoint}:`, {
            statusCode: res.statusCode,
            data: responseData.substring(0, 500)
          });
          
          try {
            const parsedData = JSON.parse(responseData);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsedData);
            } else {
              console.error('[RunningHub] API错误响应:', parsedData);
              reject(new Error(`API请求失败 (${res.statusCode}): ${parsedData.message || parsedData.msg || responseData}`));
            }
          } catch (error) {
            console.error('[RunningHub] 响应解析失败:', responseData.substring(0, 500));
            reject(new Error(`响应解析失败 (${res.statusCode}): ${error.message}, 原始响应: ${responseData.substring(0, 500)}`));
          }
        });
      });

      req.on('error', (error) => {
        console.error('[RunningHub] 请求错误:', error.message);
        reject(new Error(`请求发送失败: ${error.message}`));
      });

      req.write(JSON.stringify(data));
      req.end();
    });
  }

  /**
   * 发送GET请求到RunningHub API
   * @param {URL} url - 完整的URL对象
   * @returns {Promise<object>} - API响应
   */
  async sendGetRequest(url) {
    const protocol = url.protocol === 'https:' ? https : http;
    
    const options = {
      method: 'GET',
    };

    console.log(`[RunningHub] GET请求`, {
      url: url.toString(),
      headers: options.headers
    });

    return new Promise((resolve, reject) => {
      const req = protocol.request(url, options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          console.log(`[RunningHub] GET响应:`, {
            statusCode: res.statusCode,
            data: responseData.substring(0, 1000)
          });
          
          try {
            const parsedData = JSON.parse(responseData);
            resolve(parsedData);
          } catch (error) {
            reject(new Error(`响应解析失败 (${res.statusCode}): ${error.message}, 原始响应: ${responseData}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`GET请求发送失败: ${error.message}`));
      });

      req.end();
    });
  }

  /**
   * 获取RunningHub应用的节点信息
   * @param {string} webappId - 应用ID
   * @param {string} apiKey - API密钥
   * @returns {Promise<object>} - 节点信息
   */
  async getNodeInfo(webappId, apiKey) {
    try {
      const effectiveWebappId = webappId || this.defaultWebappId;
      const effectiveApiKey = apiKey || this.defaultApiKey;
      
      if (!effectiveWebappId) {
        throw new Error('WebAppId不能为空');
      }
      
      if (!effectiveApiKey) {
        throw new Error('API Key不能为空');
      }
      
      // 根据文档，获取节点信息使用GET请求，apiKey和webappId在URL参数中
      const url = new URL('/api/webapp/apiCallDemo', this.apiBaseUrl);
      url.searchParams.append('apiKey', effectiveApiKey);
      url.searchParams.append('webappId', effectiveWebappId);
      
      console.log('[RunningHub] 请求节点信息:', { url: url.toString() });
      
      // 使用GET请求获取节点信息
      const response = await this.sendGetRequest(url);
      console.log('[RunningHub] 节点信息响应:', JSON.stringify(response, null, 2));
      
      // 检查响应数据结构
      if (!response) {
        throw new Error('API返回空响应');
      }
      
      // 检查是否有错误信息
      if (response.code !== 0 && response.code !== 200 && response.code !== '0' && response.code !== '200') {
        const errorMsg = response.message || response.msg || response.error || '未知错误';
        console.error('[RunningHub] API返回错误码:', response.code, errorMsg);
        throw new Error(`API错误 (${response.code}): ${errorMsg}`);
      }
      
      // 检查节点数据
      if (!response.data && !response.nodeInfoList && !response.nodeList) {
        console.warn('[RunningHub] 响应中没有节点数据:', response);
        return {
          success: true,
          data: null,
          message: '无可用节点信息',
          nodeInfoList: [],
          covers: []
        };
      }
      
      return response;
    } catch (error) {
      console.error('[RunningHub] 获取节点信息失败:', error.message);
      throw error;
    }
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
      
      // 根据文档，提交任务使用nodeInfoList而非nodeInfoList2
      const requestData = {
        webappId: effectiveWebappId,
        nodeInfoList: nodeInfoList2,
        apiKey: effectiveApiKey,
      };
      console.log('[RunningHub] 提交任务:', JSON.stringify(requestData, null, 2));
      
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
   * 上传文件到RunningHub（从Buffer直接上传）
   * @param {Buffer} fileBuffer - 文件内容
   * @param {string} fileName - 文件名
   * @param {string} fileType - 文件类型
   * @param {string} apiKey - API密钥
   * @returns {Promise<object>} - 上传结果
   */
  async uploadFileFromBuffer(fileBuffer, fileName, fileType, apiKey) {
    try {
      const effectiveApiKey = apiKey || this.defaultApiKey;
      
      // 构建multipart/form-data请求
      const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;
      const formData = `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
        `Content-Type: ${this.getMimeType(fileType)}\r\n\r\n` +
        fileBuffer + `\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="fileType"\r\n\r\n` +
        fileType + `\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="apiKey"\r\n\r\n` +
        effectiveApiKey + `\r\n` +
        `--${boundary}--`;
      
      // 根据文档，文件上传端点应为 /task/openapi/upload
      const url = new URL('/task/openapi/upload', this.apiBaseUrl);
      const protocol = url.protocol === 'https:' ? https : http;
      
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
      };

      console.log('[RunningHub] 上传文件:', { fileName, fileType, url: url.toString() });

      return new Promise((resolve, reject) => {
        const req = protocol.request(url, options, (res) => {
          let responseData = '';

          res.on('data', (chunk) => {
            responseData += chunk;
          });

          res.on('end', () => {
            console.log('[RunningHub] 文件上传响应:', { statusCode: res.statusCode, data: responseData.substring(0, 1000) });
            
            try {
              const parsedData = JSON.parse(responseData);
              if (res.statusCode >= 200 && res.statusCode < 300) {
                resolve({
                  success: true,
                  thirdPartyResponse: parsedData
                });
              } else {
                reject(new Error(`文件上传失败: ${parsedData.message || parsedData.msg || responseData}`));
              }
            } catch (error) {
              reject(new Error(`响应解析失败: ${error.message}, 原始响应: ${responseData}`));
            }
          });
        });

        req.on('error', (error) => {
          reject(new Error(`文件上传请求失败: ${error.message}`));
        });

        req.write(formData);
        req.end();
      });
    } catch (error) {
      console.error('文件上传失败:', error);
      throw error;
    }
  }

  /**
   * 上传文件到Running（从文件路径上传，保留兼容性）
   * @param {string} filePath - 文件路径
   * @param {string} fileType - 文件类型
   * @param {string} apiKey - API密钥
   * @returns {Promise<object>} - 上传结果
   * @deprecated 请使用 uploadFileFromBuffer
   */
  async uploadFile(filePath, fileType, apiKey) {
    const fileContent = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    return this.uploadFileFromBuffer(fileContent, fileName, fileType, apiKey);
  }

  /**
   * 获取文件MIME类型
   * @param {string} fileType - 文件类型
   * @returns {string} - MIME类型
   */
  getMimeType(fileType) {
    const mimeTypes = {
      image: 'image/jpeg',
      audio: 'audio/mpeg',
      video: 'video/mp4',
      input: 'application/octet-stream',
    };
    return mimeTypes[fileType] || 'application/octet-stream';
  }

  /**
   * 轮询任务状态
   * @param {string} taskId - 任务ID
   * @param {string} apiKey - API密钥
   * @returns {Promise<object>} - 最终任务状态
   */
  async pollTaskStatus(taskId, apiKey) {
    const maxAttempts = 120;
    const delayMs = 5000;

    const poll = async (attempts = 0) => {
      if (attempts >= maxAttempts) {
        throw new Error('任务执行超时（等待超过10分钟）');
      }

      try {
        const effectiveApiKey = apiKey || this.defaultApiKey;
        const requestData = { taskId, apiKey: effectiveApiKey };
        console.log(`[RunningHub] 轮询任务状态 (${attempts + 1}/${maxAttempts}):`, JSON.stringify(requestData, null, 2));
        
        // 根据文档，查询任务结果的端点是/task/openapi/outputs
        const response = await this.sendRequest('/task/openapi/outputs', requestData, apiKey);
        console.log('[RunningHub] 任务状态响应:', JSON.stringify(response, null, 2));

        // 根据文档，成功状态码是0，运行中是804，排队中是813，失败是805
        if (response.code === 0 && response.data) {
          console.log('[RunningHub] 任务成功完成');
          return response;
        }
        
        if (response.code === 805) {
          console.log('[RunningHub] 任务执行失败:', response.message || response.msg);
          return response;
        }
        
        if (response.code === 804) {
          console.log('[RunningHub] 任务运行中...');
        } else if (response.code === 813) {
          console.log('[RunningHub] 任务排队中...');
        } else {
          console.log('[RunningHub] 未知状态码:', response.code);
        }

        // 异步延迟后递归调用
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return poll(attempts + 1);
      } catch (error) {
        console.error('[RunningHub] 轮询任务状态失败:', error.message);
        
        if (attempts >= maxAttempts - 1) {
          throw error;
        }
        
        // 延迟后重试
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return poll(attempts + 1);
      }
    };

    return poll();
  }

  // 单次轮询（用于save_nodes）
  async pollTaskStatusOnce(taskId, apiKey) {
    try {
      const effectiveApiKey = apiKey || this.defaultApiKey;
      const requestData = { taskId, apiKey: effectiveApiKey };
      
      const response = await this.sendRequest('/task/openapi/outputs', requestData, apiKey);
      
      return response;
    } catch (error) {
      console.error('[RunningHub] 单次轮询失败:', error.message);
      throw error;
    }
  }
}

module.exports = new RunningHubService();
