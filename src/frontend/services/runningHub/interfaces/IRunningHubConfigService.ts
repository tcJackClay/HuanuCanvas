import { ValidationResult, RunningHubNodeInfo } from '../RunningHubServiceFactory';

export interface IRunningHubConfigService {
  /**
   * 验证配置
   */
  validateConfig(config: any): Promise<ValidationResult>;

  /**
   * 获取节点信息
   */
  fetchNodeInfo(config: any): Promise<RunningHubNodeInfo>;

  /**
   * 保存配置
   */
  saveConfig(config: any): Promise<boolean>;

  /**
   * 加载配置
   */
  loadConfig(nodeType: string): Promise<any>;

  /**
   * 获取配置模板
   */
  getConfigTemplate(nodeType: string): Promise<any>;

  /**
   * 更新配置
   */
  updateConfig(configId: string, updates: any): Promise<boolean>;

  /**
   * 删除配置
   */
  deleteConfig(configId: string): Promise<boolean>;

  /**
   * 获取支持的节点类型列表
   */
  getSupportedNodeTypes(): Promise<string[]>;

  /**
   * 检查API密钥有效性
   */
  validateApiKey(apiKey: string): Promise<boolean>;
}