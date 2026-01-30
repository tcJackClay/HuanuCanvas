import { IRunningHubConfigService } from './interfaces/IRunningHubConfigService';
import { ValidationResult, RunningHubNodeInfo } from './RunningHubServiceFactory';

/**
 * RunningHub配置管理服务
 * 负责配置的验证、保存、加载等操作
 */
export class RunningHubConfigService implements IRunningHubConfigService {
  private configCache: Map<string, any>;
  private nodeTypeCache: Map<string, RunningHubNodeInfo>;

  constructor() {
    this.configCache = new Map();
    this.nodeTypeCache = new Map();
  }

  /**
   * 验证配置
   */
  async validateConfig(config: any): Promise<ValidationResult> {
    try {
      const errors: Record<string, string> = {};
      const warnings: string[] = [];

      // 基本结构验证
      if (!config) {
        return {
          valid: false,
          errors: { config: '配置不能为空' },
          warnings
        };
      }

      // 节点类型验证
      if (!config.nodeType) {
        errors.nodeType = '节点类型不能为空';
      } else {
        const supportedTypes = await this.getSupportedNodeTypes();
        if (!supportedTypes.includes(config.nodeType)) {
          errors.nodeType = `不支持的节点类型: ${config.nodeType}`;
        }
      }

      // 参数验证
      if (config.parameters) {
        await this.validateParameters(config.nodeType, config.parameters, errors);
      }

      // 版本验证
      if (config.version) {
        const nodeInfo = await this.fetchNodeInfo(config);
        if (nodeInfo && config.version && !nodeInfo.supportedVersions.includes(config.version)) {
          warnings.push(`版本 ${config.version} 可能不兼容，建议使用最新版本`);
        }
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
        warnings
      };

    } catch (error) {
      return {
        valid: false,
        errors: { validation: error instanceof Error ? error.message : '验证失败' },
        warnings: []
      };
    }
  }

  /**
   * 获取节点信息
   */
  async fetchNodeInfo(config: any): Promise<RunningHubNodeInfo> {
    try {
      const cacheKey = `nodeInfo-${config.nodeType}`;
      
      if (this.nodeTypeCache.has(cacheKey)) {
        return this.nodeTypeCache.get(cacheKey)!;
      }

      // 从缓存或API获取节点信息
      const nodeInfo = await this.fetchNodeInfoFromSource(config.nodeType);
      
      this.nodeTypeCache.set(cacheKey, nodeInfo);
      return nodeInfo;

    } catch (error) {
      console.error('获取节点信息失败:', error);
      throw new Error(`无法获取节点 ${config.nodeType} 的信息`);
    }
  }

  /**
   * 保存配置
   */
  async saveConfig(config: any): Promise<boolean> {
    try {
      // 验证配置
      const validation = await this.validateConfig(config);
      if (!validation.valid) {
        throw new Error(`配置验证失败: ${JSON.stringify(validation.errors)}`);
      }

      // 生成配置ID
      const configId = this.generateConfigId(config);
      
      // 保存到本地存储
      const serializedConfig = {
        ...config,
        id: configId,
        savedAt: Date.now(),
        version: config.version || '1.0'
      };

      localStorage.setItem(`runninghub-config-${configId}`, JSON.stringify(serializedConfig));
      
      // 更新缓存
      this.configCache.set(configId, serializedConfig);

      return true;

    } catch (error) {
      console.error('保存配置失败:', error);
      return false;
    }
  }

  /**
   * 加载配置
   */
  async loadConfig(nodeType: string): Promise<any> {
    try {
      // 查找匹配的配置文件
      const configs = Array.from(this.configCache.values())
        .filter(config => config.nodeType === nodeType);

      if (configs.length === 0) {
        // 从本地存储加载
        const storedConfigs = this.loadConfigsFromStorage();
        const matchingConfig = storedConfigs.find(config => config.nodeType === nodeType);
        
        if (matchingConfig) {
          this.configCache.set(matchingConfig.id, matchingConfig);
          return matchingConfig;
        }
      }

      // 返回默认配置
      return this.getDefaultConfig(nodeType);

    } catch (error) {
      console.error('加载配置失败:', error);
      return this.getDefaultConfig(nodeType);
    }
  }

