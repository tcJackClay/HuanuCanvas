/**
 * RunningHub相关类型定义
 * 统一管理所有RunningHub相关的TypeScript类型
 */

// 基础配置类型
export interface RunningHubConfig {
  nodeType: string;
  parameters: Record<string, any>;
  version?: string;
  id?: string;
  savedAt?: number;
  updatedAt?: number;
}

// 输入字段类型
export interface RunningHubInput {
  fieldName: string;
  fieldType: 'image' | 'text' | 'video' | 'file' | 'number' | 'boolean';
  value: any;
  label: string;
  required: boolean;
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

// 输出字段类型
export interface RunningHubOutput {
  fieldName: string;
  fieldType: string;
  label: string;
  description?: string;
}

// 任务结果类型
export interface TaskResult {
  success: boolean;
  data?: any;
  error?: string;
  taskId: string;
  timestamp: number;
  metadata?: {
    nodeType: string;
    duration: number;
    inputSize: number;
    outputSize: number;
    [key: string]: any;
  };
}

// 任务状态类型
export interface TaskStatus {
  state: 'idle' | 'processing' | 'success' | 'error' | 'cancelled';
  message: string;
  progress: number;
  estimatedTimeRemaining?: number;
  errorDetails?: string;
}

// 验证结果类型
export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  warnings: string[];
}

// 节点信息类型
export interface RunningHubNodeInfo {
  nodeType: string;
  displayName: string;
  description: string;
  inputFields: RunningHubInput[];
  outputFields: RunningHubOutput[];
  supportedVersions: string[];
  category: string;
  tags: string[];
  icon?: string;
  preview?: string;
}

// 预览数据类型
export interface PreviewData {
  [key: string]: any;
  thumbnail?: string;
  summary?: string;
  metadata?: Record<string, any>;
}

// 处理结果类型
export interface ProcessedResult {
  taskId: string;
  success: boolean;
  data: any;
  metadata: {
    createdAt: number;
    processedAt: number;
    nodeType: string;
    inputSize: number;
    outputSize: number;
    duration: number;
  };
  errors?: string[];
  warnings?: string[];
}

// 显示结果类型
export interface DisplayResult {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  content: {
    type: 'image' | 'text' | 'video' | 'data' | 'json';
    data: any;
  };
  actions: {
    download: boolean;
    share: boolean;
    edit: boolean;
    delete: boolean;
  };
  metadata: Record<string, any>;
}

// 即时预览结果类型
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

// 深度任务结果类型
export interface DeepTaskResult {
  success: boolean;
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  data?: any;
  error?: string;
  estimatedTime?: number;
  timestamp: number;
  progress?: number;
}

// 上传结果类型
export interface UploadResult {
  success: boolean;
  fileId?: string;
  url?: string;
  metadata?: {
    filename: string;
    size: number;
    type: string;
    uploadedAt: number;
    checksum?: string;
  };
  error?: string;
}

// 下载结果类型
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

// API健康状态类型
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  services: Record<string, boolean>;
  timestamp: number;
  details?: {
    version?: string;
    uptime?: number;
    memory?: {
      used: number;
      total: number;
    };
    disk?: {
      used: number;
      total: number;
    };
  };
}

// 服务接口类型
export interface IRunningHubTaskService {
  submitTask(
    config: RunningHubConfig,
    inputs: RunningHubInput[],
    apiKey: string
  ): Promise<TaskResult>;
  
  pollTaskStatus(taskId: string): Promise<TaskStatus>;
  
  cancelTask(taskId: string): Promise<boolean>;
  
  getTaskHistory(limit?: number): Promise<TaskResult[]>;
  
  retryTask(taskId: string): Promise<TaskResult>;
  
  deleteTask(taskId: string): Promise<boolean>;
  
  getTaskStatistics(): Promise<{
    total: number;
    success: number;
    failed: number;
    running: number;
  }>;
}

export interface IRunningHubConfigService {
  validateConfig(config: RunningHubConfig): Promise<ValidationResult>;
  
  fetchNodeInfo(config: RunningHubConfig): Promise<RunningHubNodeInfo>;
  
  saveConfig(config: RunningHubConfig): Promise<boolean>;
  
  loadConfig(nodeType: string): Promise<RunningHubConfig>;
  
  getConfigTemplate(nodeType: string): Promise<RunningHubConfig>;
  
  updateConfig(configId: string, updates: Partial<RunningHubConfig>): Promise<boolean>;
  
  deleteConfig(configId: string): Promise<boolean>;
  
  getSupportedNodeTypes(): Promise<string[]>;
  
  validateApiKey(apiKey: string): Promise<boolean>;
}

export interface IRunningHubResultService {
  parseResult(rawResult: any): ProcessedResult;
  
  formatResultForDisplay(result: ProcessedResult): DisplayResult;
  
  saveResult(taskId: string, result: ProcessedResult): Promise<boolean>;
  
  loadResult(taskId: string): Promise<ProcessedResult | null>;
  
  deleteResult(taskId: string): Promise<boolean>;
  
  exportResult(taskId: string, format: 'json' | 'csv' | 'xml'): Promise<Blob>;
  
  getResultPreview(taskId: string): Promise<{
    thumbnail?: string;
    summary: string;
    metadata: Record<string, any>;
  } | null>;
  
