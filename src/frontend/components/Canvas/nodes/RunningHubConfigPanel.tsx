import React, { useState, useCallback } from 'react';
import { 
  Settings, 
  Key, 
  Info, 
  CheckCircle, 
  XCircle, 
  Save,
  RotateCcw
} from 'lucide-react';

interface RunningHubConfig {
  nodeType: string;
  parameters: Record<string, any>;
  version?: string;
}

interface RunningHubConfigPanelProps {
  config: RunningHubConfig;
  onChange: (config: RunningHubConfig) => void;
  onClose: () => void;
}

export const RunningHubConfigPanel: React.FC<RunningHubConfigPanelProps> = ({
  config,
  onChange,
  onClose
}) => {
  const [localConfig, setLocalConfig] = useState<RunningHubConfig>(config);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  // 验证配置
  const validateConfig = useCallback(async (config: RunningHubConfig): Promise<Record<string, string>> => {
    const errors: Record<string, string> = {};
    
    // 基本验证
    if (!config.nodeType) {
      errors.nodeType = '节点类型不能为空';
    }
    
    // 参数验证
    if (config.parameters) {
      Object.entries(config.parameters).forEach(([key, value]) => {
        if (typeof value === 'string' && !value.trim()) {
          errors[key] = '参数值不能为空';
        }
      });
    }
    
    return errors;
  }, []);

  // 节点类型选项
  const nodeTypeOptions = [
    { value: 'image-generation', label: '图片生成', description: '使用AI生成图片' },
    { value: 'image-edit', label: '图片编辑', description: '编辑现有图片' },
    { value: 'text-processing', label: '文本处理', description: '处理和转换文本' },
    { value: 'video-generation', label: '视频生成', description: '生成视频内容' },
    { value: 'data-analysis', label: '数据分析', description: '分析和处理数据' },
    { value: 'custom', label: '自定义', description: '自定义处理流程' }
  ];

  // 参数配置模板
  const getParameterTemplate = (nodeType: string) => {
    switch (nodeType) {
      case 'image-generation':
        return {
          prompt: '',
          width: 512,
          height: 512,
          style: 'realistic',
          quality: 'high'
        };
      case 'image-edit':
        return {
          editType: 'enhance',
          intensity: 0.8,
          preserveOriginal: true
        };
      case 'text-processing':
        return {
          operation: 'summarize',
          language: 'zh-CN',
          maxLength: 200
        };
      case 'video-generation':
        return {
          duration: 5,
          fps: 24,
          resolution: '720p'
        };
      default:
        return {};
    }
  };

  // 处理节点类型变化
  const handleNodeTypeChange = useCallback((nodeType: string) => {
    const newParameters = getParameterTemplate(nodeType);
    const newConfig = {
      ...localConfig,
      nodeType,
      parameters: {
        ...localConfig.parameters,
        ...newParameters
      }
    };
    
    setLocalConfig(newConfig);
  }, [localConfig]);

  // 处理参数变化
  const handleParameterChange = useCallback((key: string, value: any) => {
    const newConfig = {
      ...localConfig,
      parameters: {
        ...localConfig.parameters,
        [key]: value
      }
    };
    
    setLocalConfig(newConfig);
    
    // 清除相关验证错误
    if (validationErrors[key]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  }, [localConfig, validationErrors]);

  // 保存配置
  const handleSave = useCallback(async () => {
    setIsValidating(true);
    
    try {
      const errors = await validateConfig(localConfig);
      setValidationErrors(errors);
      
      if (Object.keys(errors).length === 0) {
        onChange(localConfig);
        onClose();
      }
    } catch (error) {
      console.error('验证配置失败:', error);
    } finally {
      setIsValidating(false);
    }
  }, [localConfig, validateConfig, onChange, onClose]);

  // 重置配置
  const handleReset = useCallback(() => {
    const defaultConfig = {
      nodeType: 'custom',
      parameters: {},
      version: '1.0'
    };
    setLocalConfig(defaultConfig);
    setValidationErrors({});
  }, []);

  // 渲染参数配置
  const renderParameterConfig = () => {
    const parameters = localConfig.parameters || {};
    
    return Object.entries(parameters).map(([key, value]) => (
      <div key={key} className="space-y-1">
        <label className="text-sm font-medium text-gray-700">
          {key}
          {typeof value === 'boolean' && (
            <span className="text-xs text-gray-500 ml-2">(布尔值)</span>
          )}
          {typeof value === 'number' && (
            <span className="text-xs text-gray-500 ml-2">(数值)</span>
          )}
        </label>
        
        {typeof value === 'boolean' ? (
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleParameterChange(key, e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-600">
              {value ? '启用' : '禁用'}
            </span>
          </label>
        ) : typeof value === 'number' ? (
          <input
            type="number"
            value={value}
            onChange={(e) => handleParameterChange(key, parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => handleParameterChange(key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={`输入${key}...`}
          />
        )}
        
        {validationErrors[key] && (
          <div className="text-xs text-red-600 flex items-center gap-1">
            <XCircle size={12} />
            {validationErrors[key]}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Settings size={20} className="text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">RunningHub 配置</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle size={20} />
          </button>
        </div>

        {/* 配置内容 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 节点类型选择 */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Info size={14} />
              节点类型
            </label>
            <select
              value={localConfig.nodeType}
              onChange={(e) => handleNodeTypeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {nodeTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              {nodeTypeOptions.find(opt => opt.value === localConfig.nodeType)?.description}
            </p>
          </div>

          {/* API密钥 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Key size={14} />
              API 密钥
            </label>
            <input
              type="password"
              placeholder="输入RunningHub API密钥..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500">
              用于访问RunningHub API服务的认证密钥
            </p>
          </div>

          {/* 参数配置 */}
          {localConfig.parameters && Object.keys(localConfig.parameters).length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">参数配置</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderParameterConfig()}
              </div>
            </div>
          )}

          {/* 验证状态 */}
          {Object.keys(validationErrors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle size={16} className="text-red-600" />
                <span className="text-sm font-medium text-red-800">配置验证失败</span>
              </div>
              <ul className="text-xs text-red-700 space-y-1">
                {Object.entries(validationErrors).map(([key, error]) => (
                  <li key={key}>• {key}: {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <RotateCcw size={16} />
            重置
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={isValidating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isValidating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent"></div>
                  验证中...
                </>
              ) : (
                <>
                  <Save size={16} />
                  保存配置
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};