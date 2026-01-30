import React, { useState, useEffect, useRef } from 'react';
import { RunningHubNode, RunningHubCover } from '../../types/pebblingTypes';
import { useTheme } from '../../contexts/ThemeContext';
import { configService } from '../../services/configService';
import { X, Upload, Play, RefreshCw, Check, AlertCircle, Image, Music, Video, File, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface RunningHubFunction {
  id: string;
  name: string;
  icon: string;
  color: string;
  webappId: string;
  category: string;
  description: string;
  defaultInputs: Record<string, any>;
}

interface RunningHubNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSubmit?: (nodeInfoList2: RunningHubNode[], selectedFunction: RunningHubFunction) => void;
}

type TaskStatus = 'idle' | 'running' | 'success' | 'failed';

interface TaskResult {
  status: TaskStatus;
  output?: {
    images?: string[];
    videos?: string[];
    files?: string[];
    message?: string;
  };
  error?: string;
}

const RunningHubNodeModal: React.FC<RunningHubNodeModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSubmit
}) => {
  const { theme } = useTheme();
  const [nodes, setNodes] = useState<RunningHubNode[]>([]);
  const [covers, setCovers] = useState<RunningHubCover[]>([]);
  const [selectedCover, setSelectedCover] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('idle');
  const [taskResult, setTaskResult] = useState<TaskResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedCovers, setExpandedCovers] = useState<boolean>(true);
  
  // 功能选择相关状态
  const [availableFunctions, setAvailableFunctions] = useState<RunningHubFunction[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<RunningHubFunction | null>(null);
  const [isLoadingFunctions, setIsLoadingFunctions] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 加载可用的RunningHub功能列表
  const loadAvailableFunctions = async () => {
    try {
      setIsLoadingFunctions(true);
      const functions = configService.getRunningHubFunctions();
      console.log('[RunningHubNodeModal] 加载功能列表:', functions);
      setAvailableFunctions(functions);
      
      // 自动选择第一个功能
      if (functions.length > 0 && !selectedFunction) {
        setSelectedFunction(functions[0]);
      }
    } catch (error) {
      console.error('[RunningHubNodeModal] 加载功能列表失败:', error);
      setError('加载功能列表失败');
    } finally {
      setIsLoadingFunctions(false);
    }
  };

  // 处理功能选择变化
  const handleFunctionChange = (functionId: string) => {
    const functionObj = availableFunctions.find(f => f.id === functionId);
    if (functionObj) {
      setSelectedFunction(functionObj);
      // 清空之前的数据
      setNodes([]);
      setCovers([]);
      setError(null);
      setTaskResult(null);
      console.log('[RunningHubNodeModal] 选择功能:', functionObj.name, 'webappId:', functionObj.webappId);
    }
  };

  // 初始化加载功能列表
  useEffect(() => {
    if (isOpen) {
      loadAvailableFunctions();
    }
  }, [isOpen]);

  // 当功能选择改变时，重新获取节点信息
  useEffect(() => {
    if (isOpen && selectedFunction && apiKey) {
      fetchNodeInfo();
    }
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isOpen, selectedFunction, apiKey]);

  const fetchNodeInfo = async () => {
    if (!selectedFunction) {
      setError('请先选择功能');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      console.log('[RunningHubNodeModal] 开始获取节点信息, 功能:', selectedFunction.name, 'webappId:', selectedFunction.webappId);
      const response = await fetch('/api/runninghub/node-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          webappId: selectedFunction.webappId, 
          apiKey: apiKey 
        })
      });
      const data = await response.json();
      console.log('[RunningHubNodeModal] API响应:', JSON.stringify(data, null, 2));
      
      if (!response.ok) {
        throw new Error(data.details || data.error || `HTTP ${response.status}: 获取节点信息失败`);
      }
      
      // 检查后端包装的响应格式 data.data.code === 0
      if (data.data?.code === 0 && data.data?.data?.nodeInfoList) {
        const nodeInfoList = data.data.data.nodeInfoList;
        const covers = data.data.data.covers || [];
        setNodes(nodeInfoList);
        if (nodeInfoList.length > 0) {
          setExpandedNodes(new Set(nodeInfoList.map((n: RunningHubNode) => n.nodeId)));
        }
        setCovers(covers);
        if (covers.length > 0) {
          setSelectedCover(covers[0].url);
        }
      } else if (data.code === 0 && data.data?.nodeInfoList) {
        // 兼容直接的API响应格式
        const nodeInfoList = data.data.nodeInfoList;
        const covers = data.data.covers || [];
        setNodes(nodeInfoList);
        if (nodeInfoList.length > 0) {
          setExpandedNodes(new Set(nodeInfoList.map((n: RunningHubNode) => n.nodeId)));
        }
        setCovers(covers);
        if (covers.length > 0) {
          setSelectedCover(covers[0].url);
        }
      } else if (data.data?.nodeInfoList) {
        // 兼容其他响应格式
        const nodeInfoList = data.data.nodeInfoList;
        const covers = data.data.covers || [];
        setNodes(nodeInfoList);
        if (nodeInfoList.length > 0) {
          setExpandedNodes(new Set(nodeInfoList.map((n: RunningHubNode) => n.nodeId)));
        }
        setCovers(covers);
        if (covers.length > 0) {
          setSelectedCover(covers[0].url);
        }
      } else if (Array.isArray(data)) {
        // 兼容数组格式
        setNodes(data);
        if (data.length > 0) {
          setExpandedNodes(new Set(data.map((n: RunningHubNode) => n.nodeId)));
        }
      } else {
        console.log('[RunningHubNodeModal] 未找到节点信息，响应格式:', data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`获取节点信息失败: ${errorMessage}`);
      console.error('[RunningHubNodeModal] 获取节点信息错误:', err);
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
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', node.fileType || 'input');
    formData.append('apiKey', apiKey);

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
      console.error(err);
    }
  };

  const handleSubmitTask = async () => {
    if (!selectedFunction) {
      setError('请先选择功能');
      return;
    }

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
      console.log('[RunningHubNodeModal] 提交任务, 功能:', selectedFunction.name, 'webappId:', selectedFunction.webappId);
      const response = await fetch('/api/runninghub/submit-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webappId: selectedFunction.webappId,
          nodeInfoList2,
          apiKey
        })
      });
      const data = await response.json();
      console.log('[RunningHubNodeModal] 提交任务响应:', data);

      if (data.success && data.data?.taskId) {
        pollTaskStatus(data.data.taskId);
      } else {
        setTaskStatus('failed');
        setTaskResult({ status: 'failed', error: data.message || '提交任务失败' });
      }
    } catch (err) {
      setTaskStatus('failed');
      setTaskResult({ status: 'failed', error: '提交任务失败' });
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pollTaskStatus = (taskId: string) => {
    let attempts = 0;
    const maxAttempts = 120;
    const delayMs = 3000;

    const poll = async () => {
      attempts++;
      try {
        const response = await fetch(`/api/runninghub/task-status/${taskId}?apiKey=${encodeURIComponent(apiKey)}`);
        const data = await response.json();

        if (data.status === 'success') {
          setTaskStatus('success');
          setTaskResult({ status: 'success', output: data.data });
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          // 任务成功后调用onSubmit回调，传递节点信息和选中的功能
          if (onSubmit && selectedFunction) {
            console.log('[RunningHubNodeModal] 任务成功，调用onSubmit回调');
            onSubmit(nodes, selectedFunction);
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
            rows={3}
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
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}
            >
              <Upload className="w-4 h-4" />
              上传文件
            </button>
            {node.fieldValue && (
              <div className="mt-2 text-xs flex items-center gap-1" style={{ color: theme.colors.textSecondary }}>
                <Check className="w-3 h-3 text-green-400" />
                已选择文件
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* 主弹窗 */}
      <div 
        className="relative w-full max-w-5xl rounded-2xl overflow-hidden animate-fade-in flex flex-col min-w-[400px]"
        style={{
          background: theme.colors.bgPanel,
          border: `1px solid ${theme.colors.border}`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          maxHeight: '90vh',
          minWidth: '400px'
        }}
      >
        {/* 头部 */}
        <div 
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: theme.colors.border }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
            >
              <span className="text-white font-bold">R</span>
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: theme.colors.textPrimary }}>RunningHub 节点配置</h2>
              <p className="text-xs" style={{ color: theme.colors.textSecondary }}>配置节点信息并运行应用</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', color: theme.colors.textSecondary }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 功能选择器 */}
        <div className="mx-6 mt-4">
          <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textPrimary }}>
            选择功能
          </label>
          {isLoadingFunctions ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: theme.colors.bgTertiary }}>
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#f59e0b' }} />
              <span className="text-sm" style={{ color: theme.colors.textSecondary }}>加载功能列表...</span>
            </div>
          ) : (
            <div className="relative">
              <select
                value={selectedFunction?.id || ''}
                onChange={(e) => handleFunctionChange(e.target.value)}
                className="w-full px-3 py-2 pr-8 rounded-lg text-sm outline-none appearance-none"
                style={{
                  backgroundColor: theme.colors.bgTertiary,
                  color: theme.colors.textPrimary,
                  borderColor: theme.colors.border,
                  border: `1px solid ${theme.colors.border}`
                }}
              >
                <option value="">请选择RunningHub功能</option>
                {availableFunctions.map((func) => (
                  <option key={func.id} value={func.id}>
                    {func.icon} {func.name} ({func.category})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: theme.colors.textMuted }} />
            </div>
          )}
          {selectedFunction && (
            <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  <strong>功能:</strong> {selectedFunction.name}
                </span>
                <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: selectedFunction.color + '20', color: selectedFunction.color }}>
                  {selectedFunction.category}
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: theme.colors.textMuted }}>
                {selectedFunction.description}
              </p>
            </div>
          )}
        </div>

        {/* 错误提示 */}
        {error && (
          <div 
            className="mx-6 mt-4 px-4 py-3 rounded-lg flex items-center gap-2"
            style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
          >
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-400">{error}</span>
          </div>
        )}

        {/* 内容区 */}
        <div className="flex-1 overflow-hidden flex">
          {/* 左侧：节点列表 */}
          <div className="flex-1 overflow-y-auto p-4" style={{ borderRight: `1px solid ${theme.colors.border}` }}>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#f59e0b' }} />
                <span className="ml-2" style={{ color: theme.colors.textSecondary }}>加载节点信息中...</span>
              </div>
            ) : nodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <AlertCircle className="w-12 h-12 mb-3" style={{ color: theme.colors.textMuted }} />
                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>暂无可用节点信息</p>
                <button
                  onClick={fetchNodeInfo}
                  className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    color: 'white'
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  重新获取
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {nodes.map((node) => (
                  <div
                    key={node.nodeId}
                    className="rounded-xl border overflow-hidden transition-colors"
                    style={{
                      backgroundColor: theme.colors.bgTertiary,
                      borderColor: expandedNodes.has(node.nodeId) ? 'rgba(245, 158, 11, 0.3)' : theme.colors.border
                    }}
                  >
                    {/* 节点标题栏 */}
                    <button
                      onClick={() => toggleNodeExpanded(node.nodeId)}
                      className="w-full px-4 py-3 flex items-center justify-between"
                      style={{ color: theme.colors.textPrimary }}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: 'rgba(245, 158, 11, 0.15)' }}
                        >
                          <span style={{ color: '#f59e0b' }}>{getNodeIcon(node.nodeType)}</span>
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium">{node.nodeName}</div>
                          <div className="text-xs" style={{ color: theme.colors.textMuted }}>{node.nodeType}</div>
                        </div>
                      </div>
                      {expandedNodes.has(node.nodeId) ? (
                        <ChevronUp className="w-4 h-4" style={{ color: theme.colors.textMuted }} />
                      ) : (
                        <ChevronDown className="w-4 h-4" style={{ color: theme.colors.textMuted }} />
                      )}
                    </button>

                    {/* 节点内容 */}
                    {expandedNodes.has(node.nodeId) && (
                      <div 
                        className="px-4 pb-4"
                        style={{ borderTop: `1px solid ${theme.colors.border}` }}
                      >
                        {renderNodeInput(node)}
                        {node.cover && (
                          <div className="mt-2">
                            <img src={node.cover} alt={node.nodeName} className="w-20 h-20 rounded-lg object-cover" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 右侧：封面图预览 */}
          <div className="w-80 p-4 flex flex-col" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
            <button
              onClick={() => setExpandedCovers(!expandedCovers)}
              className="flex items-center justify-between mb-3"
            >
              <span className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>封面预览</span>
              {expandedCovers ? (
                <ChevronUp className="w-4 h-4" style={{ color: theme.colors.textMuted }} />
              ) : (
                <ChevronDown className="w-4 h-4" style={{ color: theme.colors.textMuted }} />
              )}
            </button>

            {expandedCovers && (
              <div className="flex-1 overflow-y-auto">
                {covers.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-center">
                    <span className="text-xs" style={{ color: theme.colors.textMuted }}>暂无封面图</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {covers.map((cover) => (
                      <button
                        key={cover.id}
                        onClick={() => setSelectedCover(cover.url)}
                        className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                          selectedCover === cover.url ? 'border-green-500' : 'border-transparent'
                        }`}
                      >
                        <img src={cover.url} alt={cover.name || '封面'} className="w-full h-24 object-cover" />
                        {selectedCover === cover.url && (
                          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                            <Check className="w-6 h-6 text-green-400" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* 选中封面大图预览 */}
                {selectedCover && (
                  <div className="mt-4">
                    <div className="text-xs font-medium mb-2" style={{ color: theme.colors.textSecondary }}>预览</div>
                    <div className="rounded-lg overflow-hidden border" style={{ borderColor: theme.colors.border }}>
                      <img src={selectedCover} alt="预览" className="w-full h-48 object-contain" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 任务结果 */}
            {taskResult && (
              <div className="mt-4 p-3 rounded-lg border" style={{ 
                backgroundColor: taskResult.status === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                borderColor: taskResult.status === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'
              }}>
                <div className="flex items-center gap-2 mb-2">
                  {taskResult.status === 'success' ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-sm font-medium" style={{ 
                    color: taskResult.status === 'success' ? '#4ade80' : '#f87171'
                  }}>
                    {taskResult.status === 'success' ? '任务成功' : '任务失败'}
                  </span>
                </div>
                {taskResult.error && (
                  <p className="text-xs" style={{ color: '#f87171' }}>{taskResult.error}</p>
                )}
                {taskResult.output && (
                  <div className="mt-2">
                    {taskResult.output.images?.map((url, index) => (
                      <img key={index} src={url} alt={`结果 ${index + 1}`} className="w-full h-32 object-contain rounded-lg mt-2" />
                    ))}
                    {taskResult.output.videos?.map((url, index) => (
                      <video key={index} src={url} controls className="w-full h-32 rounded-lg mt-2" />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 底部操作区 */}
        <div 
          className="flex items-center justify-between px-6 py-4 border-t"
          style={{ borderColor: theme.colors.border, backgroundColor: 'rgba(10, 10, 10, 0.95)' }}
        >
          <button
            onClick={fetchNodeInfo}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.06)', 
              color: theme.colors.textSecondary,
              opacity: isLoading ? 0.5 : 1
            }}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            刷新节点
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm transition-colors"
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.06)', 
                color: theme.colors.textSecondary
              }}
            >
              取消
            </button>
            <button
              onClick={handleSubmitTask}
              disabled={isSubmitting || taskStatus === 'running'}
              className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ 
                background: isSubmitting || taskStatus === 'running' 
                  ? 'rgba(245, 158, 11, 0.3)' 
                  : 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: 'white',
                opacity: isSubmitting || taskStatus === 'running' ? 0.7 : 1
              }}
            >
              {isSubmitting || taskStatus === 'running' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {taskStatus === 'running' ? '执行中...' : '提交中...'}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  运行应用
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default RunningHubNodeModal;