  searchResults(query: string, filters?: any): Promise<ProcessedResult[]>;
  
  getResultStatistics(): Promise<{
    totalResults: number;
    averageSize: number;
    mostCommonType: string;
    storageUsed: number;
  }>;
}

export interface IRunningHubApiService {
  setBaseUrl(baseUrl: string): void;
  
  setAuthToken(token: string): void;
  
  getInstantPreview(
    config: RunningHubConfig,
    inputs: RunningHubInput[]
  ): Promise<PreviewResult>;
  
  submitDeepTask(
    config: RunningHubConfig,
    inputs: RunningHubInput[]
  ): Promise<DeepTaskResult>;
  
  uploadFile(
    file: File,
    config: RunningHubConfig
  ): Promise<UploadResult>;
  
  downloadFile(
    fileId: string,
    options?: {
      format?: string;
      quality?: string;
    }
  ): Promise<DownloadResult>;
  
  checkHealth(): Promise<HealthStatus>;
  
  retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries?: number,
    retryDelay?: number
  ): Promise<T>;
  
  batchRequest<T>(
    requests: Array<() => Promise<T>>,
    maxConcurrency?: number
  ): Promise<T[]>;
  
  setRequestInterceptor(interceptor: (config: any) => any): void;
  
  setResponseInterceptor(interceptor: (response: any) => any): void;
}

// 状态管理类型
export interface InstantState {
  preview: PreviewData | null;
  isProcessing: boolean;
  error: string | null;
  selectedTask: TaskResult | null;
}

export interface DeepState {
  taskHistory: TaskResult[];
  currentConfig: RunningHubConfig | null;
  lastTask: TaskResult | null;
  taskQueue: TaskResult[];
}

export interface RunningHubState {
  instantState: InstantState;
  deepState: DeepState;
  updateInstantState: (updates: Partial<InstantState>) => void;
  updateDeepState: (updates: Partial<DeepState>) => void;
  clearState: () => void;
  // 便捷方法
  addTask: (task: TaskResult) => void;
  updateTask: (taskId: string, updates: Partial<TaskResult>) => void;
  removeTask: (taskId: string) => void;
  getTask: (taskId: string) => TaskResult | undefined;
  clearTasks: () => void;
  updateConfig: (config: RunningHubConfig) => void;
  isTaskRunning: boolean;
  latestTask: TaskResult | null;
}

// 组件属性类型
export interface SimpleRunningHubNodeProps {
  id: string;
  data: {
    label: string;
    config: RunningHubConfig;
    inputs: RunningHubInput[];
    outputs: RunningHubOutput[];
    status: TaskStatus;
    progress: number;
    result?: TaskResult;
    isConfigured: boolean;
    apiKey?: string;
  };
  selected?: boolean;
}

export interface RunningHubInputPanelProps {
  inputs: RunningHubInput[];
  preview?: PreviewData;
  onChange: (inputName: string, value: any) => void;
  isProcessing?: boolean;
}

export interface RunningHubPreviewProps {
  preview?: PreviewData;
  isProcessing?: boolean;
  error?: string | null;
}

export interface RunningHubTaskManagerProps {
  tasks: TaskResult[];
  onTaskSelect?: (task: TaskResult) => void;
  onClose: () => void;
}

export interface RunningHubConfigPanelProps {
  config: RunningHubConfig;
  onChange: (config: RunningHubConfig) => void;
  onClose: () => void;
}

export interface RunningHubStatusIndicatorProps {
  status: TaskStatus;
  progress?: number;
  error?: string | null;
  className?: string;
}

// 错误类型
export class RunningHubError extends Error {
  public code: string;
  public details?: any;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = 'RunningHubError';
    this.code = code;
    this.details = details;
  }
}

// 工具类型
export type TaskFilter = 'all' | 'success' | 'error' | 'processing';

export type ExportFormat = 'json' | 'csv' | 'xml' | 'pdf';

export type ContentType = 'image' | 'text' | 'video' | 'data' | 'json';

export type ApiStatus = 'healthy' | 'degraded' | 'down';

export type NodeCategory = 
  | 'generation'
  | 'processing'
  | 'analysis'
  | 'transformation'
  | 'utility'
  | 'custom';

// 常量
export const RUNNINGHUB_CONSTANTS = {
  API_BASE_URL: '/api/runninghub',
  DEFAULT_TIMEOUT: 30000,
  INSTANT_PREVIEW_TIMEOUT: 2000,
  MAX_FILE_SIZE: 30 * 1024 * 1024, // 30MB
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  POLL_INTERVAL: 2000,
  BATCH_SIZE: 5,
  CACHE_TTL: 5 * 60 * 1000, // 5分钟
  STORAGE_KEYS: {
    CONFIGS: 'runninghub-configs',
    TASKS: 'runninghub-tasks',
    RESULTS: 'runninghub-results',
    SETTINGS: 'runninghub-settings'
  },
  SUPPORTED_IMAGE_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ],
  SUPPORTED_VIDEO_TYPES: [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/avi',
    'video/mov'
  ],
  NODE_TYPES: [
    'image-generation',
    'image-edit',
    'text-processing',
    'video-generation',
    'data-analysis',
    'custom'
  ] as const
} as const;