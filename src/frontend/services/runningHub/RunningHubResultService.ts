import { IRunningHubResultService, ProcessedResult, DisplayResult } from './interfaces/IRunningHubResultService';

/**
 * RunningHub结果处理服务
 * 负责处理、格式化、保存和检索任务结果
 */
export class RunningHubResultService implements IRunningHubResultService {
  private resultCache: Map<string, ProcessedResult>;
  private storageKey = 'runninghub-results';

  constructor() {
    this.resultCache = new Map();
    this.loadResultsFromStorage();
  }

  /**
   * 解析原始结果数据
   */
  parseResult(rawResult: any): ProcessedResult {
    try {
      // 验证输入
      if (!rawResult) {
        throw new Error('原始结果数据不能为空');
      }

      // 提取任务ID
      const taskId = this.extractTaskId(rawResult);
      
      // 确定成功状态
      const success = this.determineSuccessStatus(rawResult);
      
      // 提取数据
      const data = this.extractData(rawResult);
      
      // 提取错误信息
      const errors = this.extractErrors(rawResult);
      
      // 提取警告信息
      const warnings = this.extractWarnings(rawResult);

      const processedResult: ProcessedResult = {
        taskId,
        success,
        data,
        metadata: {
          createdAt: Date.now(),
          processedAt: Date.now(),
          nodeType: this.extractNodeType(rawResult),
          inputSize: this.calculateInputSize(rawResult),
          outputSize: this.calculateOutputSize(data),
          duration: this.extractDuration(rawResult)
        },
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      };

      return processedResult;

    } catch (error) {
      console.error('解析结果失败:', error);
      return {
        taskId: 'unknown',
        success: false,
        data: null,
        metadata: {
          createdAt: Date.now(),
          processedAt: Date.now(),
          nodeType: 'unknown',
          inputSize: 0,
          outputSize: 0,
          duration: 0
        },
        errors: [error instanceof Error ? error.message : '解析结果失败']
      };
    }
  }

  /**
   * 格式化结果用于显示
   */
  formatResultForDisplay(result: ProcessedResult): DisplayResult {
    try {
      const { taskId, data, metadata, success } = result;
      
      // 确定内容类型
      const contentType = this.detectContentType(data);
      
      // 格式化内容数据
      const formattedData = this.formatContentData(data, contentType);
      
      // 生成缩略图
      const thumbnail = this.generateThumbnail(data, contentType);
      
      // 生成标题和描述
      const { title, description } = this.generateTitleAndDescription(result);

      const displayResult: DisplayResult = {
        id: taskId,
        title,
        description,
        thumbnail,
        content: {
          type: contentType,
          data: formattedData
        },
        actions: {
          download: success && this.canDownload(contentType),
          share: success,
          edit: this.canEdit(contentType),
          delete: true
        },
        metadata: {
          ...metadata,
          formattedAt: Date.now()
        }
      };

      return displayResult;

    } catch (error) {
      console.error('格式化结果显示失败:', error);
      return {
        id: result.taskId,
        title: '结果格式化失败',
        description: '无法格式化结果显示',
        content: {
          type: 'data',
          data: result.data
        },
        actions: {
          download: false,
          share: false,
          edit: false,
          delete: true
        },
        metadata: result.metadata
      };
    }
  }

  /**
   * 保存结果到本地存储
   */
  async saveResult(taskId: string, result: ProcessedResult): Promise<boolean> {
    try {
      // 更新缓存
      this.resultCache.set(taskId, result);
      
      // 保存到本地存储
      const results = this.getAllResults();
      results[taskId] = result;
      
      localStorage.setItem(this.storageKey, JSON.stringify(results));
      
      return true;

    } catch (error) {
      console.error('保存结果失败:', error);
      return false;
    }
  }

  /**
   * 加载结果
   */
  async loadResult(taskId: string): Promise<ProcessedResult | null> {
    try {
      // 先从缓存查找
      if (this.resultCache.has(taskId)) {
        return this.resultCache.get(taskId)!;
      }

      // 从存储中查找
      const results = this.getAllResults();
      const result = results[taskId];
      
      if (result) {
        this.resultCache.set(taskId, result);
        return result;
      }

      return null;

    } catch (error) {
      console.error('加载结果失败:', error);
      return null;
    }
  }

  /**
   * 删除结果
   */
  async deleteResult(taskId: string): Promise<boolean> {
    try {
      // 从缓存删除
      this.resultCache.delete(taskId);
      
      // 从存储删除
      const results = this.getAllResults();
      delete results[taskId];
      
      localStorage.setItem(this.storageKey, JSON.stringify(results));
      
      return true;

    } catch (error) {
      console.error('删除结果失败:', error);
      return false;
    }
  }

