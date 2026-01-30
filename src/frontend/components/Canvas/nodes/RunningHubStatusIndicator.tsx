import React from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader, 
  AlertTriangle,
  Info
} from 'lucide-react';

interface TaskStatus {
  state: 'idle' | 'processing' | 'success' | 'error';
  message: string;
  progress: number;
}

interface RunningHubStatusIndicatorProps {
  status: TaskStatus;
  progress?: number;
  error?: string | null;
  className?: string;
}

export const RunningHubStatusIndicator: React.FC<RunningHubStatusIndicatorProps> = ({
  status,
  progress,
  error = null,
  className = ''
}) => {
  // 确定状态颜色和图标
  const getStatusConfig = (state: string) => {
    switch (state) {
      case 'success':
        return {
          icon: <CheckCircle size={16} />,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: '成功'
        };
      case 'error':
        return {
          icon: <XCircle size={16} />,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: '错误'
        };
      case 'processing':
        return {
          icon: <Loader size={16} className="animate-spin" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: '处理中'
        };
      default:
        return {
          icon: <Clock size={16} />,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: '等待中'
        };
    }
  };

  const config = getStatusConfig(status.state);
  const displayProgress = progress ?? status.progress ?? 0;

  return (
    <div className={`${className}`}>
      {/* 主要状态指示器 */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
        <div className={config.color}>
          {config.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${config.color}`}>
            {config.label}
          </div>
          {status.message && (
            <div className={`text-xs ${config.color} opacity-75 truncate`}>
              {status.message}
            </div>
          )}
        </div>

        {/* 进度条 */}
        {(status.state === 'processing' || displayProgress > 0) && (
          <div className="w-16">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>进度</span>
              <span>{Math.round(displayProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  status.state === 'processing' ? 'bg-blue-500' : 
                  status.state === 'success' ? 'bg-green-500' : 
                  status.state === 'error' ? 'bg-red-500' : 'bg-gray-400'
                }`}
                style={{ width: `${Math.min(displayProgress, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-red-700">
              <div className="font-medium mb-1">错误详情</div>
              <div className="text-red-600">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* 成功信息 */}
      {status.state === 'success' && !error && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
          <div className="flex items-start gap-2">
            <CheckCircle size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-green-700">
              <div className="font-medium mb-1">任务完成</div>
              <div className="text-green-600">
                {status.message || '任务已成功完成'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 等待状态提示 */}
      {status.state === 'idle' && (
        <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
          <div className="flex items-start gap-2">
            <Info size={14} className="text-gray-600 mt-0.5 flex-shrink-0" />
            <div className="text-gray-600">
              <div className="font-medium mb-1">等待配置</div>
              <div className="text-gray-500">
                请配置节点参数并提供输入数据
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 状态历史（简化版） */}
      {status.state === 'processing' && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>开始时间: {new Date().toLocaleTimeString('zh-CN')}</span>
            <span>预计剩余: {Math.max(0, Math.ceil((100 - displayProgress) / 10))}秒</span>
          </div>
        </div>
      )}
    </div>
  );
};

// 紧凑版状态指示器（用于小空间）
export const CompactStatusIndicator: React.FC<RunningHubStatusIndicatorProps> = ({
  status,
  className = ''
}) => {
  const getStatusConfig = (state: string) => {
    switch (state) {
      case 'success':
        return {
          icon: <CheckCircle size={12} />,
          color: 'text-green-600'
        };
      case 'error':
        return {
          icon: <XCircle size={12} />,
          color: 'text-red-600'
        };
      case 'processing':
        return {
          icon: <Loader size={12} className="animate-spin" />,
          color: 'text-blue-600'
        };
      default:
        return {
          icon: <Clock size={12} />,
          color: 'text-gray-400'
        };
    }
  };

  const config = getStatusConfig(status.state);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className={config.color}>
        {config.icon}
      </div>
      {status.message && (
        <span className="text-xs text-gray-600 truncate max-w-24">
          {status.message}
        </span>
      )}
    </div>
  );
};