/**
 * Vite环境配置管理器
 * 适配前端开发环境的配置管理
 */

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
      defaultWebappId?: string;
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

class ViteConfigManager {
  private config: AppConfig | null = null;
  private watchers: ConfigChangeCallback[] = [];
  private isWatching = false;
  private configPath = '/src/data/app-config.json';

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
   * 设置配置（开发环境中临时生效，生产环境需要后端API）
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

    // 在开发环境中，可以临时保存到localStorage作为fallback
    if (this.config.app.environment === 'development') {
      this.saveToLocalStorage(path, value);
    }
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
      const response = await fetch(this.configPath);
      if (!response.ok) {
        throw new Error(`配置加载失败: ${response.status} ${response.statusText}`);
      }

      this.config = await response.json();

      // 配置验证
      const validation = this.validate();
      if (!validation.isValid) {
        console.error('配置验证失败:', validation.errors);
        // 使用默认配置
        this.config = this.getDefaultConfig();
      }

    } catch (error) {
      console.error('加载配置失败:', error);
      // 使用默认配置
      this.config = this.getDefaultConfig();
    }
  }

  /**
   * 保存配置（开发环境使用localStorage，生产环境需要后端API）
   */
  async save(): Promise<void> {
    if (!this.config) {
      throw new Error('配置管理器未初始化');
    }

    if (this.config.app.environment === 'development') {
      // 开发环境中临时保存到localStorage
      localStorage.setItem('dev_config_override', JSON.stringify(this.config));
    } else {
      // 生产环境需要调用后端API保存
      try {
        const response = await fetch('/api/config/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.config)
        });

        if (!response.ok) {
          throw new Error(`保存配置失败: ${response.status}`);
        }
      } catch (error) {
        console.error('保存配置失败:', error);
        throw error;
      }
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
   * 启用配置监控（开发环境中使用轮询）
   */
  startWatching(): void {
    if (this.isWatching) return;

    // 开发环境中使用轮询监控配置变化
    const pollInterval = setInterval(async () => {
      try {
        await this.reload();
      } catch (error) {
        console.error('监控模式下重载配置失败:', error);
      }
    }, 5000); // 每5秒检查一次

    this.isWatching = true;
    console.log('配置监控已启用');
    
    // 存储interval ID以便停止
    (this as any)._pollInterval = pollInterval;
  }

  /**
   * 停止配置监控
   */
  stopWatching(): void {
    if (!this.isWatching) return;

    const pollInterval = (this as any)._pollInterval;
    if (pollInterval) {
      clearInterval(pollInterval);
    }

    this.isWatching = false;
    console.log('配置监控已禁用');
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
   * 保存到localStorage（开发环境fallback）
   */
  private saveToLocalStorage(path: string, value: any): void {
    try {
      const key = `dev_config_${path.replace(/\./g, '_')}`;
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('保存到localStorage失败:', error);
    }
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
export const configManager = new ViteConfigManager();

// 便利函数
export const getConfig = <T>(path: string, defaultValue?: T): T => configManager.get(path, defaultValue);
export const setConfig = <T>(path: string, value: T): void => configManager.set(path, value);
export const isApiEnabled = (apiName: keyof AppConfig['apis']): boolean => configManager.isApiEnabled(apiName);
export const getEnabledApis = (): string[] => configManager.getEnabledApis();

export default configManager;