import React, { useState, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RotateCcw,
  Trash2,
  Eye
} from 'lucide-react';

interface TaskResult {
  success: boolean;
  data?: any;
  error?: string;
  taskId: string;
  timestamp: number;
}

interface TaskStatus {
  state: 'idle' | 'processing' | 'success' | 'error';
  message: string;
  progress: number;
}

interface RunningHubConfig {
  nodeType: string;
  parameters: Record<string, any>;
  version?: string;
}

interface RunningHubInput {
  fieldName: string;
  fieldType: 'image' | 'text' | 'video' | 'file';
  value: any;
  label: string;
  required: boolean;
}

interface RunningHubTaskManagerProps {
  tasks: TaskResult[];
  onTaskSelect?: (task: TaskResult) => void;
  onClose: () => void;
}

export const RunningHubTaskManager: React.FC<RunningHubTaskManagerProps> = ({
  tasks,
  onTaskSelect,
  onClose
}) => {
  const [selectedTask, setSelectedTask] = useState<TaskResult | null>(null);
  const [filter, setFilter] = useState<'all' | 'success' | 'error' | 'processing'>('all');

  // 获取任务状态图标
  const getTaskIcon = (task: TaskResult) => {
    if (task.success) {
      return <CheckCircle size={16} className="text-green-500" />;
    } else if (task.error) {
      return <XCircle size={16} className="text-red-500" />;
    } else {
      return <Clock size={16} className="text-yellow-500" />;
    }
  };

  // 获取任务状态颜色
  const getTaskColor = (task: TaskResult) => {
    if (task.success) return 'text-green-600 bg-green-50';
    if (task.error) return 'text-red-600 bg-red-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  // 过滤任务
  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'success') return task.success;
    if (filter === 'error') return task.error;
    if (filter === 'processing') return !task.success && !task.error;
    return true;
  });

  // 格式化时间
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 删除任务
  const handleDeleteTask = useCallback((taskId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    // 这里应该调用删除任务的服务
    console.log('删除任务:', taskId);
  }, []);

  // 重试任务
  const handleRetryTask = useCallback((task: TaskResult, event: React.MouseEvent) => {
    event.stopPropagation();
    // 这里应该调用重试任务的服务
    console.log('重试任务:', task.taskId);
  }, []);

  // 查看任务详情
  const handleViewTask = useCallback((task: TaskResult) => {
    setSelectedTask(task);
    onTaskSelect?.(task);
  }, [onTaskSelect]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">任务管理器</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle size={20} />
          </button>
        </div>

        {/* 过滤器和统计 */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-2">
              {[
                { key: 'all', label: '全部', count: tasks.length },
                { key: 'success', label: '成功', count: tasks.filter(t => t.success).length },
                { key: 'error', label: '失败', count: tasks.filter(t => t.error).length },
                { key: 'processing', label: '处理中', count: tasks.filter(t => !t.success && !t.error).length }
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filter === key
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 任务列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock size={48} className="mx-auto mb-4 opacity-50" />
              <div className="text-lg font-medium mb-2">暂无任务记录</div>
              <div className="text-sm">配置参数并执行任务后，任务记录将显示在这里</div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <div
                  key={task.taskId}
                  className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedTask?.taskId === task.taskId ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => handleViewTask(task)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getTaskIcon(task)}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            任务 #{task.taskId.slice(-8)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTaskColor(task)}`}>
                            {task.success ? '成功' : task.error ? '失败' : '处理中'}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-500 mb-2">
                          {formatTime(task.timestamp)}
                        </div>
                        
                        {task.success && task.data && (
                          <div className="text-sm text-gray-700 mb-2">
                            处理完成，返回 {typeof task.data === 'object' ? '对象' : '数据'}
                          </div>
                        )}
                        
                        {task.error && (
                          <div className="text-sm text-red-600 mb-2">
                            错误: {task.error}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewTask(task);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="查看详情"
                      >
                        <Eye size={16} />
                      </button>
                      
                      {!task.success && !task.error && (
                        <button
                          onClick={(e) => handleRetryTask(task, e)}
                          className="p-1 text-gray-400 hover:text-yellow-600"
                          title="重试"
                        >
                          <RotateCcw size={16} />
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => handleDeleteTask(task.taskId, e)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="删除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 任务详情面板 */}
        {selectedTask && (
          <div className="border-t bg-gray-50 p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">任务详情</h4>
            <div className="bg-white rounded border p-3">
              <pre className="text-xs text-gray-600 overflow-x-auto">
                {JSON.stringify(selectedTask, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};