import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Play, Settings, Image, FileText, Video } from 'lucide-react';
import { useRunningHubState } from '../../../hooks/useRunningHubState';
import { RunningHubInputPanel } from './RunningHubInputPanel';
import { RunningHubPreview } from './RunningHubPreview';
import { RunningHubTaskManager } from './RunningHubTaskManager';
import { RunningHubConfigPanel } from './RunningHubConfigPanel';
import { RunningHubStatusIndicator } from './RunningHubStatusIndicator';
import { runningHubServiceFactory } from '../../../services/runningHub/RunningHubServiceFactory';
import { RunningHubUtils } from '../../../utils/runningHubUtils';
import type {
  RunningHubConfig,
  RunningHubInput,
  RunningHubOutput,
  TaskResult,
  TaskStatus
} from '../../../types/runningHub';

interface RunningHubNodeData {
  label: string;
  config: RunningHubConfig;
  inputs: RunningHubInput[];
  outputs: RunningHubOutput[];
  status: TaskStatus;
  progress: number;
  result?: TaskResult;
  isConfigured: boolean;
  apiKey?: string;
}

const SimpleRunningHubNode: React.FC<NodeProps<RunningHubNodeData>> = ({ 
  id, 
  data, 
  selected 
}) => {
  const {
    instantState,
    deepState,
    updateInstantState,
    updateDeepState
  } = useRunningHubState();

  const [showConfig, setShowConfig] = useState(false);
  const [showTaskManager, setShowTaskManager] = useState(false);

  // 获取服务实例
  const taskService = useMemo(() => runningHubServiceFactory.createTaskService(), []);
  const apiService = useMemo(() => runningHubServiceFactory.createApiService(), []);

  // 初始化和监听
  useEffect(() => {
    // 加载默认配置
    const loadDefaultConfig = async () => {
      if (!data.config && data.inputs) {
        try {
          const configService = runningHubServiceFactory.createConfigService();
          const defaultConfig = await configService.getConfigTemplate(data.inputs[0]?.fieldType || 'custom');
          updateDeepState({ currentConfig: defaultConfig });
        } catch (error) {
          console.error('加载默认配置失败:', error);
        }
      }
    };

    loadDefaultConfig();
  }, [data.config, data.inputs, updateDeepState]);

  // 监听任务状态变化
  useEffect(() => {
    if (deepState.lastTask) {
      // 开始轮询任务状态
      const pollStatus = async () => {
        try {
          const status = await taskService.pollTaskStatus(deepState.lastTask!.taskId);
          
          if (status.state === 'success' || status.state === 'error') {
            // 任务完成，更新状态
            const finalTask: TaskResult = {
              ...deepState.lastTask!,
              success: status.state === 'success',
              error: status.state === 'error' ? status.message : undefined,
              timestamp: Date.now()
            };
            
            updateDeepState({ lastTask: finalTask });
            updateInstantState({ isProcessing: false });
          }
        } catch (error) {
          console.error('轮询任务状态失败:', error);
        }
      };

      // 立即检查一次
      pollStatus();
      
      // 设置轮询间隔
      const interval = setInterval(pollStatus, 2000);
      
      return () => clearInterval(interval);
    }
  }, [deepState.lastTask, taskService, updateDeepState, updateInstantState]);

  // 即时预览逻辑
  const handleInputChange = useCallback(async (inputName: string, value: any) => {
    try {
      // 更新即时状态用于预览
      updateInstantState({
        preview: {
          ...instantState.preview,
          [inputName]: value
        },
        isProcessing: true,
        error: null
      });

      // 如果有完整配置，尝试获取即时预览
      if (data.config && data.apiKey) {
        const inputs = [{
          fieldName: inputName,
          fieldType: 'text',
          value,
          label: inputName,
          required: true
        }];

        const previewResult = await apiService.getInstantPreview(data.config, inputs);
        
        if (previewResult.success && previewResult.data) {
          updateInstantState({
            preview: {
              ...instantState.preview,
              [inputName]: value,
              instantPreview: previewResult.data
            }
          });
        }
      }

      // 触发防抖的深度处理
      debouncedProcess(inputName, value);
    } catch (error) {
      updateInstantState({
        isProcessing: false,
        error: error instanceof Error ? error.message : '预览失败'
      });
    }
  }, [instantState.preview, data.config, data.apiKey, apiService, updateInstantState]);

  // 防抖处理函数
  const debouncedProcess = useCallback(
    RunningHubUtils.debounce(async (inputName: string, value: any) => {
      try {
        if (!data.config || !data.apiKey) {
          updateInstantState({ error: '配置或API密钥缺失' });
          return;
        }

        // 构建输入数据
        const inputs: RunningHubInput[] = [{
          fieldName: inputName,
          fieldType: 'text',
          value,
          label: inputName,
          required: true
        }];

        // 提交深度处理任务
        const result: TaskResult = await taskService.submitTask(data.config, inputs, data.apiKey);
        
        updateDeepState({
          lastTask: result,
          taskHistory: [...deepState.taskHistory, result]
        });

        updateInstantState({
          isProcessing: false,
          error: result.success ? null : result.error || '处理失败'
        });

      } catch (error) {
        updateInstantState({
          isProcessing: false,
          error: error instanceof Error ? error.message : '处理失败'
        });
      }
    }, 300),
    [data.config, data.apiKey, taskService, deepState.taskHistory, updateInstantState, updateDeepState]
  );

  // 节点类型图标映射
  const getNodeIcon = useCallback((nodeType: string) => {
    const iconMap = {
      'image': Image,
      'text': FileText,
      'video': Video,
      'default': Settings
    };
    return iconMap[nodeType as keyof typeof iconMap] || iconMap.default;
  }, []);

  // 节点样式
  const nodeStyle = useMemo(() => ({
    padding: '10px',
    borderRadius: '8px',
    border: selected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
    boxShadow: selected ? '0 0 0 1px #3b82f6' : '0 1px 3px rgba(0,0,0,0.1)',
    minWidth: '200px',
    maxWidth: '300px',
    minHeight: '400px'
  }), [selected]);

  const IconComponent = getNodeIcon(data.config?.nodeType || 'default');

  return (
    <div style={nodeStyle}>
      {/* 节点头部 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <IconComponent size={16} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-900">
            {data.label || 'RunningHub节点'}
          </span>
        </div>
        
        <div className="flex gap-1">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-1 hover:bg-gray-100 rounded"
            title="配置"
          >
            <Settings size={14} />
          </button>
          
          <button
            onClick={() => setShowTaskManager(!showTaskManager)}
            className="p-1 hover:bg-gray-100 rounded"
            title="任务管理"
          >
            <Play size={14} />
          </button>
        </div>
      </div>

      {/* 状态指示器 */}
      <RunningHubStatusIndicator 
        status={data.status}
        progress={data.progress}
        error={instantState.error}
      />

      {/* 输入面板 */}
      {data.inputs && data.inputs.length > 0 && (
        <RunningHubInputPanel
          inputs={data.inputs}
          preview={instantState.preview}
          onChange={handleInputChange}
          isProcessing={instantState.isProcessing}
        />
      )}

      {/* 即时预览 */}
      <RunningHubPreview
        preview={instantState.preview}
        isProcessing={instantState.isProcessing}
        error={instantState.error}
      />

      {/* 连接点 */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-green-500"
      />

      {/* 配置面板 */}
      {showConfig && (
        <RunningHubConfigPanel
          config={data.config}
          onChange={(newConfig) => {
            updateDeepState({ currentConfig: newConfig });
          }}
          onClose={() => setShowConfig(false)}
        />
      )}

      {/* 任务管理器 */}
      {showTaskManager && (
        <RunningHubTaskManager
          tasks={deepState.taskHistory}
          onTaskSelect={(task) => {
            updateInstantState({ selectedTask: task });
          }}
          onClose={() => setShowTaskManager(false)}
        />
      )}
    </div>
  );
};

export default SimpleRunningHubNode;