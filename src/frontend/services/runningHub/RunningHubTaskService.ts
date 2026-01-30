import { IRunningHubTaskService } from './interfaces/IRunningHubTaskService';
import { IRunningHubApiService } from './interfaces/IRunningHubApiService';
import { TaskResult, TaskStatus } from './RunningHubServiceFactory';

/**
 * RunningHub任务管理服务
 * 负责处理任务的提交、状态跟踪、取消等操作
 */
export class RunningHubTaskService implements IRunningHubTaskService {
  private apiService: IRunningHubApiService;
  private taskCache: Map<string, TaskResult>;
  private taskQueue: Map<string, AbortController>;

  constructor(apiService?: IRunningHubApiService) {
    this.apiService = apiService || this.createDefaultApiService();
    this.taskCache = new Map();
    this.taskQueue = new Map();
  }

  /**
   * 提交任务到RunningHub
   */
  async submitTask(
    config: any,
    inputs: any[],
    apiKey: string
  ): Promise<TaskResult> {
    try {
      // 验证输入参数
      this.validateInputs(config, inputs, apiKey);

      // 生成任务ID
      const taskId = this.generateTaskId();

      // 创建初始任务结果
      const taskResult: TaskResult = {
        taskId,
        success: false,
        error: null,
        data: null,
        timestamp: Date.now()
      };

      // 缓存任务
      this.taskCache.set(taskId, taskResult);

      // 创建取消控制器
      const abortController = new AbortController();
      this.taskQueue.set(taskId, abortController);

      // 提交深度任务
      const result = await this.apiService.submitDeepTask(config, inputs);

      if (result.success) {
        // 任务提交成功，更新状态
        const updatedTask: TaskResult = {
          ...taskResult,
          success: true,
          data: result.data,
          timestamp: Date.now()
        };

        this.taskCache.set(taskId, updatedTask);
        this.taskQueue.delete(taskId);

        // 开始轮询任务状态
        this.startTaskPolling(taskId, result.taskId);

        return updatedTask;
      } else {
        // 任务提交失败
        const failedTask: TaskResult = {
          ...taskResult,
          success: false,
          error: result.error || '任务提交失败',
          timestamp: Date.now()
        };

        this.taskCache.set(taskId, failedTask);
        this.taskQueue.delete(taskId);

        return failedTask;
      }

    } catch (error) {
      return {
        taskId: this.generateTaskId(),
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        data: null,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 轮询任务状态
   */
  async pollTaskStatus(taskId: string): Promise<TaskStatus> {
    try {
      const cachedTask = this.taskCache.get(taskId);
      if (!cachedTask) {
        return {
          state: 'error',
          message: '任务不存在',
          progress: 0
        };
      }

      // 这里应该调用实际的API来获取任务状态
      // 现在返回模拟状态
      return this.simulateTaskStatus(taskId, cachedTask);

    } catch (error) {
      return {
        state: 'error',
        message: error instanceof Error ? error.message : '状态查询失败',
        progress: 0
      };
    }
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: string): Promise<boolean> {
    try {
      const abortController = this.taskQueue.get(taskId);
      if (abortController) {
        abortController.abort();
        this.taskQueue.delete(taskId);
      }

      // 更新任务状态
      const cachedTask = this.taskCache.get(taskId);
      if (cachedTask) {
        const cancelledTask: TaskResult = {
          ...cachedTask,
          success: false,
          error: '任务已取消',
          timestamp: Date.now()
        };
        this.taskCache.set(taskId, cancelledTask);
      }

      return true;

    } catch (error) {
      console.error('取消任务失败:', error);
      return false;
    }
  }

  /**
   * 获取任务历史
   */
  async getTaskHistory(limit: number = 50): Promise<TaskResult[]> {
    try {
      const tasks = Array.from(this.taskCache.values());
      
      // 按时间倒序排序
      tasks.sort((a, b) => b.timestamp - a.timestamp);
      
      // 限制返回数量
      return tasks.slice(0, limit);

    } catch (error) {
      console.error('获取任务历史失败:', error);
      return [];
    }
  }

  /**
   * 重试失败的任务
   */
  async retryTask(taskId: string): Promise<TaskResult> {
    try {
      const originalTask = this.taskCache.get(taskId);
      if (!originalTask) {
        throw new Error('任务不存在');
      }

      if (originalTask.success) {
        throw new Error('成功任务不能重试');
      }

      // 生成新的任务ID
      const newTaskId = this.generateTaskId();
      
      // 创建重试任务
      const retryTask: TaskResult = {
        taskId: newTaskId,
        success: false,
        error: null,
        data: null,
        timestamp: Date.now()
      };

      this.taskCache.set(newTaskId, retryTask);

      // 这里应该重新提交任务
      // 现在返回模拟结果
      const simulatedResult: TaskResult = {
        ...retryTask,
        success: true,
        data: { result: '重试成功', originalTaskId: taskId },
        timestamp: Date.now()
      };

      this.taskCache.set(newTaskId, simulatedResult);
      return simulatedResult;

    } catch (error) {
      return {
        taskId: this.generateTaskId(),
        success: false,
        error: error instanceof Error ? error.message : '重试失败',
        data: null,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 删除任务
   */
  async deleteTask(taskId: string): Promise<boolean> {
    try {
      const deleted = this.taskCache.delete(taskId);
      this.taskQueue.delete(taskId);
      return deleted;

    } catch (error) {
      console.error('删除任务失败:', error);
      return false;
    }
  }

  /**
   * 获取任务统计信息
   */
  async getTaskStatistics(): Promise<{
    total: number;
    success: number;
    failed: number;
    running: number;
  }> {
    try {
      const tasks = Array.from(this.taskCache.values());
      
      const stats = {
        total: tasks.length,
        success: tasks.filter(t => t.success).length,
        failed: tasks.filter(t => !t.success && t.error).length,
        running: tasks.filter(t => !t.success && !t.error).length
      };

      return stats;

    } catch (error) {
      console.error('获取任务统计失败:', error);
      return { total: 0, success: 0, failed: 0, running: 0 };
    }
  }

  // 私有方法

  private validateInputs(config: any, inputs: any[], apiKey: string): void {
    if (!config) {
      throw new Error('配置不能为空');
    }

    if (!apiKey) {
      throw new Error('API密钥不能为空');
    }

    if (!Array.isArray(inputs)) {
      throw new Error('输入参数必须是数组');
    }
  }

  private generateTaskId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private startTaskPolling(localTaskId: string, remoteTaskId: string): void {
    const pollInterval = setInterval(async () => {
      try {
        const status = await this.pollTaskStatus(localTaskId);
        
        if (status.state === 'success' || status.state === 'error') {
          clearInterval(pollInterval);
          
          // 更新最终状态
          const finalTask: TaskResult = {
            taskId: localTaskId,
            success: status.state === 'success',
            error: status.state === 'error' ? status.message : null,
            data: status.state === 'success' ? { result: '完成' } : null,
            timestamp: Date.now()
          };
          
          this.taskCache.set(localTaskId, finalTask);
        }
      } catch (error) {
        console.error('轮询任务状态失败:', error);
        clearInterval(pollInterval);
      }
    }, 2000); // 每2秒轮询一次

    // 5分钟后停止轮询
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 5 * 60 * 1000);
  }

  private simulateTaskStatus(taskId: string, task: TaskResult): TaskStatus {
    if (task.success) {
      return {
        state: 'success',
        message: '任务已完成',
        progress: 100
      };
    }

    if (task.error) {
      return {
        state: 'error',
        message: task.error,
        progress: 0
      };
    }

    // 模拟处理进度
    const elapsed = Date.now() - task.timestamp;
    const progress = Math.min(90, Math.floor(elapsed / 1000) * 10);

    return {
      state: 'processing',
      message: `处理中... ${progress}%`,
      progress
    };
  }

  private createDefaultApiService(): IRunningHubApiService {
    // 这里应该返回实际的API服务实现
    // 现在返回模拟实现
    return {
      setBaseUrl: () => {},
      setAuthToken: () => {},
      getInstantPreview: async (config, inputs) => ({
        success: true,
        data: { preview: 'mock preview', metadata: {} },
        timestamp: Date.now()
      }),
      submitDeepTask: async (config, inputs) => ({
        success: true,
        taskId: 'mock-remote-task-id',
        status: 'pending',
        timestamp: Date.now()
      }),
      uploadFile: async (file, config) => ({
        success: true,
        fileId: 'mock-file-id',
        metadata: { filename: file.name, size: file.size, type: file.type, uploadedAt: Date.now() }
      }),
      downloadFile: async (fileId, options) => ({
        success: true,
        blob: new Blob(),
        filename: 'mock-file.png',
        metadata: { size: 1024, type: 'image/png', lastModified: Date.now() }
      }),
      checkHealth: async () => ({
        status: 'healthy',
        responseTime: 100,
        services: { api: true, storage: true }
      }),
      retryRequest: async (requestFn) => requestFn(),
      batchRequest: async (requests) => Promise.all(requests.map(req => req())),
      setRequestInterceptor: () => {},
      setResponseInterceptor: () => {}
    };
  }
}