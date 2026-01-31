/**
 * 配置服务
 * 提供统一的配置访问API
 */

import { configManager, isApiEnabled, getConfig } from './ViteConfigManager';

export class ConfigService {
  private initialized = false;

  /**
   * 初始化配置服务
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await configManager.load();
      configManager.startWatching();
      this.initialized = true;
      console.log('配置服务初始化完成');
    } catch (error) {
      console.error('配置服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 检查API是否已配置并启用
   */
  isApiConfigured(apiName: keyof typeof configManager['getAll']['apis']): boolean {
    try {
      const config = configManager.getApiConfig(apiName);
      return config.enabled && !!config.apiKey;
    } catch (error) {
      console.error(`检查API配置失败 (${apiName}):`, error);
      return false;
    }
  }

  /**
   * 获取API配置
   */
  getApiConfig(apiName: keyof typeof configManager['getAll']['apis']) {
    try {
      return configManager.getApiConfig(apiName);
    } catch (error) {
      console.error(`获取API配置失败 (${apiName}):`, error);
      return null;
    }
  }

  /**
   * 获取Gemini API配置
   */
  getGeminiConfig() {
    return this.getApiConfig('gemini');
  }

  /**
   * 获取RunningHub API配置
   */
  getRunningHubConfig() {
    return this.getApiConfig('runninghub');
  }

  /**
   * 获取第三方API配置
   */
  getThirdPartyConfig() {
    return this.getApiConfig('thirdParty');
  }

  /**
   * 获取Sora API配置
   */
  getSoraConfig() {
    return this.getApiConfig('sora');
  }

  /**
   * 获取Veo API配置
   */
  getVeoConfig() {
    return this.getApiConfig('veo');
  }

  /**
   * 检查是否启用了贞贞API
   */
  isThirdPartyEnabled(): boolean {
    const config = this.getThirdPartyConfig();
    return config?.enabled && !!config.apiKey;
  }

  /**
   * 检查是否启用了Gemini API
   */
  isGeminiEnabled(): boolean {
    const config = this.getGeminiConfig();
    return config?.enabled && !!config.apiKey;
  }

  /**
   * 检查是否启用了RunningHub API
   */
  isRunningHubEnabled(): boolean {
    const config = this.getRunningHubConfig();
    return config?.enabled && !!config.apiKey;
  }

  /**
   * 获取特定功能的webappId
   */
  getFunctionWebappId(functionId: string): string {
    const functions = this.getRunningHubFunctions();
    const functionConfig = functions.find((f: any) => f.id === functionId);
    
    if (!functionConfig) {
      throw new Error(`未找到功能 ${functionId} 的配置`);
    }
    
    if (!functionConfig.webappId) {
      throw new Error(`功能 ${functionConfig.name} 缺少webappId配置`);
    }
    
    return functionConfig.webappId;
  }

  /**
   * 获取特定功能的完整配置
   */
  getFunctionConfig(functionId: string) {
    const functions = this.getRunningHubFunctions();
    const functionConfig = functions.find((f: any) => f.id === functionId);
    
    if (!functionConfig) {
      console.warn(`未找到功能配置: ${functionId}`);
      return null;
    }

    const runningHubConfig = this.getRunningHubConfig();
    return {
      ...functionConfig,
      apiKey: runningHubConfig?.apiKey || '',
      baseUrl: runningHubConfig?.baseUrl || 'https://www.runninghub.cn'
    };
  }

  /**
   * 检查特定功能是否已配置
   */
  isFunctionConfigured(functionId: string): boolean {
    const functionConfig = this.getFunctionConfig(functionId);
    return !!(functionConfig?.webappId && functionConfig?.apiKey);
  }

  /**
   * 验证RunningHub功能配置
   */
  validateRunningHubConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // 验证API配置
    const runningHubConfig = this.getRunningHubConfig();
    if (!runningHubConfig?.apiKey) {
      errors.push('RunningHub API Key未配置');
    }
    
    if (!runningHubConfig?.baseUrl) {
      errors.push('RunningHub BaseUrl未配置');
    }

    // 验证功能配置
    const functions = this.getRunningHubFunctions();
    if (!functions || functions.length === 0) {
      errors.push('未配置RunningHub功能');
      return { isValid: false, errors };
    }

