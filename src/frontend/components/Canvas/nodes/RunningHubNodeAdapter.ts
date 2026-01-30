import type {
  RunningHubConfig,
  RunningHubInput,
  RunningHubOutput,
  TaskResult,
  TaskStatus
} from '../../../types/runningHub';
import type { CanvasNodeData } from '../index';

// 旧接口定义 (从原始RunningHubNode.tsx提取)
interface RunningHubCanvasNodeData extends CanvasNodeData {
  webappId?: string;
  apiKey?: string;
  inputFields?: any[];
  onOpenConfig?: () => void;
  onTaskComplete?: (output: any) => void;
}

// 适配器类 - 解决新旧接口不兼容问题
export class RunningHubNodeAdapter {
  
  /**
   * 将旧接口数据转换为新接口格式
   * @param oldData 旧格式的节点数据
   * @returns 新格式的节点数据
   */
  static adaptOldToNew(oldData: RunningHubCanvasNodeData): any {
    const { webappId, apiKey, inputFields, label, onOpenConfig, onTaskComplete } = oldData;
    
    // 转换配置
    const config: RunningHubConfig = {
      nodeType: webappId || 'custom',
      parameters: {},
      version: '1.0'
    };
    
    // 转换输入字段
    const inputs: RunningHubInput[] = (inputFields || []).map((field: any) => ({
      fieldName: field.nodeId || field.fieldName || 'input',
      fieldType: this.mapNodeTypeToFieldType(field.nodeType),
      value: field.fieldValue || '',
      label: field.nodeName || '输入',
      required: field.required || false,
      placeholder: field.placeholder
    }));
    
    // 转换输出字段
    const outputs: RunningHubOutput[] = [
      {
        fieldName: 'result',
        fieldType: 'json',
        label: '执行结果'
      }
    ];
    
    // 转换状态
    const status: TaskStatus = {
      state: 'idle',
      message: '等待配置',
      progress: 0
    };
    
    return {
      label: label || 'RunningHub节点',
      config,
      inputs,
      outputs,
      status,
      progress: 0,
      result: undefined,
      isConfigured: !!(webappId && apiKey),
      apiKey,
      // 保留原始回调函数
      onOpenConfig,
      onTaskComplete
    };
  }
  
  /**
   * 将新接口数据转换回旧接口格式（用于兼容）
   * @param newData 新格式的节点数据
   * @returns 旧格式的节点数据
   */
  static adaptNewToOld(newData: any): RunningHubCanvasNodeData {
    const { config, inputs, apiKey, label } = newData;
    
    // 转换回旧格式
    const inputFields = inputs.map((input: RunningHubInput) => ({
      nodeId: input.fieldName,
      nodeName: input.label,
      nodeType: this.mapFieldTypeToNodeType(input.fieldType),
      fieldValue: input.value,
      required: input.required,
      placeholder: input.placeholder
    }));
    
    return {
      label: label || 'RunningHub节点',
      type: 'runninghub',
      webappId: config.nodeType,
      apiKey,
      inputFields,
      onOpenConfig: () => console.log('配置面板'),
      onTaskComplete: (output: any) => console.log('任务完成:', output)
    };
  }
  
  /**
   * 映射节点类型到字段类型
   * @param nodeType 节点类型
   * @returns 字段类型
   */
  private static mapNodeTypeToFieldType(nodeType: string): 'image' | 'text' | 'video' | 'file' | 'number' | 'boolean' {
    const typeMap: Record<string, 'image' | 'text' | 'video' | 'file' | 'number' | 'boolean'> = {
      'STRING': 'text',
      'IMAGE': 'image',
      'VIDEO': 'video',
      'AUDIO': 'file',
      'INPUT': 'file',
      'LIST': 'text',
      'NUMBER': 'number',
      'BOOLEAN': 'boolean'
    };
    
    return typeMap[nodeType] || 'text';
  }
  
  /**
   * 映射字段类型到节点类型
   * @param fieldType 字段类型
   * @returns 节点类型
   */
  private static mapFieldTypeToNodeType(fieldType: string): string {
    const typeMap: Record<string, string> = {
      'image': 'IMAGE',
      'text': 'STRING',
      'video': 'VIDEO',
      'file': 'INPUT',
      'number': 'NUMBER',
      'boolean': 'BOOLEAN'
    };
    
    return typeMap[fieldType] || 'STRING';
  }
  
  /**
   * 验证适配后的数据完整性
   * @param data 适配后的数据
   * @returns 验证结果
   */
  static validateAdaptedData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.label) {
      errors.push('缺少标签字段');
    }
    
    if (!data.config) {
      errors.push('缺少配置字段');
    }
    
    if (!data.inputs || !Array.isArray(data.inputs)) {
      errors.push('缺少输入字段或格式错误');
    }
    
    if (!data.outputs || !Array.isArray(data.outputs)) {
      errors.push('缺少输出字段或格式错误');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * 创建默认的新格式节点数据
   * @param overrides 覆盖字段
   * @returns 默认节点数据
   */
  static createDefaultNewData(overrides: Partial<any> = {}): any {
    const defaultData = {
      label: 'RunningHub节点',
      config: {
        nodeType: 'custom',
        parameters: {},
        version: '1.0'
      },
      inputs: [
        {
          fieldName: 'prompt',
          fieldType: 'text',
          value: '',
          label: '提示词',
          required: true
        }
      ],
      outputs: [
        {
          fieldName: 'result',
          fieldType: 'json',
          label: '执行结果'
        }
      ],
      status: {
        state: 'idle' as const,
        message: '等待配置',
        progress: 0
      },
      progress: 0,
      result: undefined,
      isConfigured: false,
      apiKey: undefined
    };
    
    return { ...defaultData, ...overrides };
  }
}

export default RunningHubNodeAdapter;
