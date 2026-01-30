import { TaskResult, TaskStatus } from '../RunningHubServiceFactory';

export interface IRunningHubTaskService {
  /**
   * 提交任务到RunningHub
   */
  submitTask(
    config: any,
    inputs: any[],
    apiKey: string
  ): Promise<TaskResult>;

  /**
   * 轮询任务状态
   */
  pollTaskStatus(taskId: string): Promise<TaskStatus>;

  /**
   * 取消任务
   */
  cancelTask(taskId: string): Promise<boolean>;

  /**
   * 获取任务历史
   */
  getTaskHistory(limit?: number): Promise<TaskResult[]>;

  /**
   * 重试失败的任务
   */
  retryTask(taskId: string): Promise<TaskResult>;

  /**
   * 删除任务
   */
  deleteTask(taskId: string): Promise<boolean>;

  /**
   * 获取任务统计信息
   */
  getTaskStatistics(): Promise<{
    total: number;
    success: number;
    failed: number;
    running: number;
  }>;
}