export interface IRunningHubResultService {
  /**
   * 解析原始结果数据
   */
  parseResult(rawResult: any): ProcessedResult;

  /**
   * 格式化结果用于显示
   */
  formatResultForDisplay(result: ProcessedResult): DisplayResult;

  /**
   * 保存结果到本地存储
   */
  saveResult(taskId: string, result: ProcessedResult): Promise<boolean>;

  /**
   * 加载结果
   */
  loadResult(taskId: string): Promise<ProcessedResult | null>;

  /**
   * 删除结果
   */
  deleteResult(taskId: string): Promise<boolean>;

  /**
   * 导出结果
   */
  exportResult(taskId: string, format: 'json' | 'csv' | 'xml'): Promise<Blob>;

  /**
   * 获取结果预览
   */
  getResultPreview(taskId: string): Promise<{
    thumbnail?: string;
    summary: string;
    metadata: Record<string, any>;
  } | null>;

  /**
   * 搜索结果
   */
  searchResults(query: string, filters?: any): Promise<ProcessedResult[]>;

  /**
   * 获取结果统计
   */
  getResultStatistics(): Promise<{
    totalResults: number;
    averageSize: number;
    mostCommonType: string;
    storageUsed: number;
  }>;
}

/**
 * 处理后的结果接口
 */
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

/**
 * 用于显示的结果接口
 */
export interface DisplayResult {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  content: {
    type: 'image' | 'text' | 'video' | 'data';
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