  /**
   * 导出结果
   */
  async exportResult(
    taskId: string, 
    format: 'json' | 'csv' | 'xml' = 'json'
  ): Promise<Blob> {
    try {
      const result = await this.loadResult(taskId);
      if (!result) {
        throw new Error('结果不存在');
      }

      let content: string;
      let mimeType: string;

      switch (format) {
        case 'json':
          content = JSON.stringify(result, null, 2);
          mimeType = 'application/json';
          break;
          
        case 'csv':
          content = this.convertToCSV(result);
          mimeType = 'text/csv';
          break;
          
        case 'xml':
          content = this.convertToXML(result);
          mimeType = 'application/xml';
          break;
          
        default:
          throw new Error(`不支持的导出格式: ${format}`);
      }

      return new Blob([content], { type: mimeType });

    } catch (error) {
      console.error('导出结果失败:', error);
      throw error;
    }
  }

  /**
   * 获取结果预览
   */
  async getResultPreview(taskId: string): Promise<{
    thumbnail?: string;
    summary: string;
    metadata: Record<string, any>;
  } | null> {
    try {
      const result = await this.loadResult(taskId);
      if (!result) {
        return null;
      }

      const contentType = this.detectContentType(result.data);
      const thumbnail = this.generateThumbnail(result.data, contentType);
      const summary = this.generateSummary(result);
      const metadata = {
        ...result.metadata,
        contentType,
        hasErrors: (result.errors && result.errors.length > 0) || false,
        hasWarnings: (result.warnings && result.warnings.length > 0) || false
      };

      return {
        thumbnail,
        summary,
        metadata
      };

    } catch (error) {
      console.error('获取结果预览失败:', error);
      return null;
    }
  }

  /**
   * 搜索结果
   */
  async searchResults(query: string, filters?: any): Promise<ProcessedResult[]> {
    try {
      const allResults = Array.from(this.resultCache.values());
      
      return allResults.filter(result => {
        // 文本搜索
        const matchesQuery = !query || this.matchesQuery(result, query);
        
        // 过滤条件
        const matchesFilters = !filters || this.matchesFilters(result, filters);
        
        return matchesQuery && matchesFilters;
      });

    } catch (error) {
      console.error('搜索结果失败:', error);
      return [];
    }
  }

