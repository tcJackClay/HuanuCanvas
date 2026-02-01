import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Upload, Play, Check, AlertCircle, Image, Music, Video, Loader2, FolderOpen } from 'lucide-react';
import type { RunningHubNode as RunningHubNodeType, RunningHubCover } from '@/shared/types/pebblingTypes';
import { getNodeTypeColor } from '@/shared/types/pebblingTypes';
import { useFileUpload } from '../hooks/useFileUpload';
import { useTaskSubmit } from '../hooks/useTaskSubmit';
import { useTheme } from '../contexts/ThemeContext';

interface RunningHubNodeContentData {
  id?: string;
  inputFields?: RunningHubNodeType[];
  covers?: RunningHubCover[];
  inputPortConfig?: {
    types: string[];
    connectedNodeId?: string;
  };
  outputPortConfig?: {
    type: string;
    result?: TaskOutput;
  };
  onPortClick?: (nodeId: string, portType: 'in' | 'out', pos: { x: number; y: number }) => void;
  onReceiveInput?: (nodeId: string, data: { type: string; content: string }) => void;
  onExecute?: () => void;
  onStop?: () => void;
  onTaskComplete?: (output: TaskOutput) => void;
  isRunning?: boolean;
  isSelected?: boolean;
}

interface TaskOutput {
  images?: string[];
  videos?: string[];
  files?: Array<{ fileUrl: string; fileName?: string; fileType?: string }>;
  message?: string;
}

interface RunningHubNodeContentProps {
  data: RunningHubNodeContentData;
}

interface TaskResult {
  status: 'idle' | 'running' | 'success' | 'failed';
  output?: TaskOutput;
  error?: string;
}

const CACHE_KEY = 'runninghub_node_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000;

const parseFieldData = (fieldData: string | undefined): { options?: string[]; optionValues?: string[]; placeholder?: string } => {
  if (!fieldData) return {};

  try {
    const parsed = JSON.parse(fieldData);

    if (Array.isArray(parsed) && parsed.length >= 2 && Array.isArray(parsed[0]) && typeof parsed[0][0] === 'string') {
      return { options: parsed[0] };
    }

    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
      const options = parsed.map(item => item.description || item.descriptionEn || item.name || `option-${item.index}`);
      const optionValues = parsed.map(item => String(item.index));
      return { options, optionValues };
    }

    if (Array.isArray(parsed) && parsed.length > 1 && typeof parsed[1] === 'object') {
      const options = parsed[1]?.options;
      if (Array.isArray(options) && options.length > 0) {
        return { options };
      }
    }

    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
      return { options: parsed };
    }

    return {};
  } catch {
    return {};
  }
};

