/**
 * 统一配置管理器
 * 管理所有API配置和应用程序设置
 */

import fs from 'fs';
import path from 'path';

export interface AppConfig {
  app: {
    name: string;
    version: string;
    environment: 'development' | 'production' | 'test';
  };
  theme: {
    mode: 'light' | 'dark' | 'auto';
    autoDetect: boolean;
  };
  apis: {
    gemini: {
      enabled: boolean;
      apiKey: string;
      baseUrl: string;
    };
    runninghub: {
      enabled: boolean;
      apiKey: string;
      baseUrl: string;
      webappId: string;
    };
    thirdParty: {
      enabled: boolean;
      baseUrl: string;
      apiKey: string;
      model: string;
      chatModel: string;
    };
    sora: {
      enabled: boolean;
      apiKey: string;
      baseUrl: string;
    };
    veo: {
      enabled: boolean;
      apiKey: string;
      baseUrl: string;
    };
  };
  features: {
    autoSave: boolean;
    runningHubFunctions: any[];
    audioSynthesis: boolean;
    musicGeneration: boolean;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  path: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  path: string;
  message: string;
  suggestion?: string;
}

export interface ConfigChangeCallback {
  (changeType: 'add' | 'update' | 'remove', path: string, oldValue: any, newValue: any): void;
}

class ConfigManager {
  private configPath: string;
  private config: AppConfig | null = null;
  private watchers: ConfigChangeCallback[] = [];
  private isWatching = false;

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(process.cwd(), 'src', 'data', 'app-config.json');
  }

