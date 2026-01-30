import React, { useMemo } from 'react';
import { NodeProps } from '@xyflow/react';
import SimpleRunningHubNode from './SimpleRunningHubNode';
import RunningHubNodeAdapter from './RunningHubNodeAdapter';
import type { CanvasNodeData } from '../index';
import type {
  RunningHubConfig,
  RunningHubInput,
  TaskResult,
  TaskStatus
} from '../../../types/runningHub';

// 旧接口定义
interface RunningHubCanvasNodeData extends CanvasNodeData {
  webappId?: string;
  apiKey?: string;
  inputFields?: any[];
  onOpenConfig?: () => void;
  onTaskComplete?: (output: any) => void;
}

// 迁移包装器组件
const RunningHubMigrationWrapper: React.FC<NodeProps<CanvasNodeData>> = ({ 
  id, 
  data, 
  selected 
}) => {
  // 检测数据格式和自动适配
  const adaptedData = useMemo(() => {
    // 检测是否为新格式数据
    const isNewFormat = data.config && data.inputs && data.outputs;
    
    if (isNewFormat) {
      // 新格式数据，直接使用
      return data;
    } else {
      // 旧格式数据，使用适配器转换
      console.log('[RunningHubMigrationWrapper] 检测到旧格式数据，正在适配...');
      const oldData = data as RunningHubCanvasNodeData;
      const adapted = RunningHubNodeAdapter.adaptOldToNew(oldData);
      
      // 验证适配结果
      const validation = RunningHubNodeAdapter.validateAdaptedData(adapted);
      if (!validation.valid) {
        console.error('[RunningHubMigrationWrapper] 适配验证失败:', validation.errors);
        // 返回默认数据以防止崩溃
        return RunningHubNodeAdapter.createDefaultNewData({ label: data.label || 'RunningHub节点' });
      }
      
      return adapted;
    }
  }, [data]);
  
  // 渲染新组件
  return (
    <SimpleRunningHubNode
      id={id}
      data={adaptedData}
      selected={selected}
    />
  );
};

export default RunningHubMigrationWrapper;

// 辅助函数：检查节点数据是否为新格式
export const isNewRunningHubData = (data: CanvasNodeData): boolean => {
  return !!(data.config && data.inputs && data.outputs);
};

// 辅助函数：创建新格式的RunningHub节点数据
export const createNewRunningHubNodeData = (
  config: Partial<RunningHubConfig>,
  inputs: Partial<RunningHubInput>[],
  apiKey?: string,
  label?: string
) => {
  return {
    label: label || 'RunningHub节点',
    type: 'runninghub' as const,
    config: {
      nodeType: 'custom',
      parameters: {},
      version: '1.0',
      ...config
    },
    inputs: inputs.map(input => ({
      fieldName: 'prompt',
      fieldType: 'text' as const,
      value: '',
      label: '输入',
      required: true,
      ...input
    })),
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
    } as TaskStatus,
    progress: 0,
    result: undefined,
    isConfigured: !!(config && apiKey),
    apiKey
  };
};