    // 验证每个功能的webappId
    functions.forEach((func: any) => {
      if (!func.webappId) {
        errors.push(`功能 ${func.name} 缺少webappId配置`);
      }
      if (!func.id) {
        errors.push(`功能 ${func.name} 缺少ID配置`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 检查特定功能是否已配置
   */
  isFunctionConfigured(functionId: string): boolean {
    const functionConfig = this.getFunctionConfig(functionId);
    return !!(functionConfig?.webappId && functionConfig?.apiKey);
  }

  /**
   * 获取主题配置
   */
  getThemeConfig() {
    return configManager.get('theme', {
      mode: 'dark',
      autoDetect: false
    });
  }

  /**
   * 获取应用配置
   */
  getAppConfig() {
    return configManager.get('app', {
      name: 'HuanuCanvas',
      version: '1.4.1',
      environment: 'development'
    });
  }

  /**
   * 获取功能配置
   */
  getFeaturesConfig() {
    return configManager.get('features', {
      autoSave: true,
      runningHubFunctions: [],
      audioSynthesis: false,
      musicGeneration: false
    });
  }

  /**
   * 获取RunningHub功能列表
   */
  getRunningHubFunctions() {
    return this.getFeaturesConfig().runningHubFunctions || [];
  }

  /**
   * 检查功能是否启用
   */
  isFeatureEnabled(featureName: string): boolean {
    const features = this.getFeaturesConfig();
    return !!features[featureName];
  }

  /**
   * 获取启用的API列表
   */
  getEnabledApis(): string[] {
    return configManager.getEnabledApis();
  }

  /**
   * 检查是否有任何API可用
   */
  hasAnyApiEnabled(): boolean {
    const enabledApis = this.getEnabledApis();
    return enabledApis.some(apiName => this.isApiConfigured(apiName as any));
  }

  /**
   * 获取默认的API提供商
   */
  getDefaultApiProvider(): string | null {
    // 优先级：贞贞API > Gemini > RunningHub
    if (this.isThirdPartyEnabled()) return 'thirdParty';
    if (this.isGeminiEnabled()) return 'gemini';
    if (this.isRunningHubEnabled()) return 'runninghub';
    return null;
  }

  /**
   * 验证配置
   */
  async validateConfig(): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    try {
      const validation = configManager.validate();
      return {
        isValid: validation.isValid,
        errors: validation.errors.map(e => e.message),
        warnings: validation.warnings.map(w => w.message)
      };
    } catch (error) {
      console.error('配置验证失败:', error);
      return {
        isValid: false,
        errors: ['配置验证过程中发生错误'],
        warnings: []
      };
    }
  }

  /**
   * 监听配置变更
   */
  onConfigChange(callback: (changeType: string, path: string, value: any) => void) {
    const configCallback = (changeType: any, path: string, oldValue: any, newValue: any) => {
      callback(changeType, path, newValue);
    };
    
    configManager.addChangeListener(configCallback);
    
    // 返回取消监听的函数
    return () => {
      configManager.removeChangeListener(configCallback);
    };
  }

  /**
   * 获取配置信息（用于调试）
   */
  getConfigInfo() {
    return {
      initialized: this.initialized,
      enabledApis: this.getEnabledApis(),
      defaultProvider: this.getDefaultApiProvider(),
      hasAnyApi: this.hasAnyApiEnabled(),
      theme: this.getThemeConfig(),
      app: this.getAppConfig(),
      features: this.getFeaturesConfig()
    };
  }
}

// 导出单例实例
export const configService = new ConfigService();

// 便利函数
export const isApiConfigured = (apiName: any): boolean => configService.isApiConfigured(apiName);
export const getGeminiConfig = (): any => configService.getGeminiConfig();
export const getRunningHubConfig = (): any => configService.getRunningHubConfig();
export const getThirdPartyConfig = (): any => configService.getThirdPartyConfig();
export const isThirdPartyEnabled = (): boolean => configService.isThirdPartyEnabled();
export const isGeminiEnabled = (): boolean => configService.isGeminiEnabled();
export const isRunningHubEnabled = (): boolean => configService.isRunningHubEnabled();
export const hasAnyApiEnabled = (): boolean => configService.hasAnyApiEnabled();
export const getDefaultApiProvider = (): string | null => configService.getDefaultApiProvider();

export default configService;