const RunningHubNodeContent = memo(({ data: nodeData }: RunningHubNodeContentProps) => {
  const { theme } = useTheme();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [nodes, setNodes] = useState<RunningHubNodeType[]>([]);
  const [covers, setCovers] = useState<RunningHubCover[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const [cacheInfo, setCacheInfo] = useState<{ timestamp: number; id: string } | null>(null);

  const { uploadStates, globalError, uploadFile, getUploadState, resetUploadState } = useFileUpload({
    onUploadError: (err) => setError(err)
  });

  const { taskStatus, taskResult, isSubmitting, submitTask, resetTask } = useTaskSubmit({
    functionId: nodeData.id || '',
    onTaskStart: () => {
      setError(null);
      nodeData.onExecute?.();
    },
    onTaskSuccess: (result) => {
      if (result.output) {
        nodeData.onTaskComplete?.(result.output);
      }
    },
    onTaskError: (err) => setError(err),
    onTaskProgress: (status) => {
      if (status === 'success' || status === 'failed') {
        nodeData.onStop?.();
      }
    }
  });

  const getNodeType = (node: RunningHubNodeType): string => {
    if (node.fieldType === 'LIST') return 'LIST';
    if (node.fieldType === 'STRING') return 'STRING';
    if (node.fieldType === 'IMAGE') return 'IMAGE';
    if (node.fieldType === 'AUDIO') return 'AUDIO';
    if (node.fieldType === 'VIDEO') return 'VIDEO';
    if (node.fieldType === 'INPUT') return 'INPUT';
    if (node.fieldName === 'select') return 'LIST';
    return node.fieldType || node.nodeType || 'STRING';
  };

  const updateNodeValue = useCallback((nodeId: string, value: string) => {
    setNodes(prev => prev.map(n => n.nodeId === nodeId ? { ...n, fieldValue: value } : n));
  }, []);

  const toggleNodeExpand = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const handleFileSelect = useCallback(async (node: RunningHubNodeType, file: File) => {
    const result = await uploadFile(node.nodeId, file, node.fieldType?.toLowerCase() || 'input');
    if (result.success && result.serverFilePath) {
      setNodes(prev => prev.map(n =>
        n.nodeId === node.nodeId
          ? { 
              ...n, 
              // 更新 fieldValue 用于提交任务（移除 api/ 前缀）
              fieldValue: result.serverFilePath.replace(/^api\//, ''),
              // 保留 serverFilePath 用于显示
              serverFilePath: result.serverFilePath,
              uploadStatus: 'success'
            }
          : n
      ));
    }
  }, [uploadFile]);

  const handleSubmitTask = useCallback(async () => {
    nodeData.onExecute?.();
    const result = await submitTask(nodes);
    if (result.status !== 'running' && result.status !== 'idle') {
      resetTask();
    }
  }, [nodes, submitTask, resetTask, nodeData.onExecute]);

  const fetchNodeInfo = useCallback(async () => {
    if (!nodeData.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const cacheKey = `${CACHE_KEY}_${nodeData.id}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setNodes(data.nodeInfoList || []);
          setCovers(data.covers || []);
          setCacheInfo({ timestamp, id: nodeData.id! });
          setIsLoading(false);
          return;
        }
      }

      const response = await fetch('/api/runninghub/node-info-by-function', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: nodeData.id
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || result.message || '获取节点信息失败');
      }

      const processedNodes = (result.data?.nodeInfoList || []).map((n: any) => {
        const parsed = parseFieldData(n.fieldData);
        // 保留已上传文件的 fieldValue（移除 api/ 前缀的版本）
        const existingNode = nodes.find(existing => existing.nodeId === n.nodeId);
        const uploadSuccess = existingNode?.uploadStatus === 'success' && existingNode?.serverFilePath;
        const cleanedFieldValue = uploadSuccess 
          ? existingNode.serverFilePath.replace(/^api\//, '')
          : undefined;
        
        return {
          ...n,
          options: parsed.options,
          optionValues: parsed.optionValues,
          placeholder: parsed.placeholder,
          // 保留已上传的 fieldValue，不被 fetchNodeInfo 覆盖
          fieldValue: cleanedFieldValue || n.fieldValue,
          uploadStatus: uploadSuccess ? 'success' : n.uploadStatus,
          serverFilePath: uploadSuccess ? existingNode.serverFilePath : n.serverFilePath
        };
      });

      setNodes(processedNodes);
      setCovers(result.data?.covers || []);
      localStorage.setItem(cacheKey, JSON.stringify({
        data: { nodeInfoList: processedNodes, covers: result.data?.covers },
        timestamp: Date.now()
      }));
      setCacheInfo({ timestamp: Date.now(), id: nodeData.id! });

    } catch (err) {
      setError(err instanceof Error ? err.message : '获取节点信息失败');
    } finally {
      setIsLoading(false);
    }
  }, [nodeData.id]);

  const handleLoadTemplate = useCallback((template: any) => {
    setNodes(template.nodes);
  }, []);

  useEffect(() => {
    if (nodeData.id) {
      fetchNodeInfo();
    }
  }, [nodeData.id]);

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'IMAGE': return <Image className="w-4 h-4" />;
      case 'AUDIO': return <Music className="w-4 h-4" />;
      case 'VIDEO': return <Video className="w-4 h-4" />;
      default: return null;
    }
  };

  const renderNodeInput = (node: RunningHubNodeType) => {
    const type = getNodeType(node);
    const uploadState = getUploadState(node.nodeId);

    switch (type) {
      case 'STRING':
        return (
          <textarea
            value={node.fieldValue || ''}
            onChange={(e) => updateNodeValue(node.nodeId, e.target.value)}
            placeholder={node.placeholder || `请输入${node.nodeName}`}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-primary)',
              borderColor: 'var(--color-border)',
              border: `1px solid var(--color-border)`
            }}
            rows={2}
          />
        );

      case 'LIST':
        return (
          <select
            value={String(node.fieldValue || '')}
            onChange={(e) => updateNodeValue(node.nodeId, e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-primary)',
              borderColor: 'var(--color-border)'
            }}
          >
            {node.options?.map((option, index) => (
              <option key={index} value={node.optionValues?.[index] ?? option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'IMAGE':
      case 'AUDIO':
      case 'VIDEO':
        const hasPreview = uploadState.localPreviewUrl || node.fieldValue;
        const isUploading = uploadState.status === 'uploading';

        return (
          <div className="space-y-2">
            <input
              type="file"
              ref={el => { fileInputRefs.current[node.nodeId] = el; }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(node, file);
              }}
              accept={type === 'IMAGE' ? 'image/*' : type === 'AUDIO' ? 'audio/*' : 'video/*'}
              className="hidden"
            />

            {hasPreview ? (
              <div className="space-y-2">
                {type === 'IMAGE' && uploadState.localPreviewUrl && (
                  <img
                    src={uploadState.localPreviewUrl}
                    alt="Preview"
                    className="h-32 w-auto object-contain rounded-lg"
                  />
                )}
                <div className="flex items-center gap-2 text-xs">
                  {isUploading && <Loader2 className="w-3 h-3 animate-spin" style={{ color: 'var(--color-primary)' }} />}
                  {uploadState.status === 'success' && <Check className="w-3 h-3" style={{ color: 'var(--color-success)' }} />}
                  {uploadState.status === 'failed' && <AlertCircle className="w-3 h-3" style={{ color: 'var(--color-error)' }} />}
                </div>
                <button
                  onClick={() => fileInputRefs.current[node.nodeId]?.click()}
                  className="text-xs"
                  style={{ color: 'var(--color-success)' }}
                  disabled={isUploading}
                >
                  {isUploading ? '上传中...' : '更换'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRefs.current[node.nodeId]?.click()}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  color: 'var(--color-primary)',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}
              >
                <Upload className="w-3 h-3" />
                上传{type === 'IMAGE' ? '图片' : type === 'AUDIO' ? '音频' : '视频'}
              </button>
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={node.fieldValue || ''}
            onChange={(e) => updateNodeValue(node.nodeId, e.target.value)}
            placeholder={node.placeholder || node.description || node.fieldName}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-primary)',
              borderColor: 'var(--color-border)'
            }}
          />
        );
    }
  };

  const hasUploadingFiles = nodes.some(node => {
    const type = getNodeType(node);
    const uploadState = getUploadState(node.nodeId);
    return ['IMAGE', 'AUDIO', 'VIDEO'].includes(type) && uploadState.status === 'uploading';
  });

  const nodeColors = getNodeTypeColor('runninghub' as any);

  return (
    <div
      className={`rounded-2xl border-2 overflow-hidden backdrop-blur-xl w-full h-full flex flex-col min-w-[280px] relative`}
      style={{
        borderColor: `${nodeColors.primary}`,
        background: `linear-gradient(135deg, ${nodeColors.primary}33, ${nodeColors.primary}22)`
      }}
    >
      {nodeData.inputPortConfig && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 group/port cursor-crosshair z-10"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            nodeData.onPortClick?.('root', 'in', { x: rect.left, y: rect.top });
          }}
        >
          <div className="w-4 h-8 rounded-l-lg border-y-2 border-l-2 transition-all group-hover/port:scale-110" style={{ borderColor: nodeColors.primary, backgroundColor: 'var(--color-bg-secondary)' }} />
        </div>
      )}

      {(isSubmitting || hasUploadingFiles) && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(2px)' }}
        >
          <div className="text-center">
            <Loader2 className="w-6 h-6 animate-spin text-white mx-auto mb-2" />
            <p className="text-xs text-white/80">{hasUploadingFiles ? '上传中...' : '执行中...'}</p>
          </div>
        </div>
      )}

      <div className="p-4 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--color-text-muted)' }} />
          </div>
        ) : error ? (
          <div 
            className="text-xs rounded-lg p-3"
            style={{ 
              color: 'var(--color-error)', 
              backgroundColor: 'var(--color-error-light)',
              opacity: 0.1
            }}
          >{error}</div>
        ) : (
          <>
            {covers.length > 0 && (
              <div className="mb-4">
                <img src={covers[0].thumbnailUri} alt="Cover" className="w-full h-40 object-cover rounded-lg" />
              </div>
            )}

            <div className="space-y-3">
              {nodes.map(node => (
                <div key={node.nodeId} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                  {node.description && (
                    <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>{node.description}</p>
                  )}
                  {renderNodeInput(node)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

        <div className="p-4 border-t" style={{ borderColor: `${nodeColors.primary}66`, backgroundColor: `${nodeColors.primary}11` }}>
        <button
          onClick={handleSubmitTask}
          disabled={isSubmitting || isLoading || nodes.length === 0 || hasUploadingFiles}
          className="w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          style={{
            backgroundColor: isSubmitting || hasUploadingFiles ? 'var(--color-text-muted)' : nodeColors.primary,
            color: '#fff'
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              执行中...
            </>
          ) : hasUploadingFiles ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              上传中...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              运行应用
            </>
          )}
        </button>

        {hasUploadingFiles && (
          <p className="text-xs mt-1 text-center" style={{ color: 'var(--color-warning)' }}>
            请等待文件上传完成
          </p>
        )}

        {taskResult && taskResult.status === 'success' && taskResult.output && (
          <div 
            className="mt-3 p-3 rounded-lg border"
            style={{ 
              backgroundColor: 'var(--color-success-light)',
              opacity: 0.1,
              borderColor: 'var(--color-success)'
            }}
          >
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-success)' }}>执行成功</p>
            {taskResult.output.images?.map((img, i) => (
              <img key={i} src={img} alt={`Result ${i + 1}`} className="w-full rounded-lg mb-2" />
            ))}
          </div>
        )}

        {taskResult && taskResult.status === 'failed' && (
          <div 
            className="mt-3 p-3 rounded-lg border"
            style={{ 
              backgroundColor: 'var(--color-error-light)',
              opacity: 0.1,
              borderColor: 'var(--color-error)'
            }}
          >
            <p className="text-xs" style={{ color: 'var(--color-error)' }}>执行失败: {taskResult.error}</p>
          </div>
        )}
      </div>
    </div>
  );
});

export default RunningHubNodeContent;
