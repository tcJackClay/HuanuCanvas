import { RunningHubTaskService } from './RunningHubTaskService';
import { RunningHubConfigService } from './RunningHubConfigService';
import { RunningHubResultService } from './RunningHubResultService';
import { RunningHubApiService } from './RunningHubApiService';
import { IRunningHubTaskService } from './interfaces/IRunningHubTaskService';
import { IRunningHubConfigService } from './interfaces/IRunningHubConfigService';
import { IRunningHubResultService } from './interfaces/IRunningHubResultService';
import { IRunningHubApiService } from './interfaces/IRunningHubApiService';

export interface RunningHubConfig {
  nodeType: string;
  parameters: Record<string, any>;
  version?: string;
}

export interface RunningHubInput {
  fieldName: string;
  fieldType: 'image' | 'text' | 'video' | 'file';
  value: any;
  label: string;
  required: boolean;
}

export interface TaskResult {
  success: boolean;
  data?: any;
  error?: string;
  taskId: string;
  timestamp: number;
}

export interface TaskStatus {
  state: 'idle' | 'processing' | 'success' | 'error';
  message: string;
  progress: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  warnings: string[];
}

export interface RunningHubNodeInfo {
  nodeType: string;
  displayName: string;
  description: string;
  inputFields: RunningHubInput[];
  outputFields: any[];
  supportedVersions: string[];
}

/**
 * RunningHub服务工厂
 * 负责创建和管理所有RunningHub相关的服务实例
 */
export class RunningHubServiceFactory {
  private static instance: RunningHubServiceFactory;
  private taskService: IRunningHubTaskService;
  private configService: IRunningHubConfigService;
  private resultService: IRunningHubResultService;
  private apiService: IRunningHubApiService;

  private constructor() {
    this.taskService = new RunningHubTaskService();
    this.configService = new RunningHubConfigService();
    this.resultService = new RunningHubResultService();
    this.apiService = new RunningHubApiService();
  }

  public static getInstance(): RunningHubServiceFactory {
    if (!RunningHubServiceFactory.instance) {
      RunningHubServiceFactory.instance = new RunningHubServiceFactory();
    }
    return RunningHubServiceFactory.instance;
  }

  /**
   * 创建任务服务实例
   */
  public createTaskService(): IRunningHubTaskService {
    return this.taskService;
  }

  /**
   * 创建配置服务实例
   */
  public createConfigService(): IRunningHubConfigService {
    return this.configService;
  }

  /**
   * 创建结果服务实例
   */
  public createResultService(): IRunningHubResultService {
    return this.resultService;
  }

  /**
   * 创建API服务实例
   */
  public createApiService(): IRunningHubApiService {
    return this.apiService;
  }

  /**
   * 获取所有服务实例
   */
  public getAllServices() {
    return {
      taskService: this.taskService,
      configService: this.configService,
      resultService: this.resultService,
      apiService: this.apiService
    };
  }

  /**
   * 销毁服务实例
   */
  public dispose(): void {
    this.taskService = null as any;
    this.configService = null as any;
    this.resultService = null as any;
    this.apiService = null as any;
  }
}

// 导出单例实例
export const runningHubServiceFactory = RunningHubServiceFactory.getInstance();