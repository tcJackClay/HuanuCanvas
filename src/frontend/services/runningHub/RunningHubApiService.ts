import { IRunningHubApiService, PreviewResult, DeepTaskResult, UploadResult, DownloadResult } from './interfaces/IRunningHubApiService';

/**
 * RunningHub API通信服务
 * 负责与RunningHub后端API的所有通信
 */
export class RunningHubApiService implements IRunningHubApiService {
  private baseUrl: string = '/api/runninghub';
  private authToken: string | null = null;
  private requestInterceptor: ((config: any) => any) | null = null;
  private responseInterceptor: ((response: any) => any) | null = null;
  private retryConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    retryableStatuses: [408, 429, 500, 502, 503, 504]
  };

  /**
   * 设置API基础URL
   */
  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  /**
   * 设置认证令牌
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * 发送即时预览请求
   */
  async getInstantPreview(
    config: any,
    inputs: any[]
  ): Promise<PreviewResult> {
    try {
      const requestConfig = {
        method: 'POST',
        url: `${this.baseUrl}/instant-preview`,
        data: { config, inputs },
        timeout: 2000
      };

      const response = await this.executeRequest<any>(requestConfig);
      
      return {
        success: response.success !== false,
        data: response.data,
        error: response.error,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('即时预览请求失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '即时预览失败',
        timestamp: Date.now()
      };
    }
  }

  /**
   * 提交深度处理任务
   */
  async submitDeepTask(
    config: any,
    inputs: any[]
  ): Promise<DeepTaskResult> {
    try {
      const requestConfig = {
        method: 'POST',
        url: `${this.baseUrl}/deep-task`,
        data: { config, inputs },
        timeout: 30000
      };

      const response = await this.executeRequest<any>(requestConfig);
      
      return {
        success: response.success !== false,
        taskId: response.taskId || this.generateTaskId(),
        status: response.status || 'pending',
        data: response.data,
        error: response.error,
        estimatedTime: response.estimatedTime,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('深度任务提交失败:', error);
      return {
        success: false,
        taskId: this.generateTaskId(),
        status: 'failed',
        error: error instanceof Error ? error.message : '任务提交失败',
        timestamp: Date.now()
      };
    }
  }

  /**
   * 上传文件
   */
  async uploadFile(
    file: File,
    config: any
  ): Promise<UploadResult> {
    try {
      // 验证文件
      this.validateFile(file);

      // 创建FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('config', JSON.stringify(config));
      
      if (this.authToken) {
        formData.append('apiKey', this.authToken);
      }

      const requestConfig = {
        method: 'POST',
        url: `${this.baseUrl}/upload`,
        data: formData,
        timeout: 60000,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };

      const response = await this.executeRequest<any>(requestConfig);
      
      return {
        success: response.success !== false,
        fileId: response.fileId,
        url: response.url,
        metadata: response.metadata || {
          filename: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: Date.now()
        },
        error: response.error
      };

    } catch (error) {
      console.error('文件上传失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '文件上传失败'
      };
    }
  }

  /**
   * 下载文件
   */
  async downloadFile(
    fileId: string,
    options?: {
      format?: string;
      quality?: string;
    }
  ): Promise<DownloadResult> {
    try {
      const requestConfig = {
        method: 'GET',
        url: `${this.baseUrl}/download/${fileId}`,
        params: options,
        timeout: 30000
      };

      const response = await this.executeRequest<Blob>(requestConfig, true);
      
      return {
        success: true,
        blob: response,
        filename: this.extractFilename(response.headers?.['content-disposition']) || `${fileId}.bin`,
        metadata: {
          size: response.size,
          type: response.type,
          lastModified: Date.now()
        }
      };

    } catch (error) {
      console.error('文件下载失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '文件下载失败'
      };
    }
  }

  /**
   * 获取API健康状态
   */
  async checkHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    services: Record<string, boolean>;
  }> {
    try {
      const startTime = Date.now();
      
      const response = await this.executeRequest<any>({
        method: 'GET',
        url: `${this.baseUrl}/health`,
        timeout: 5000
      });
      
      const responseTime = Date.now() - startTime;
      
      let status: 'healthy' | 'degraded' | 'down';
      if (responseTime > 3000) {
        status = 'degraded';
      } else if (responseTime > 5000) {
        status = 'down';
      } else {
        status = 'healthy';
      }
      
      return {
        status,
        responseTime,
        services: response.services || {
          api: true,
          storage: true,
          queue: true
        }
      };

    } catch (error) {
      console.error('健康检查失败:', error);
      return {
        status: 'down',
        responseTime: 5000,
        services: {
          api: false,
          storage: false,
          queue: false
        }
      };
    }
  }

  /**
   * 重试失败的请求
   */
  async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = this.retryConfig.maxRetries,
    retryDelay: number = this.retryConfig.retryDelay
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('未知错误');
        
        if (attempt === maxRetries) {
          break;
        }
        
        // 检查是否应该重试
        if (!this.shouldRetry(error)) {
          break;
        }
        
        // 等待后重试
        await this.delay(retryDelay * Math.pow(2, attempt));
      }
    }
    
    throw lastError!;
  }

  /**
   * 批量处理请求
   */
  async batchRequest<T>(
    requests: Array<() => Promise<T>>,
    maxConcurrency: number = 5
  ): Promise<T[]> {
    const results: T[] = [];
    
    // 分批执行请求
    for (let i = 0; i < requests.length; i += maxConcurrency) {
      const batch = requests.slice(i, i + maxConcurrency);
      const batchResults = await Promise.allSettled(batch.map(req => req()));
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`批量请求 ${i + index} 失败:`, result.reason);
          // 在失败的情况下，可以选择抛出错误或记录错误后继续
          results.push(null as any); // 或者根据需要处理
        }
      });
    }
    
    return results;
  }

  /**
   * 设置请求拦截器
   */
  setRequestInterceptor(interceptor: (config: any) => any): void {
    this.requestInterceptor = interceptor;
  }

  /**
   * 设置响应拦截器
   */
  setResponseInterceptor(interceptor: (response: any) => any): void {
    this.responseInterceptor = interceptor;
  }

  // 私有方法

  private async executeRequest<T>(
    config: any,
    isBlob: boolean = false
  ): Promise<T> {
    const finalConfig = this.applyRequestInterceptor(config);
    
    try {
      const fetchConfig: RequestInit = {
        method: finalConfig.method,
        headers: {
          ...this.getDefaultHeaders(),
          ...finalConfig.headers
        },
        signal: AbortSignal.timeout(finalConfig.timeout || 10000)
      };

      // 添加请求体
      if (finalConfig.data) {
        if (finalConfig.data instanceof FormData) {
          fetchConfig.body = finalConfig.data;
        } else {
          fetchConfig.body = JSON.stringify(finalConfig.data);
        }
      }

      // 添加查询参数
      const url = this.buildUrl(finalConfig.url, finalConfig.params);
      
      const response = await fetch(url, fetchConfig);
      
      // 检查响应状态
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let data: any;
      if (isBlob) {
        data = await response.blob();
      } else {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }
      }

      const finalResponse = this.applyResponseInterceptor({
        data,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      return finalResponse.data;

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('请求超时');
      }
      throw error;
    }
  }

  private applyRequestInterceptor(config: any): any {
    if (this.requestInterceptor) {
      return this.requestInterceptor(config);
    }
    return config;
  }

  private applyResponseInterceptor(response: any): any {
    if (this.responseInterceptor) {
      return this.responseInterceptor(response);
    }
    return response;
  }

  private getDefaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  private buildUrl(baseUrl: string, params?: any): string {
    const url = new URL(baseUrl, window.location.origin);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return url.toString();
  }

  private validateFile(file: File): void {
    // 检查文件大小 (30MB限制)
    const maxSize = 30 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`文件大小不能超过 ${maxSize / 1024 / 1024}MB`);
    }

    // 检查文件类型
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/mov',
      'video/avi',
      'text/plain',
      'application/json'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`不支持的文件类型: ${file.type}`);
    }
  }

  private shouldRetry(error: any): boolean {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true; // 网络错误可以重试
    }

    if (error instanceof Error && error.message.includes('HTTP')) {
      const statusMatch = error.message.match(/HTTP (\d+)/);
      if (statusMatch) {
        const status = parseInt(statusMatch[1]);
        return this.retryConfig.retryableStatuses.includes(status);
      }
    }

    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateTaskId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractFilename(contentDisposition?: string): string | null {
    if (!contentDisposition) return null;
    
    const match = contentDisposition.match(/filename="?([^"]+)"?/);
    return match ? match[1] : null;
  }
}