  /**
   * 获取配置模板
   */
  async getConfigTemplate(nodeType: string): Promise<any> {
    try {
      const templates: Record<string, any> = {
        'image-generation': {
          nodeType: 'image-generation',
          version: '1.0',
          parameters: {
            prompt: '',
            width: 512,
            height: 512,
            style: 'realistic',
            quality: 'high',
            steps: 20,
            guidance_scale: 7.5,
            seed: null
          }
        },
        'image-edit': {
          nodeType: 'image-edit',
          version: '1.0',
          parameters: {
            editType: 'enhance',
            intensity: 0.8,
            preserveOriginal: true,
            background: 'transparent',
            format: 'png'
          }
        },
        'text-processing': {
          nodeType: 'text-processing',
          version: '1.0',
          parameters: {
            operation: 'summarize',
            language: 'zh-CN',
            maxLength: 200,
            tone: 'neutral',
            format: 'paragraph'
          }
        },
        'video-generation': {
          nodeType: 'video-generation',
          version: '1.0',
          parameters: {
            duration: 5,
            fps: 24,
            resolution: '720p',
            style: 'realistic',
            motion: 'smooth'
          }
        },
        'data-analysis': {
          nodeType: 'data-analysis',
          version: '1.0',
          parameters: {
            analysisType: 'summary',
            outputFormat: 'json',
            includeCharts: false,
            timezone: 'UTC'
          }
        },
        'custom': {
          nodeType: 'custom',
          version: '1.0',
          parameters: {}
        }
      };

      return templates[nodeType] || templates['custom'];

    } catch (error) {
      console.error('获取配置模板失败:', error);
      return {
        nodeType,
        version: '1.0',
        parameters: {}
      };
    }
  }

  /**
   * 更新配置
   */
  async updateConfig(configId: string, updates: any): Promise<boolean> {
    try {
      const existingConfig = this.configCache.get(configId);
      if (!existingConfig) {
        throw new Error('配置不存在');
      }

      // 合并更新
      const updatedConfig = {
        ...existingConfig,
        ...updates,
        updatedAt: Date.now()
      };

      // 验证更新后的配置
      const validation = await this.validateConfig(updatedConfig);
      if (!validation.valid) {
        throw new Error(`更新后的配置验证失败: ${JSON.stringify(validation.errors)}`);
      }

      // 保存更新
      this.configCache.set(configId, updatedConfig);
      localStorage.setItem(`runninghub-config-${configId}`, JSON.stringify(updatedConfig));

      return true;

    } catch (error) {
      console.error('更新配置失败:', error);
      return false;
    }
  }

  /**
   * 删除配置
   */
  async deleteConfig(configId: string): Promise<boolean> {
    try {
      const deleted = this.configCache.delete(configId);
      localStorage.removeItem(`runninghub-config-${configId}`);
      return deleted;

    } catch (error) {
      console.error('删除配置失败:', error);
      return false;
    }
  }

  /**
   * 获取支持的节点类型列表
   */
  async getSupportedNodeTypes(): Promise<string[]> {
    try {
      // 缓存的节点类型
      const cachedTypes = Array.from(this.nodeTypeCache.keys())
        .map(key => key.replace('nodeInfo-', ''))
        .filter(type => type !== 'nodeInfo-');

      if (cachedTypes.length > 0) {
        return cachedTypes;
      }

      // 从配置模板中提取
      const templateKeys = Object.keys(await this.getConfigTemplates());
      return templateKeys;

    } catch (error) {
      console.error('获取支持的节点类型失败:', error);
      return ['custom'];
    }
  }

