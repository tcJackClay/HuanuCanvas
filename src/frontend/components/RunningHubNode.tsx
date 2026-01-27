import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { CanvasNodeData } from '../index';
import { useTheme } from '../../../contexts/ThemeContext';
import { X, Upload, Play, RefreshCw, Check, AlertCircle, Image, Music, Video, File, ChevronDown, ChevronUp, Settings, Loader2 } from 'lucide-react';
import type { RunningHubNode, RunningHubCover, NodeType } from '@/src/shared/types/pebblingTypes';
import { getNodeTypeColor } from '@/src/shared/types/pebblingTypes';
import RunningHubResultModal from '../../RunningHubResultModal';

interface RunningHubCanvasNodeData extends CanvasNodeData {
  webappId?: string;
  apiKey?: string;
  inputFields?: RunningHubNode[];
  onOpenConfig?: () => void;
  onTaskComplete?: (output: any) => void; // 新增：任务完成回调
}

type TaskStatus = 'idle' | 'running' | 'success' | 'failed';

interface TaskResult {
  status: TaskStatus;
  output?: any; // 支持任意格式的输出数据
  error?: string;
}

const RunningHubNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const { theme } = useTheme();
  const nodeData = data as RunningHubCanvasNodeData;
  const [nodes, setNodes] = useState<RunningHubNode[]>([]);
  const [covers, setCovers] = useState<RunningHubCover[]>([]);
  const [selectedCover, setSelectedCover] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('idle');
  const [taskResult, setTaskResult] = useState<TaskResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 任务完成回调 - 用于接收RunningHubNodeContent中的任务完成通知
  const handleContentTaskComplete = (output: any) => {
    console.log('[RunningHubNode] 收到任务完成通知:', output);
    
    // 解析输出数据
    let files: any[] = [];
    if (Array.isArray(output)) {
      files = output;
    } else if (output.files) {
      files = output.files;
    } else if (output.images || output.videos) {
      // 转换统一格式
      if (output.images) {
        output.images.forEach((url: string, i: number) => {
          files.push({ fileUrl: url, fileType: 'png', fileName: `图片_${i + 1}` });
        });
      }
      if (output.videos) {
        output.videos.forEach((url: string, i: number) => {
          files.push({ fileUrl: url, fileType: 'mp4', fileName: `视频_${i + 1}` });
        });
      }
    }
    
    // 更新任务结果并打开结果窗口
    setTaskResult({
      status: 'success',
      output: output
    });
    setShowResultModal(true);
    
    // 通知父组件
    if (nodeData.onTaskComplete) {
      nodeData.onTaskComplete(output);
    }
  };

  // 检查是否已配置
  useEffect(() => {
    const configured = !!(nodeData.webappId && nodeData.apiKey);
    setIsConfigured(configured);
    
    if (configured) {
      // 如果有 inputFields，直接使用，否则从 API 获取
      if (nodeData.inputFields && nodeData.inputFields.length > 0) {
        setNodes(nodeData.inputFields);
        setExpandedNodes(new Set(nodeData.inputFields.map((n: RunningHubNode) => n.nodeId)));
      } else {
        fetchNodeInfo();
      }
    }
  }, [nodeData.webappId, nodeData.apiKey, nodeData.inputFields]);

  const fetchNodeInfo = async () => {
    if (!nodeData.webappId || !nodeData.apiKey) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/runninghub/node-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          webappId: nodeData.webappId, 
          apiKey: nodeData.apiKey 
        })
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.details || data.error || `HTTP ${response.status}: 获取节点信息失败`);
      }
      
      // 处理不同的响应格式
      let nodeInfoList: RunningHubNode[] = [];
      let covers: RunningHubCover[] = [];
      
      if (data.data?.code === 0 && data.data?.data?.nodeInfoList) {
        nodeInfoList = data.data.data.nodeInfoList;
        covers = data.data.data.covers || [];
      } else if (data.code === 0 && data.data?.nodeInfoList) {
        nodeInfoList = data.data.nodeInfoList;
        covers = data.data.covers || [];
      } else if (data.data?.nodeInfoList) {
        nodeInfoList = data.data.nodeInfoList;
        covers = data.data.covers || [];
      } else if (Array.isArray(data)) {
        nodeInfoList = data;
      }
      
      setNodes(nodeInfoList);
      if (nodeInfoList.length > 0) {
        setExpandedNodes(new Set(nodeInfoList.map((n: RunningHubNode) => n.nodeId)));
      }
      setCovers(covers);
      if (covers.length > 0) {
        setSelectedCover(covers[0].url);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`获取节点信息失败: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleNodeExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const updateNodeValue = (nodeId: string, value: string) => {
    setNodes(prev => prev.map(node =>
      node.nodeId === nodeId ? { ...node, fieldValue: value } : node
    ));
  };

  const handleFileUpload = async (node: RunningHubNode, file: File) => {
    if (!nodeData.apiKey) return;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', node.fileType || 'input');
    formData.append('apiKey', nodeData.apiKey);

    try {
      const response = await fetch('/api/runninghub/upload-file', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        updateNodeValue(node.nodeId, data.thirdPartyResponse?.data?.filePath || file.name);
      } else {
        setError('文件上传失败');
      }
    } catch (err) {
      setError('文件上传失败');
    }
  };

  const handleSubmitTask = async () => {
    if (!nodeData.webappId || !nodeData.apiKey) return;
    
    setIsSubmitting(true);
    setTaskStatus('running');
    setError(null);
    setTaskResult(null);

    const nodeInfoList2 = nodes.map(node => ({
      nodeId: node.nodeId,
      fieldName: node.fieldName,
      fieldValue: node.fieldValue || ''
    }));

    try {
      const response = await fetch('/api/runninghub/submit-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webappId: nodeData.webappId,
          nodeInfoList2,
          apiKey: nodeData.apiKey
        })
      });
      const data = await response.json();

      if (data.success && data.data?.taskId) {
        pollTaskStatus(data.data.taskId);
      } else {
        setTaskStatus('failed');
        setTaskResult({ status: 'failed', error: data.message || '提交任务失败' });
      }
    } catch (err) {
      setTaskStatus('failed');
      setTaskResult({ status: 'failed', error: '提交任务失败' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const pollTaskStatus = (taskId: string) => {
    if (!nodeData.apiKey) return;
    
    let attempts = 0;
    const maxAttempts = 120;
    const delayMs = 3000;

    const poll = async () => {
      attempts++;
      try {
        const response = await fetch(`/api/runninghub/task-status/${taskId}?apiKey=${encodeURIComponent(nodeData.apiKey || '')}`);
        const data = await response.json();

        if (data.status === 'success') {
          setTaskStatus('success');
          setTaskResult({ status: 'success', output: data.data });
          setShowResultModal(true); // 自动打开结果窗口
          // 通知父组件创建输出节点
          if (nodeData.onTaskComplete && data.data) {
            console.log('[RunningHubNode] 通知父组件创建输出节点');
            nodeData.onTaskComplete(data.data);
          }
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
        } else if (data.status === 'failed') {
          setTaskStatus('failed');
          setTaskResult({ status: 'failed', error: data.message || '任务执行失败' });
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
        } else if (attempts >= maxAttempts) {
          setTaskStatus('failed');
          setTaskResult({ status: 'failed', error: '任务执行超时' });
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
        }
      } catch (err) {
        console.error('轮询任务状态失败:', err);
      }
    };

    pollingIntervalRef.current = setInterval(poll, delayMs);
  };

  const getNodeIcon = (nodeType: string) => {
    switch (nodeType) {
      case 'STRING':
        return <File className="w-4 h-4" />;
      case 'LIST':
        return <ChevronDown className="w-4 h-4" />;
      case 'IMAGE':
        return <Image className="w-4 h-4" />;
      case 'AUDIO':
        return <Music className="w-4 h-4" />;
      case 'VIDEO':
        return <Video className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  const renderNodeInput = (node: RunningHubNode) => {
    switch (node.nodeType) {
      case 'STRING':
        return (
          <textarea
            value={node.fieldValue || ''}
            onChange={(e) => updateNodeValue(node.nodeId, e.target.value)}
            placeholder={node.placeholder || `请输入${node.nodeName}`}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
            style={{
              backgroundColor: theme.colors.bgTertiary,
              color: theme.colors.textPrimary,
              borderColor: theme.colors.border,
              border: `1px solid ${theme.colors.border}`
            }}
            rows={2}
          />
        );

      case 'LIST':
        return (
          <div className="relative">
            <select
              value={node.fieldValue || ''}
              onChange={(e) => updateNodeValue(node.nodeId, e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none appearance-none cursor-pointer"
              style={{
                backgroundColor: theme.colors.bgTertiary,
                color: theme.colors.textPrimary,
                borderColor: theme.colors.border,
                border: `1px solid ${theme.colors.border}`
              }}
            >
              <option value="">请选择{node.nodeName}</option>
              {node.options?.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: theme.colors.textMuted }} />
          </div>
        );

      case 'IMAGE':
      case 'AUDIO':
      case 'VIDEO':
      case 'INPUT':
        return (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(node, file);
                }
              }}
              accept={node.nodeType === 'IMAGE' ? 'image/*' : node.nodeType === 'AUDIO' ? 'audio/*' : node.nodeType === 'VIDEO' ? 'video/*' : '*'}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors w-full"
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}
            >
              <Upload className="w-3 h-3" />
              上传文件
            </button>
            {node.fieldValue && (
              <div className="mt-1 text-xs flex items-center gap-1" style={{ color: theme.colors.textSecondary }}>
                <Check className="w-3 h-3 text-green-400" />
                已选择
              </div>
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={node.fieldValue || ''}
            onChange={(e) => updateNodeValue(node.nodeId, e.target.value)}
            placeholder={node.placeholder || `请输入${node.nodeName}`}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: theme.colors.bgTertiary,
              color: theme.colors.textPrimary,
              borderColor: theme.colors.border,
              border: `1px solid ${theme.colors.border}`
            }}
          />
        );
    }
  };

  const nodeColors = getNodeTypeColor('runninghub' as NodeType);

  return (
    <>
      <div
        className={`rounded-2xl border-2 overflow-hidden transition-all backdrop-blur-xl min-w-[280px] max-w-[400px]`}
        style={{
          borderColor: selected ? '#f59e0b' : `${nodeColors.primary}`,
          background: `linear-gradient(135deg, ${nodeColors.primary}33, ${nodeColors.primary}22)`,
          boxShadow: selected ? '0 10px 40px -10px rgba(245, 158, 11, 0.4)' : '0 4px 20px -4px rgba(0,0,0,0.5)',
        }}
      >
        {/* 输入连接点 */}
        <Handle
          type="target"
          position={Position.Left}
          className="!w-4 !h-4 !bg-green-400 !border-2 !border-green-600 hover:!scale-125 transition-transform"
        />

        {/* 节点头部 */}
        <div 
          className="px-4 py-3 flex items-center gap-3 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <span className="text-sm font-bold text-green-300 flex-1">RunningHub</span>
          <div className="flex items-center gap-1">
            <button
              onClick={fetchNodeInfo}
              disabled={isLoading || !isConfigured}
              className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-gray-300 transition-all disabled:opacity-50"
              title="刷新节点"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => nodeData.onOpenConfig?.()}
              className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-gray-300 transition-all"
              title="配置"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => nodeData.onDelete?.(id)}
              className="w-6 h-6 rounded-lg bg-white/10 hover:bg-red-500/30 flex items-center justify-center text-gray-400 hover:text-red-300 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            {/* 查看结果按钮 */}
            {taskResult && taskResult.status === 'success' && (
              <button
                onClick={() => setShowResultModal(true)}
                className="w-6 h-6 rounded-lg bg-green-500/20 hover:bg-green-500/30 flex items-center justify-center text-green-400 hover:text-green-300 transition-all"
                title="查看结果"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 封面预览区 */}
        <div className="relative" style={{ height: '120px', background: 'rgba(0,0,0,0.3)' }}>
          {selectedCover ? (
            <img 
              src={selectedCover} 
              alt="封面预览" 
              className="w-full h-full object-cover"
              style={{ opacity: 0.8 }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-400 text-lg">🏃</span>
                </div>
                <span className="text-xs text-gray-400">
                  {!isConfigured ? '未配置' : '加载封面中...'}
                </span>
              </div>
            </div>
          )}
          
          {/* 状态指示器 */}
          {taskStatus && taskStatus !== 'idle' && (
            <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{
              background: taskStatus === 'running' ? '#3b82f6' : taskStatus === 'success' ? '#22c55e' : '#ef4444'
            }}>
              {taskStatus === 'running' ? (
                <Loader2 className="w-3 h-3 text-white animate-spin" />
              ) : taskStatus === 'success' ? (
                <Check className="w-3 h-3 text-white" />
              ) : (
                <AlertCircle className="w-3 h-3 text-white" />
              )}
            </div>
          )}
        </div>

        {/* 配置状态提示 */}
        {!isConfigured && (
          <div className="px-4 py-3 bg-green-500/10 border-t border-green-500/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-green-400" />
              <span className="text-xs text-green-400">请先配置 webappId 和 apiKey</span>
            </div>
          </div>
        )}

        {/* 节点配置列表 */}
        {isConfigured && (
          <div className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-20">
                <Loader2 className="w-5 h-5 animate-spin text-green-400" />
              </div>
            ) : nodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-20 text-center px-4">
                <span className="text-xs text-gray-400">暂无配置项</span>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {nodes.slice(0, 3).map((node) => (
                  <div
                    key={node.nodeId}
                    className="rounded-lg border overflow-hidden"
                    style={{
                      backgroundColor: theme.colors.bgTertiary,
                      borderColor: expandedNodes.has(node.nodeId) ? 'rgba(245, 158, 11, 0.3)' : theme.colors.border
                    }}
                  >
                    <button
                      onClick={() => toggleNodeExpanded(node.nodeId)}
                      className="w-full px-3 py-2 flex items-center justify-between"
                      style={{ color: theme.colors.textPrimary }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
                          <span style={{ color: '#f59e0b', fontSize: '10px' }}>{getNodeIcon(node.nodeType)}</span>
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-medium">{node.nodeName}</div>
                          <div className="text-xs" style={{ color: theme.colors.textMuted, fontSize: '10px' }}>{node.nodeType}</div>
                        </div>
                      </div>
                      {expandedNodes.has(node.nodeId) ? (
                        <ChevronUp className="w-3 h-3" style={{ color: theme.colors.textMuted }} />
                      ) : (
                        <ChevronDown className="w-3 h-3" style={{ color: theme.colors.textMuted }} />
                      )}
                    </button>

                    {expandedNodes.has(node.nodeId) && (
                      <div 
                        className="px-3 pb-2"
                        style={{ borderTop: `1px solid ${theme.colors.border}` }}
                      >
                        {renderNodeInput(node)}
                      </div>
                    )}
                  </div>
                ))}
                
                {nodes.length > 3 && (
                  <div className="text-center py-1">
                    <span className="text-xs text-gray-400">还有 {nodes.length - 3} 个配置项...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-red-400">{error}</span>
            </div>
          </div>
        )}

        {/* 运行按钮 */}
        <div className="px-4 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <button
            onClick={handleSubmitTask}
            disabled={!isConfigured || isSubmitting || taskStatus === 'running'}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ 
              background: !isConfigured || isSubmitting || taskStatus === 'running'
                ? 'rgba(245, 158, 11, 0.3)' 
                : 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white',
              opacity: !isConfigured || isSubmitting || taskStatus === 'running' ? 0.6 : 1
            }}
          >
            {isSubmitting || taskStatus === 'running' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                运行中...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                运行应用
              </>
            )}
          </button>
        </div>

        {/* 输出连接点 */}
        <Handle
          type="source"
          position={Position.Right}
          className="!w-4 !h-4 !bg-green-400 !border-2 !border-green-600 hover:!scale-125 transition-transform"
        />
      </div>

      {/* 结果展示模态窗口 */}
      <RunningHubResultModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        taskResult={taskResult}
        nodePosition={{ x: 0, y: 0 }} // 这里可以传入实际的节点位置
        title="RunningHub 执行结果"
      />
    </>
  );
};

export default memo(RunningHubNode);