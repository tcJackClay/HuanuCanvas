export interface IRunningHubApiService {
  /**
   * 设置API基础URL
   */
  setBaseUrl(baseUrl: string): void;

  /**
   * 设置认证令牌
   */
  setAuthToken(token: string): void;

  /**
   * 发送即时预览请求
   */
  getInstantPreview(
    config: any,
    inputs: any[]
  ): Promise<PreviewResult>;

  /**
   * 提交深度处理任务
   */
  submitDeepTask(
    config: any,
    inputs: any[]
  ): Promise<DeepTaskResult>;

  /**
   * 上传文件
   */
  uploadFile(
    file: File,
    config: any
  ): Promise<UploadResult>;

  /**
   * 下载文件
   */
  downloadFile(
    fileId: string,
    options?: {
      format?: string;
      quality?: string;
    }
  ): Promise<DownloadResult>;

  /**
   * 获取API健康状态
   */
  checkHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    services: Record<string, boolean>;
  }>;

  /**
   * 重试失败的请求
   */
  retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries?: number,
    retryDelay?: number
  ): Promise<T>;

  /**
   * 批量处理请求
   */
  batchRequest<T>(
    requests: Array<() => Promise<T>>,
    maxConcurrency?: number
  ): Promise<T[]>;

  /**
   * 设置请求拦截器
   */
  setRequestInterceptor(
    interceptor: (config: any) => any
  ): void;

  /**
   * 设置响应拦截器
   */
  setResponseInterceptor(
    interceptor: (response: any) => any
  ): void;
}

/**
 * 即时预览结果
 */
export interface PreviewResult {
  success: boolean;
  data?: {
    preview: any;
    thumbnail?: string;
    metadata: Record<string, any>;
  };
  error?: string;
  timestamp: number;
}

/**
 * 深度任务结果
 */
export interface DeepTaskResult {
  success: boolean;
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  data?: any;
  error?: string;
  estimatedTime?: number;
  timestamp: number;
}

/**
 * 上传结果
 */
export interface UploadResult {
  success: boolean;
  fileId?: string;
  url?: string;
  metadata?: {
    filename: string;
    size: number;
    type: string;
    uploadedAt: number;
  };
  error?: string;
}

/**
 * 下载结果
 */
export interface DownloadResult {
  success: boolean;
  blob?: Blob;
  filename?: string;
  metadata?: {
    size: number;
    type: string;
    lastModified: number;
  };
  error?: string;
}