  /**
   * 检查API密钥有效性
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      if (!apiKey || apiKey.length < 10) {
        return false;
      }

      // 这里应该调用实际的API来验证密钥
      // 现在返回模拟结果
      const isValid = apiKey.startsWith('rk_') && apiKey.length > 20;

      return isValid;

    } catch (error) {
      console.error('验证API密钥失败:', error);
      return false;
    }
  }

  // 私有方法

  private async validateParameters(
    nodeType: string,
    parameters: Record<string, any>,
    errors: Record<string, string>
  ): Promise<void> {
    // 根据节点类型验证参数
    const validationRules = await this.getValidationRules(nodeType);
    
    for (const [key, rule] of Object.entries(validationRules)) {
      const value = parameters[key];
      
      // 检查必需参数
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors[key] = `${key} 是必需参数`;
        continue;
      }

      // 检查类型
      if (value !== undefined && rule.type) {
        if (!this.validateType(value, rule.type)) {
          errors[key] = `${key} 必须是 ${rule.type} 类型`;
          continue;
        }
      }

      // 检查范围
      if (value !== undefined && rule.min !== undefined && rule.max !== undefined) {
        if (typeof value === 'number' && (value < rule.min || value > rule.max)) {
          errors[key] = `${key} 必须在 ${rule.min} 到 ${rule.max} 之间`;
        }
      }
    }
  }

  private validateType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string': return typeof value === 'string';
      case 'number': return typeof value === 'number';
      case 'boolean': return typeof value === 'boolean';
      case 'array': return Array.isArray(value);
      case 'object': return typeof value === 'object' && value !== null;
      default: return true;
    }
  }

  private async fetchNodeInfoFromSource(nodeType: string): Promise<RunningHubNodeInfo> {
    const templates = await this.getConfigTemplates();
    const template = templates[nodeType] || templates['custom'];

    return {
      nodeType,
      displayName: this.getDisplayName(nodeType),
      description: this.getDescription(nodeType),
      inputFields: this.getInputFields(nodeType),
      outputFields: this.getOutputFields(nodeType),
      supportedVersions: ['1.0', '1.1']
    };
  }

  private async getConfigTemplates(): Promise<Record<string, any>> {
    const types = await this.getSupportedNodeTypes();
    const templates: Record<string, any> = {};
    
    for (const type of types) {
      templates[type] = await this.getConfigTemplate(type);
    }
    
    return templates;
  }

  private async getValidationRules(nodeType: string): Promise<Record<string, any>> {
    // 返回验证规则
    const rules: Record<string, any> = {
      'image-generation': {
        prompt: { required: true, type: 'string' },
        width: { required: true, type: 'number', min: 256, max: 2048 },
        height: { required: true, type: 'number', min: 256, max: 2048 },
        steps: { type: 'number', min: 1, max: 100 }
      },
      'text-processing': {
        operation: { required: true, type: 'string' },
        language: { type: 'string' },
        maxLength: { type: 'number', min: 10, max: 10000 }
      }
    };

    return rules[nodeType] || {};
  }

  private getDisplayName(nodeType: string): string {
    const names: Record<string, string> = {
      'image-generation': '图片生成',
      'image-edit': '图片编辑',
      'text-processing': '文本处理',
      'video-generation': '视频生成',
      'data-analysis': '数据分析',
      'custom': '自定义'
    };
    return names[nodeType] || nodeType;
  }

  private getDescription(nodeType: string): string {
    const descriptions: Record<string, string> = {
      'image-generation': '使用AI生成高质量图片',
      'image-edit': '编辑和优化现有图片',
      'text-processing': '处理和转换文本内容',
      'video-generation': '生成动态视频内容',
      'data-analysis': '分析和处理数据',
      'custom': '自定义处理流程'
    };
    return descriptions[nodeType] || '自定义节点';
  }

  private getInputFields(nodeType: string): any[] {
    // 返回输入字段定义
    return [
      {
        fieldName: 'input',
        fieldType: 'text',
        value: '',
        label: '输入数据',
        required: true
      }
    ];
  }

  private getOutputFields(nodeType: string): any[] {
    // 返回输出字段定义
    return [
      {
        fieldName: 'output',
        fieldType: 'text',
        label: '输出结果'
      }
    ];
  }

  private generateConfigId(config: any): string {
    return `config-${config.nodeType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadConfigsFromStorage(): any[] {
    const configs: any[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('runninghub-config-')) {
        try {
          const config = JSON.parse(localStorage.getItem(key) || '');
          configs.push(config);
        } catch (error) {
          console.error('解析存储的配置失败:', error);
        }
      }
    }
    
    return configs;
  }

  private getDefaultConfig(nodeType: string): any {
    return {
      nodeType,
      version: '1.0',
      parameters: {},
      savedAt: Date.now()
    };
  }
}