  /**
   * 获取结果统计
   */
  async getResultStatistics(): Promise<{
    totalResults: number;
    averageSize: number;
    mostCommonType: string;
    storageUsed: number;
  }> {
    try {
      const results = Array.from(this.resultCache.values());
      
      if (results.length === 0) {
        return {
          totalResults: 0,
          averageSize: 0,
          mostCommonType: 'none',
          storageUsed: 0
        };
      }

      const totalSize = results.reduce((sum, result) => sum + result.metadata.outputSize, 0);
      const averageSize = totalSize / results.length;
      
      // 统计内容类型
      const typeCounts: Record<string, number> = {};
      results.forEach(result => {
        const type = this.detectContentType(result.data);
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });
      
      const mostCommonType = Object.entries(typeCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown';

      // 计算存储使用量
      const storageUsed = JSON.stringify(this.getAllResults()).length;

      return {
        totalResults: results.length,
        averageSize,
        mostCommonType,
        storageUsed
      };

    } catch (error) {
      console.error('获取结果统计失败:', error);
      return {
        totalResults: 0,
        averageSize: 0,
        mostCommonType: 'unknown',
        storageUsed: 0
      };
    }
  }

  // 私有方法

  private extractTaskId(rawResult: any): string {
    return rawResult.taskId || rawResult.id || `task-${Date.now()}`;
  }

  private determineSuccessStatus(rawResult: any): boolean {
    return rawResult.success !== false && !rawResult.error;
  }

  private extractData(rawResult: any): any {
    return rawResult.data || rawResult.result || rawResult.output || null;
  }

  private extractErrors(rawResult: any): string[] {
    if (rawResult.error) {
      return Array.isArray(rawResult.error) ? rawResult.error : [rawResult.error];
    }
    return [];
  }

  private extractWarnings(rawResult: any): string[] {
    if (rawResult.warnings) {
      return Array.isArray(rawResult.warnings) ? rawResult.warnings : [rawResult.warnings];
    }
    return [];
  }

  private extractNodeType(rawResult: any): string {
    return rawResult.nodeType || rawResult.type || 'unknown';
  }

  private calculateInputSize(rawResult: any): number {
    return rawResult.inputSize || rawResult.input?.size || 0;
  }

  private calculateOutputSize(data: any): number {
    if (!data) return 0;
    
    // 如果是字符串，计算长度
    if (typeof data === 'string') {
      return data.length;
    }
    
    // 如果是对象，计算JSON字符串长度
    if (typeof data === 'object') {
      return JSON.stringify(data).length;
    }
    
    return 0;
  }

  private extractDuration(rawResult: any): number {
    return rawResult.duration || rawResult.processingTime || 0;
  }

  private detectContentType(data: any): 'image' | 'text' | 'video' | 'data' {
    if (!data) return 'data';
    
    // 检查是否是图片数据
    if (typeof data === 'string' && (
      data.startsWith('data:image/') || 
      data.startsWith('http') && data.match(/\.(jpg|jpeg|png|gif|webp)$/i)
    )) {
      return 'image';
    }
    
    // 检查是否是视频数据
    if (typeof data === 'string' && (
      data.startsWith('data:video/') || 
      data.startsWith('http') && data.match(/\.(mp4|avi|mov|webm)$/i)
    )) {
      return 'video';
    }
    
    // 检查是否是文本数据
    if (typeof data === 'string' || Array.isArray(data)) {
      return 'text';
    }
    
    return 'data';
  }

  private formatContentData(data: any, contentType: string): any {
    switch (contentType) {
      case 'image':
        return {
          url: data,
          alt: '生成的图片'
        };
      case 'video':
        return {
          url: data,
          alt: '生成的视频'
        };
      case 'text':
        return {
          content: typeof data === 'string' ? data : JSON.stringify(data, null, 2)
        };
      default:
        return data;
    }
  }

  private generateThumbnail(data: any, contentType: string): string | undefined {
    if (contentType === 'image' && typeof data === 'string') {
      return data;
    }
    return undefined;
  }

  private generateTitleAndDescription(result: ProcessedResult): { title: string; description: string } {
    const nodeType = result.metadata.nodeType;
    const success = result.success;
    
    let title: string;
    let description: string;
    
    if (success) {
      title = `${this.getNodeDisplayName(nodeType)} - 成功`;
      description = `任务已完成，耗时 ${result.metadata.duration}ms`;
    } else {
      title = `${this.getNodeDisplayName(nodeType)} - 失败`;
      description = result.errors?.[0] || '任务执行失败';
    }
    
    return { title, description };
  }

  private getNodeDisplayName(nodeType: string): string {
    const names: Record<string, string> = {
      'image-generation': '图片生成',
      'image-edit': '图片编辑',
      'text-processing': '文本处理',
      'video-generation': '视频生成',
      'data-analysis': '数据分析'
    };
    return names[nodeType] || nodeType;
  }

  private canDownload(contentType: string): boolean {
    return contentType === 'image' || contentType === 'text' || contentType === 'video';
  }

  private canEdit(contentType: string): boolean {
    return contentType === 'text' || contentType === 'data';
  }

  private generateSummary(result: ProcessedResult): string {
    const nodeType = this.getNodeDisplayName(result.metadata.nodeType);
    const status = result.success ? '成功' : '失败';
    
    if (result.success && result.data) {
      const contentType = this.detectContentType(result.data);
      switch (contentType) {
        case 'image':
          return `${nodeType}完成，生成了一张图片`;
        case 'video':
          return `${nodeType}完成，生成了一个视频`;
        case 'text':
          const textLength = typeof result.data === 'string' ? result.data.length : JSON.stringify(result.data).length;
          return `${nodeType}完成，生成了${textLength}字符的文本`;
        default:
          return `${nodeType}完成`;
      }
    }
    
    return `${nodeType}${status}`;
  }

  private matchesQuery(result: ProcessedResult, query: string): boolean {
    const queryLower = query.toLowerCase();
    
    // 搜索任务ID
    if (result.taskId.toLowerCase().includes(queryLower)) {
      return true;
    }
    
    // 搜索节点类型
    if (result.metadata.nodeType.toLowerCase().includes(queryLower)) {
      return true;
    }
    
    // 搜索数据内容
    if (result.data) {
      const dataString = JSON.stringify(result.data).toLowerCase();
      if (dataString.includes(queryLower)) {
        return true;
      }
    }
    
    return false;
  }

  private matchesFilters(result: ProcessedResult, filters: any): boolean {
    // 根据过滤条件匹配
    if (filters.success !== undefined && result.success !== filters.success) {
      return false;
    }
    
    if (filters.nodeType && result.metadata.nodeType !== filters.nodeType) {
      return false;
    }
    
    if (filters.dateRange) {
      const resultTime = result.metadata.createdAt;
      if (resultTime < filters.dateRange.start || resultTime > filters.dateRange.end) {
        return false;
      }
    }
    
    return true;
  }

  private convertToCSV(result: ProcessedResult): string {
    const data = result.data;
    
    if (typeof data === 'object' && data !== null) {
      // 将对象转换为CSV格式
      const headers = Object.keys(data);
      const values = Object.values(data);
      
      return headers.join(',') + '\n' + values.join(',');
    }
    
    return `data\n${data}`;
  }

  private convertToXML(result: ProcessedResult): string {
    const data = result.data;
    
    if (typeof data === 'object' && data !== null) {
      return this.objectToXML(data);
    }
    
    return `<result><data>${data}</data></result>`;
  }

  private objectToXML(obj: any, rootName: string = 'result'): string {
    const xml = [`<${rootName}>`];
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        xml.push(this.objectToXML(value, key));
      } else {
        xml.push(`<${key}>${value}</${key}>`);
      }
    }
    
    xml.push(`</${rootName}>`);
    return xml.join('');
  }

  private getAllResults(): Record<string, ProcessedResult> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('获取存储结果失败:', error);
      return {};
    }
  }

  private loadResultsFromStorage(): void {
    try {
      const results = this.getAllResults();
      
      for (const [taskId, result] of Object.entries(results)) {
        this.resultCache.set(taskId, result as ProcessedResult);
      }
      
    } catch (error) {
      console.error('从存储加载结果失败:', error);
    }
  }
}