  /**
   * 获取配置
   */
  get<T = any>(path: string, defaultValue?: T): T {
    if (!this.config) {
      throw new Error('配置管理器未初始化');
    }

    const keys = path.split('.');
    let current: any = this.config;

    for (const key of keys) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return defaultValue as T;
      }
      current = current[key];
    }

    return current !== undefined ? current : defaultValue;
  }

  /**
   * 设置配置
   */
  set<T>(path: string, value: T): void {
    if (!this.config) {
      throw new Error('配置管理器未初始化');
    }

    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let current: any = this.config;

    // 导航到父对象
    for (const key of keys) {
      if (current[key] === undefined || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    const oldValue = current[lastKey];
    current[lastKey] = value;

    // 通知观察者
    this.watchers.forEach(callback => {
      callback('update', path, oldValue, value);
    });

    // 自动保存
    this.save();
  }

  /**
   * 获取完整配置
   */
  getAll(): AppConfig {
    if (!this.config) {
      throw new Error('配置管理器未初始化');
    }
    return { ...this.config };
  }

  /**
   * 加载配置
   */
  async load(): Promise<void> {
    try {
      if (!fs.existsSync(this.configPath)) {
        console.warn(`配置文件不存在: ${this.configPath}`);
        this.config = this.getDefaultConfig();
        await this.save();
        return;
      }

      const configData = fs.readFileSync(this.configPath, 'utf-8');
      this.config = JSON.parse(configData);

      // 配置验证
      const validation = this.validate();
      if (!validation.isValid) {
        console.error('配置验证失败:', validation.errors);
        throw new Error(`配置验证失败: ${validation.errors.map(e => e.message).join(', ')}`);
      }

    } catch (error) {
      console.error('加载配置失败:', error);
      throw error;
    }
  }

  /**
   * 保存配置
   */
  async save(): Promise<void> {
    if (!this.config) {
      throw new Error('配置管理器未初始化');
    }

    try {
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('保存配置失败:', error);
      throw error;
    }
  }

  /**
   * 验证配置
   */
  validate(): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!this.config) {
      errors.push({
        path: 'config',
        message: '配置未加载',
        code: 'CONFIG_NOT_LOADED'
      });
      return { isValid: false, errors, warnings };
    }

    // 验证必需字段
    const requiredPaths = [
      'app.name',
      'app.version',
      'theme.mode',
      'apis.gemini.baseUrl',
      'apis.runninghub.baseUrl'
    ];

    for (const path of requiredPaths) {
      if (this.get(path) === undefined) {
        errors.push({
          path,
          message: `缺少必需的配置项: ${path}`,
          code: 'MISSING_REQUIRED_FIELD'
        });
      }
    }

    // 验证API配置
    const apis = this.get('apis');
    Object.entries(apis).forEach(([name, config]: [string, any]) => {
      if (config.enabled) {
        if (!config.apiKey && name !== 'thirdParty') {
          warnings.push({
            path: `apis.${name}.apiKey`,
            message: `${name} API已启用但缺少API Key`,
            suggestion: '请在配置文件中添加API Key'
          });
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 获取API配置
   */
  getApiConfig(apiName: keyof AppConfig['apis']) {
    return this.get(`apis.${apiName}`);
  }

  /**
   * 检查API是否已启用
   */
  isApiEnabled(apiName: keyof AppConfig['apis']): boolean {
    return this.get(`apis.${apiName}.enabled`, false);
  }

  /**
   * 获取启用的API列表
   */
  getEnabledApis(): string[] {
    const apis = this.get('apis');
    return Object.entries(apis)
      .filter(([_, config]: [string, any]) => config.enabled)
      .map(([name, _]) => name);
  }

  /**
   * 添加配置变更监听器
   */
  addChangeListener(callback: ConfigChangeCallback): void {
    this.watchers.push(callback);
  }

  /**
   * 移除配置变更监听器
   */
  removeChangeListener(callback: ConfigChangeCallback): void {
    const index = this.watchers.indexOf(callback);
    if (index > -1) {
      this.watchers.splice(index, 1);
    }
  }

  /**
   * 启用配置监控（文件监听）
   */
  startWatching(): void {
    if (this.isWatching) return;

    try {
      fs.watchFile(this.configPath, { interval: 1000 }, (curr, prev) => {
        if (curr.mtime !== prev.mtime) {
          this.load().catch(error => {
            console.error('监控模式下加载配置失败:', error);
          });
        }
      });
      this.isWatching = true;
      console.log('配置监控已启用');
    } catch (error) {
      console.error('启用配置监控失败:', error);
    }
  }

  /**
   * 停止配置监控
   */
  stopWatching(): void {
    if (!this.isWatching) return;

    try {
      fs.unwatchFile(this.configPath);
      this.isWatching = false;
      console.log('配置监控已禁用');
    } catch (error) {
      console.error('停止配置监控失败:', error);
    }
  }

  /**
   * 重载配置
   */
  async reload(): Promise<void> {
    await this.load();
  }

  /**
   * 重置为默认配置
   */
  async resetToDefault(): Promise<void> {
    this.config = this.getDefaultConfig();
    await this.save();
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): AppConfig {
    return {
      app: {
        name: 'HuanuCanvas',
        version: '1.4.1',
        environment: 'development'
      },
      theme: {
        mode: 'dark',
        autoDetect: false
      },
      apis: {
        gemini: {
          enabled: false,
          apiKey: '',
          baseUrl: 'https://generativelanguage.googleapis.com'
        },
        runninghub: {
          enabled: false,
          apiKey: '',
          baseUrl: 'https://api.runninghub.com',
          webappId: ''
        },
        thirdParty: {
          enabled: false,
          baseUrl: 'https://ai.t8star.cn',
          apiKey: '',
          model: 'nano-banana-2',
          chatModel: 'nano-chat-2'
        },
        sora: {
          enabled: false,
          apiKey: '',
          baseUrl: 'https://api.openai.com'
        },
        veo: {
          enabled: false,
          apiKey: '',
          baseUrl: 'https://generativelanguage.googleapis.com'
        }
      },
      features: {
        autoSave: true,
        runningHubFunctions: [],
        audioSynthesis: false,
        musicGeneration: false
      }
    };
  }
}

// 导出单例实例
export const configManager = new ConfigManager();

// 便利函数
export const getConfig = <T>(path: string, defaultValue?: T): T => configManager.get(path, defaultValue);
export const setConfig = <T>(path: string, value: T): void => configManager.set(path, value);
export const isApiEnabled = (apiName: keyof AppConfig['apis']): boolean => configManager.isApiEnabled(apiName);
export const getEnabledApis = (): string[] => configManager.getEnabledApis();

export default configManager;