import { TaskResult, TaskStatus } from '../services/runningHub/RunningHubServiceFactory';

/**
 * RunningHub相关工具函数
 * 提供常用的工具方法和辅助函数
 */

export class RunningHubUtils {
  /**
   * 生成唯一的任务ID
   */
  static generateTaskId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `rh-${timestamp}-${random}`;
  }

  /**
   * 格式化文件大小
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 格式化时间持续时间
   */
  static formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    }
    
    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return `${hours}h ${remainingMinutes}m`;
  }

  /**
   * 验证API密钥格式
   */
  static validateApiKey(apiKey: string): boolean {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }

    // RunningHub API密钥通常以 'rk_' 开头，长度至少20字符
    const pattern = /^rk_[a-zA-Z0-9_-]{20,}$/;
    return pattern.test(apiKey);
  }

  /**
   * 验证配置参数
   */
  static validateConfigParameter(name: string, value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }

  /**
   * 深度克隆对象
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as any;
    }

    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item)) as any;
    }

    if (typeof obj === 'object') {
      const cloned = {} as any;
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(obj[key]);
        }
      }
      return cloned;
    }

    return obj;
  }

  /**
   * 防抖函数
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  /**
   * 节流函数
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  }

  /**
   * 将base64转换为Blob
   */
  static base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  /**
   * 将Blob转换为base64
   */
  static blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * 计算文本相似度 (简单实现)
   */
  static calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  /**
   * 生成颜色主题
   */
  static generateThemeColors(nodeType: string): {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  } {
    const themes: Record<string, any> = {
      'image-generation': {
        primary: '#3b82f6', // blue-500
        secondary: '#dbeafe', // blue-100
        accent: '#1d4ed8', // blue-700
        background: '#eff6ff', // blue-50
        text: '#1e3a8a' // blue-900
      },
      'image-edit': {
        primary: '#10b981', // emerald-500
        secondary: '#d1fae5', // emerald-100
        accent: '#047857', // emerald-700
        background: '#ecfdf5', // emerald-50
        text: '#064e3b' // emerald-900
      },
      'text-processing': {
        primary: '#8b5cf6', // violet-500
        secondary: '#ede9fe', // violet-100
        accent: '#7c3aed', // violet-700
        background: '#f5f3ff', // violet-50
        text: '#5b21b6' // violet-900
      },
      'video-generation': {
        primary: '#f59e0b', // amber-500
        secondary: '#fef3c7', // amber-100
        accent: '#d97706', // amber-700
        background: '#fffbeb', // amber-50
        text: '#92400e' // amber-900
      },
      'data-analysis': {
        primary: '#ef4444', // red-500
        secondary: '#fee2e2', // red-100
        accent: '#dc2626', // red-700
        background: '#fef2f2', // red-50
        text: '#991b1b' // red-900
      }
    };

    return themes[nodeType] || {
      primary: '#6b7280', // gray-500
      secondary: '#f3f4f6', // gray-100
      accent: '#4b5563', // gray-700
      background: '#f9fafb', // gray-50
      text: '#374151' // gray-700
    };
  }

  /**
   * 获取状态显示文本
   */
  static getStatusDisplayText(status: TaskStatus): string {
    switch (status.state) {
      case 'idle':
        return '等待中';
      case 'processing':
        return '处理中';
      case 'success':
        return '已完成';
      case 'error':
        return '失败';
      default:
        return '未知状态';
    }
  }

  /**
   * 获取状态颜色类名
   */
  static getStatusColorClass(status: TaskStatus): string {
    switch (status.state) {
      case 'idle':
        return 'text-gray-500 bg-gray-50 border-gray-200';
      case 'processing':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  }

  /**
   * 检查是否为有效的图片URL
   */
  static isValidImageUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    // 检查是否为base64图片
    if (url.startsWith('data:image/')) {
      return true;
    }

    // 检查是否为HTTP(S)图片URL
    const imageUrlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
    return imageUrlPattern.test(url);
  }

  /**
   * 检查是否为有效的视频URL
   */
  static isValidVideoUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    // 检查是否为base64视频
    if (url.startsWith('data:video/')) {
      return true;
    }

    // 检查是否为HTTP(S)视频URL
    const videoUrlPattern = /^https?:\/\/.+\.(mp4|avi|mov|webm|ogg)(\?.*)?$/i;
    return videoUrlPattern.test(url);
  }

  /**
   * 格式化相对时间
   */
  static formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}天前`;
    } else if (hours > 0) {
      return `${hours}小时前`;
    } else if (minutes > 0) {
      return `${minutes}分钟前`;
    } else {
      return '刚刚';
    }
  }

  /**
   * 安全地解析JSON
   */
  static safeJsonParse<T>(json: string, defaultValue: T): T {
    try {
      return JSON.parse(json);
    } catch (error) {
      console.warn('JSON解析失败:', error);
      return defaultValue;
    }
  }

  /**
   * 创建延迟Promise
   */
  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 限制并发数
   */
  static async limitConcurrency<T>(
    tasks: (() => Promise<T>)[],
    maxConcurrency: number = 5
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < tasks.length; i += maxConcurrency) {
      const batch = tasks.slice(i, i + maxConcurrency);
      const batchResults = await Promise.all(batch.map(task => task()));
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * 重试函数
   */
  static async retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('未知错误');
        
        if (attempt === maxAttempts) {
          break;
        }
        
        await this.delay(delay * attempt);
      }
    }
    
    throw lastError!;
  }
}