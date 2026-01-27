import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Upload, Play, RefreshCw, Check, AlertCircle, Image, Music, Video, File, ChevronDown, ChevronUp, Loader2, Save, FolderOpen } from 'lucide-react';
import type { RunningHubNode as RunningHubNodeType, RunningHubCover, RunningHubTemplate } from '@/src/shared/types/pebblingTypes';
import { getNodeTypeColor } from '@/src/shared/types/pebblingTypes';
import { MediaPreviewModal } from '@/src/frontend/components/Modals/MediaPreviewModal';

interface RunningHubNodeContentData {
  webappId?: string;
  apiKey?: string;
  inputFields?: RunningHubNodeType[];
  covers?: RunningHubCover[];
  inputPortConfig?: {
    types: string[];
    connectedNodeId?: string;
  };
  outputPortConfig?: {
    type: string;
    result?: TaskResult;
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

const getNodeType = (node: RunningHubNodeType): string => {
  // 使用 fieldType 判断（API官方规范）
  if (node.fieldType === 'LIST') return 'LIST';
  if (node.fieldType === 'STRING') return 'STRING';
  if (node.fieldType === 'IMAGE') return 'IMAGE';
  if (node.fieldType === 'AUDIO') return 'AUDIO';
  if (node.fieldType === 'VIDEO') return 'VIDEO';
  if (node.fieldType === 'INPUT') return 'INPUT';
  
  // 备用：fieldName 为 select（兼容性处理）
  if (node.fieldName === 'select') return 'LIST';
  
  return node.fieldType || node.nodeType || 'STRING';
};

const parseFieldData = (fieldData: string | undefined, nodeType: string): { options?: string[]; optionValues?: string[]; placeholder?: string } => {
  if (!fieldData) return {};

  try {
    const parsed = JSON.parse(fieldData);

    // 格式2: 新格式 - [["auto", "1:1", ...], {"default": "4:3"}]
    // 第一个元素是字符串数组，第二个元素是配置对象
    // 必须先检查这个格式，因为它也满足 typeof parsed[0] === 'object' 的条件
    if (Array.isArray(parsed) && parsed.length >= 2 && Array.isArray(parsed[0]) && typeof parsed[0][0] === 'string') {
      return { options: parsed[0] };
    }

    // 格式1: 对象数组 [{"name":"input1","index":1,"description":"描述"}, ...]
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
      const options = parsed.map(item => item.description || item.descriptionEn || item.name || `option-${item.index}`);
      const optionValues = parsed.map(item => String(item.index));
      return { options, optionValues };
    }

    // 格式3: 旧格式 - ["STRING", {"options": ["a", "b"]}]
    if (Array.isArray(parsed) && parsed.length > 1 && typeof parsed[1] === 'object') {
      const options = parsed[1]?.options;
      if (Array.isArray(options) && options.length > 0) {
        return { options };
      }
    }

    // 格式4: 直接字符串数组 - ["option1", "option2"]
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
      return { options: parsed };
    }
  } catch (e) {
    console.warn('[RunningHub] 解析fieldData失败:', e);
  }
  return {};
};

const processNodeOptions = (node: RunningHubNodeType): RunningHubNodeType => {
  const nodeType = getNodeType(node);
  const isListNode = nodeType === 'LIST' || node.fieldName === 'select';

  if (isListNode) {
    // 优先使用已有的options字段
    if (node.options && Array.isArray(node.options) && node.options.length > 0) {
      return {
        ...node,
        fieldType: 'LIST',
        fieldValue: String(node.fieldValue || node.optionValues?.[0] || node.options[0])
      };
    }

    // 其次解析fieldData
    if (node.fieldData) {
      const parsed = parseFieldData(node.fieldData, 'LIST');
      if (parsed.options && parsed.options.length > 0) {
        // 如果没有optionValues，使用options的索引作为值
        const optionValues = parsed.optionValues || parsed.options.map((_, i) => String(i));
        return {
          ...node,
          options: parsed.options,
          optionValues: optionValues,
          fieldType: 'LIST',
          fieldValue: String(node.fieldValue || optionValues[0] || parsed.options[0])
        };
      }
    }

    // 如果fieldData解析失败但fieldValue有值，创建一个默认选项
    if (node.fieldValue) {
      return {
        ...node,
        options: [node.fieldValue],
        optionValues: [node.fieldValue],
        fieldType: 'LIST',
        fieldValue: String(node.fieldValue)
      };
    }
  }

  if (nodeType === 'STRING' && node.fieldData) {
    const parsed = parseFieldData(node.fieldData, 'STRING');
    if (parsed.placeholder) {
      return { ...node, placeholder: parsed.placeholder };
    }
  }

  return node;
};

const RunningHubNodeContent: React.FC<RunningHubNodeContentProps> = ({ data: nodeData }) => {
  const { theme } = useTheme();
  const [nodes, setNodes] = useState<RunningHubNodeType[]>([]);
  const [covers, setCovers] = useState<RunningHubCover[]>([]);
  const [selectedCover, setSelectedCover] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('idle');
  const [taskResult, setTaskResult] = useState<TaskResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'audio' | 'video' | null>(null);
  const [inputData, setInputData] = useState<{ type: string; content: string } | null>(null);
  const [inputPortPos, setInputPortPos] = useState<{ x: number; y: number } | null>(null);
  const [outputPortPos, setOutputPortPos] = useState<{ x: number; y: number } | null>(null);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateSaved, setTemplateSaved] = useState(false);
  const [cacheInfo, setCacheInfo] = useState<{ timestamp: number; webappName?: string } | null>(null);

  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewFileRef = useRef<RunningHubNodeType | null>(null);

  useEffect(() => {
    const configured = !!(nodeData.webappId && nodeData.apiKey);
    setIsConfigured(configured);

    if (configured) {
      if (nodeData.inputFields && nodeData.inputFields.length > 0) {
        const processedNodes = nodeData.inputFields.map(node => processNodeOptions(node));
        setNodes(processedNodes);
        setExpandedNodes(new Set(processedNodes.map((n: RunningHubNodeType) => n.nodeId)));
        setExpandedNodes(new Set(processedNodes.map((n: RunningHubNodeType) => n.nodeId)));
      } else {
        fetchNodeInfo();
      }
      if (nodeData.covers && nodeData.covers.length > 0) {
        setCovers(nodeData.covers);
        setSelectedCover(nodeData.covers[0].url);
      }
    }
  }, [nodeData.webappId, nodeData.apiKey, nodeData.inputFields, nodeData.covers]);

  useEffect(() => {
    return () => {
      // 不在这里清理 blob URL，因为可能导致预览时 URL 失效
      // 浏览器会自动清理未被引用的 blob URL
    };
  }, []);

  useEffect(() => {
    if (nodeData.onReceiveInput && inputData) {
      const nodeType = inputData.type.toLowerCase();
      nodes.forEach(node => {
        const fieldType = (node.fieldType || node.nodeType || '').toLowerCase();
        if (fieldType === nodeType || fieldType === 'string') {
          updateNodeValue(node.nodeId, inputData.content);
        }
      });
    }
  }, [inputData, nodeData.onReceiveInput]);

  const handleSaveTemplate = useCallback(() => {
    if (!templateName.trim() || !nodeData.webappId) return;

    const templates = JSON.parse(localStorage.getItem('runningHubTemplates') || '[]');
    const newTemplate: RunningHubTemplate = {
      id: nodeData.webappId,
      name: templateName.trim(),
      webappId: nodeData.webappId,
      cover: selectedCover || undefined,
      inputFieldDefaults: nodes.reduce((acc, node) => {
        if (node.fieldValue) acc[node.nodeId] = node.fieldValue;
        return acc;
      }, {} as Record<string, string>),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const existingIndex = templates.findIndex((t: RunningHubTemplate) => t.id === nodeData.webappId);
    if (existingIndex >= 0) {
      templates[existingIndex] = { ...newTemplate, createdAt: templates[existingIndex].createdAt };
    } else {
      templates.push(newTemplate);
    }

    localStorage.setItem('runningHubTemplates', JSON.stringify(templates));
    setShowSaveTemplate(false);
    setTemplateName('');
    setTemplateSaved(true);
    setTimeout(() => setTemplateSaved(false), 2000);
  }, [templateName, nodeData.webappId, nodes, selectedCover]);

  const handleLoadTemplate = useCallback((template: RunningHubTemplate) => {
    if (!nodeData.apiKey) return;

    setIsLoading(true);
    fetch('/api/runninghub/node-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webappId: template.webappId, apiKey: nodeData.apiKey })
    })
      .then(res => res.json())
      .then(data => {
        if (data.data?.nodeInfoList) {
          let loadedNodes = data.data.nodeInfoList.map((node: RunningHubNodeType) => ({
            ...node,
            fieldValue: template.inputFieldDefaults[node.nodeId] || node.fieldValue || ''
          }));
          // 处理节点选项
          loadedNodes = loadedNodes.map(node => processNodeOptions(node));
          setNodes(loadedNodes);
          if (loadedNodes.length > 0) {
            setExpandedNodes(new Set(loadedNodes.map((n: RunningHubNodeType) => n.nodeId)));
          }
          if (data.data.covers?.length > 0) {
            setSelectedCover(data.data.covers[0].url);
            setCovers(data.data.covers);
          }
        }
      })
      .catch(err => setError(`加载模板失败: ${err.message}`))
      .finally(() => setIsLoading(false));
  }, [nodeData.apiKey]);

  const handlePortDown = (e: React.MouseEvent, portType: 'in' | 'out') => {
    e.stopPropagation();
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    if (nodeData.onPortClick) {
      nodeData.onPortClick('runninghub', portType, { x, y });
    }
  };

  const openPreview = (node: RunningHubNodeType) => {
    // 优先使用 fieldValue（服务器路径），因为它更稳定
    let url = node.fieldValue;
    
    // 如果 fieldValue 不存在，尝试使用 localPreviewUrl（临时 blob URL）
    if (!url && node.localPreviewUrl) {
      url = node.localPreviewUrl;
    }
    
    if (!url) return;
    
    const type = getNodeType(node);
    if (type === 'IMAGE') {
      setPreviewType('image');
    } else if (type === 'AUDIO') {
      setPreviewType('audio');
    } else if (type === 'VIDEO') {
      setPreviewType('video');
    } else {
      return;
    }
    
    previewFileRef.current = node;
    setPreviewUrl(url);
  };

  const closePreview = () => {
    setPreviewUrl(null);
    setPreviewType(null);
    previewFileRef.current = null;
  };

  const fetchNodeInfo = async (forceRefresh = false) => {
    if (!nodeData.webappId || !nodeData.apiKey) return;

    setIsLoading(true);
    setError(null);

    // 清除旧缓存（当forceRefresh为true或检测到webappId变化时）
    if (forceRefresh) {
      const oldCacheKey = `runningHubCache_${nodeData.webappId}`;
      localStorage.removeItem(oldCacheKey);
    }

    const cacheKey = `runningHubCache_${nodeData.webappId}`;
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const cacheData = JSON.parse(cached);
          const now = Date.now();
          if (now - cacheData.timestamp < CACHE_DURATION) {
            // 使用缓存数据
            if (cacheData.nodeInfoList) {
              const processedNodes = cacheData.nodeInfoList.map((node: RunningHubNodeType) => {
                const nodeType = getNodeType(node);
                if ((nodeType === 'LIST' || node.fieldName === 'select') && node.fieldData) {
                  const parsed = parseFieldData(node.fieldData, 'LIST');
                  if (parsed.options) {
                    return {
                      ...node,
                      options: parsed.options,
                      optionValues: parsed.optionValues,
                      fieldType: 'LIST',
                      fieldValue: String(node.fieldValue || parsed.optionValues?.[0] || '')
                    };
                  }
                }
                if (nodeType === 'STRING' && node.fieldData && !node.placeholder) {
                  const parsed = parseFieldData(node.fieldData, 'STRING');
                  if (parsed.placeholder) {
                    return { ...node, placeholder: parsed.placeholder };
                  }
                }
                return node;
              });
              setNodes(processedNodes);
              if (processedNodes.length > 0) {
                setExpandedNodes(new Set(processedNodes.map((n: RunningHubNodeType) => n.nodeId)));
              }
            }
            if (cacheData.covers) {
              setCovers(cacheData.covers);
              if (cacheData.covers.length > 0) {
                setSelectedCover(cacheData.covers[0].url);
              }
            }
            setCacheInfo({ timestamp: cacheData.timestamp, webappName: cacheData.webappName });
            setIsLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('[RunningHub] 读取缓存失败:', e);
      }
    }

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

      let nodeInfoList: RunningHubNodeType[] = [];
      let coversList: RunningHubCover[] = [];
      let webappName: string | undefined;

      if (data.data?.code === 0 && data.data?.data?.nodeInfoList) {
        nodeInfoList = data.data.data.nodeInfoList;
        coversList = data.data.data.covers || [];
        webappName = data.data.data.webappName;
      } else if (data.code === 0 && data.data?.nodeInfoList) {
        nodeInfoList = data.data.nodeInfoList;
        coversList = data.data.covers || [];
      } else if (data.data?.nodeInfoList) {
        nodeInfoList = data.data.nodeInfoList;
        coversList = data.data.covers || [];
      } else if (Array.isArray(data)) {
        nodeInfoList = data;
      }

       // 处理节点选项
      nodeInfoList = nodeInfoList.map(node => processNodeOptions(node));

      // 保存到缓存
      try {
        const cacheData = {
          timestamp: Date.now(),
          nodeInfoList,
          covers: coversList,
          webappName
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        setCacheInfo({ timestamp: cacheData.timestamp, webappName });
      } catch (e) {
        console.warn('[RunningHub] 保存缓存失败:', e);
      }

      setNodes(nodeInfoList);
      if (nodeInfoList.length > 0) {
        setExpandedNodes(new Set(nodeInfoList.map((n: RunningHubNodeType) => n.nodeId)));
      }
      setCovers(coversList);
      if (coversList.length > 0) {
        setSelectedCover(coversList[0].url);
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

  const handleFileUpload = async (node: RunningHubNodeType, file: File) => {
    if (!nodeData.apiKey) return;

    const localPreviewUrl = URL.createObjectURL(file);

    setNodes(prev => prev.map(n =>
      n.nodeId === node.nodeId
        ? { ...n, localPreviewUrl, fieldValue: file.name }
        : n
    ));

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
        const serverPath = data.thirdPartyResponse?.data?.filePath || file.name;
        setNodes(prev => prev.map(n =>
          n.nodeId === node.nodeId
            ? { ...n, fieldValue: serverPath }
            : n
        ));
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

    try {
      // 使用新的save_nodes接口（参考官方Python示例）
      // 后端会自动完成：提交任务 + 轮询状态 + 返回结果
      const response = await fetch('/api/runninghub/save_nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webappId: nodeData.webappId,
          apiKey: nodeData.apiKey,
          nodeInfoList2: nodes.map(n => ({
            nodeId: n.nodeId,
            fieldName: n.fieldName,
            fieldValue: n.fieldValue || '',
            description: n.description || '',
            fieldType: n.fieldType
          }))
        })
      });
      
      const result = await response.json();
      console.log('[RunningHub] save_nodes返回结果:', result);

      if (!response.ok) {
        throw new Error(result.error || result.message || `HTTP ${response.status}: 请求失败`);
      }

      if (result.success) {
        // 任务成功完成
        console.log('[RunningHub] 任务执行成功!', result);
        setTaskStatus('success');
        
        // 处理返回的数据格式
        const outputData = result.data || result.thirdPartyResponse?.data || result.thirdPartyResponse;
        setTaskResult({ status: 'success', output: outputData });
        
        // 通知父组件创建输出节点
        if (nodeData.onTaskComplete && outputData) {
          console.log('[RunningHub] 通知父组件创建输出节点');
          nodeData.onTaskComplete(outputData);
        }
      } else {
        // 任务失败
        console.error('[RunningHub] 任务执行失败:', result);
        setTaskStatus('failed');
        setTaskResult({ 
          status: 'failed', 
          error: result.message || '任务执行失败' 
        });
      }
    } catch (err) {
      console.error('[RunningHub] 请求失败:', err);
      setTaskStatus('failed');
      setTaskResult({ 
        status: 'failed', 
        error: err instanceof Error ? err.message : '请求失败' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const pollTaskStatus = (taskId: string) => {
    // 后端轮询已完成，此函数不再需要
    console.log('[RunningHub] 后端已完成轮询，前端无需继续轮询');
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

  const renderNodeInput = (node: RunningHubNodeType) => {
    const type = getNodeType(node);
    
    switch (type) {
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
              value={String(node.fieldValue || '')}
              onChange={(e) => updateNodeValue(node.nodeId, e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none appearance-none cursor-pointer"
              style={{
                backgroundColor: theme.colors.bgTertiary,
                color: theme.colors.textPrimary,
                borderColor: theme.colors.border,
                border: `1px solid ${theme.colors.border}`
              }}
            >
              {node.options?.map((option, index) => (
                <option key={`${index}-${node.optionValues?.[index] ?? option}`} value={node.optionValues?.[index] ?? option}>
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: theme.colors.textMuted }} />
          </div>
        );

      case 'IMAGE':
      case 'AUDIO':
      case 'VIDEO':
      case 'INPUT':
        const hasPreview = node.localPreviewUrl || node.fieldValue;
        const previewMediaType = type === 'IMAGE' ? 'image' : type === 'AUDIO' ? 'audio' : 'video';
        
        return (
          <div className="space-y-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(node, file);
                }
              }}
              accept={type === 'IMAGE' ? 'image/*' : type === 'AUDIO' ? 'audio/*' : type === 'VIDEO' ? 'video/*' : '*'}
              className="hidden"
            />
            
            {hasPreview ? (
              <div className="flex items-center gap-3">
                 {type === 'IMAGE' && node.localPreviewUrl && (
                   <button
                     onClick={() => openPreview(node)}
                     className="w-auto h-32 rounded-lg overflow-hidden flex-shrink-0 border border-white/20 hover:border-green-400 transition-colors"
                   >
                     <img src={node.localPreviewUrl} alt="Preview" className="h-full w-auto object-contain" />
                   </button>
                 )}
                {type === 'AUDIO' && node.localPreviewUrl && (
                  <button
                    onClick={() => openPreview(node)}
                    className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 border border-purple-500/30 hover:border-purple-400 transition-colors"
                  >
                    <Music className="w-8 h-8 text-purple-400" />
                  </button>
                )}
                 {type === 'VIDEO' && node.localPreviewUrl && (
                   <button
                     onClick={() => openPreview(node)}
                     className="w-auto h-32 rounded-lg overflow-hidden flex-shrink-0 border border-white/20 hover:border-green-400 transition-colors"
                   >
                    <img src={node.localPreviewUrl} alt="Preview" className="h-full w-auto object-contain" />
                  </button>
                )}
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => openPreview(node)}
                    className="text-xs text-left truncate hover:text-green-300 transition-colors w-full"
                    style={{ color: theme.colors.textPrimary }}
                  >
                    {node.fieldValue || '已选择文件'}
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-green-400 hover:text-green-300 transition-colors"
                  >
                    更换文件
                  </button>
                </div>
              </div>
            ) : (
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
                上传{type === 'IMAGE' ? '图片' : type === 'AUDIO' ? '音频' : type === 'VIDEO' ? '视频' : '文件'}
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
            placeholder={node.placeholder || `请输入${node.description || node.fieldName || node.nodeName}`}
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

  const nodeColors = getNodeTypeColor('runninghub' as any);

  return (
    <div
      className={`rounded-2xl border-2 overflow-hidden backdrop-blur-xl w-full h-full flex flex-col min-w-[280px] relative`}
      style={{
        borderColor: `${nodeColors.primary}`,
        background: `linear-gradient(135deg, ${nodeColors.primary}33, ${nodeColors.primary}22)`,
        boxShadow: '0 4px 20px -4px rgba(0,0,0,0.5)',
      }}
    >
      {/* 输入端口 (左侧) */}
      {nodeData.inputPortConfig && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 group/port cursor-crosshair z-10"
          onMouseDown={(e) => handlePortDown(e, 'in')}
          title="输入端口"
        >
          <div className={`w-5 h-5 rounded-full border-2 transition-all ${
            inputData ? 'bg-blue-400 border-blue-600' : 'bg-zinc-600 border-zinc-400 group-hover/port:bg-white'
          }`} />
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] whitespace-nowrap text-zinc-400">
            {nodeData.inputPortConfig.types.join('/')}
          </div>
        </div>
      )}

      {/* 输出端口 (右侧) */}
      {nodeData.outputPortConfig && (
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 group/port cursor-crosshair z-10"
          onMouseDown={(e) => handlePortDown(e, 'out')}
          title="输出端口"
        >
          <div className={`w-5 h-5 rounded-full border-2 transition-all ${
            taskStatus === 'success' ? 'bg-green-400 border-green-600' : 'bg-white/80 border-white/60 group-hover/port:bg-white'
          }`} />
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] whitespace-nowrap text-zinc-400">
            {nodeData.outputPortConfig.type}
          </div>
        </div>
      )}

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
          {/* RUN 按钮 - 与其他节点保持一致 */}
          {nodeData.isSelected && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const isActuallyRunning = nodeData.isRunning || taskStatus === 'running' || isSubmitting;
                if (isActuallyRunning) {
                  nodeData.onStop?.();
                } else {
                  nodeData.onExecute?.();
                }
              }}
              disabled={!nodeData.isRunning && taskStatus === 'running' && !isSubmitting}
              className={`h-8 px-2.5 border shadow-lg flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider transition-colors rounded-lg
                ${(nodeData.isRunning || taskStatus === 'running' || isSubmitting) 
                  ? 'hover:bg-red-500/30' 
                  : 'hover:bg-green-500/20'
                }`}
              style={{
                backgroundColor: (nodeData.isRunning || taskStatus === 'running' || isSubmitting) 
                  ? 'rgba(239, 68, 68, 0.2)' 
                  : theme?.colors?.bgPanel || '#1c1c1e',
                borderColor: (nodeData.isRunning || taskStatus === 'running' || isSubmitting) 
                  ? 'rgba(239, 68, 68, 0.5)' 
                  : theme?.colors?.border || 'rgba(255,255,255,0.1)',
                color: (nodeData.isRunning || taskStatus === 'running' || isSubmitting) 
                  ? 'rgb(252, 165, 165)' 
                  : 'rgb(34, 197, 94)'
              }}
            >
              {(nodeData.isRunning || taskStatus === 'running' || isSubmitting) ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              )}
              {(nodeData.isRunning || taskStatus === 'running' || isSubmitting) ? 'Stop' : 'Run'}
            </button>
          )}
          <button
            onClick={() => fetchNodeInfo(true)}
            disabled={isLoading || !isConfigured}
            className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-gray-300 transition-all disabled:opacity-50"
            title={cacheInfo ? `缓存时间: ${new Date(cacheInfo.timestamp).toLocaleString()}` : '刷新节点'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 封面预览区 */}
      <div className="flex-shrink-0 relative" style={{ height: '120px', background: 'rgba(0,0,0,0.3)' }}>
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
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center z-10" style={{
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

        {/* 任务结果预览 - 成功时显示 */}
        {taskStatus === 'success' && taskResult?.output && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-5 p-4">
            <div className="text-center max-w-full">
              <Check className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <span className="text-sm text-green-400 font-medium block mb-2">任务完成!</span>
              
              {/* 图片预览 */}
              {taskResult.output.images && taskResult.output.images.length > 0 && (
                <div className="mb-2">
                  <img 
                    src={taskResult.output.images[0]} 
                    alt="生成结果" 
                    className="max-w-full max-h-24 object-contain rounded-lg mx-auto"
                  />
                  <span className="text-xs text-gray-400 mt-1 block">
                    {taskResult.output.images.length} 张图片
                  </span>
                </div>
              )}
              
              {/* 视频预览 */}
              {taskResult.output.videos && taskResult.output.videos.length > 0 && (
                <div className="mb-2">
                  <video 
                    src={taskResult.output.videos[0]} 
                    className="max-w-full max-h-24 object-contain rounded-lg mx-auto"
                  />
                  <span className="text-xs text-gray-400 mt-1 block">
                    {taskResult.output.videos.length} 个视频
                  </span>
                </div>
              )}
              
              {/* 文件数量 */}
              {taskResult.output.files && taskResult.output.files.length > 0 && (
                <span className="text-xs text-gray-400 block">
                  {taskResult.output.files.length} 个文件
                </span>
              )}
              
              {/* 提示信息 */}
              <span className="text-[10px] text-gray-500 mt-2 block">
                已创建输出节点到画布
              </span>
            </div>
          </div>
        )}

        {/* 任务失败提示 */}
        {taskStatus === 'failed' && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-5 p-4">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <span className="text-sm text-red-400 font-medium">
                {taskResult?.error || '任务执行失败'}
              </span>
            </div>
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
        <div className="overflow-y-auto flex-1 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-20">
              <Loader2 className="w-5 h-5 animate-spin text-green-400" />
            </div>
          ) : nodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-20 text-center px-4">
              <span className="text-xs text-gray-400">暂无配置项</span>
            </div>
          ) : (
            <div className="p-3 space-y-0">
              {nodes.map((node, index) => (
                <div
                  key={`${index}-${node.nodeId}`}
                  className={`border overflow-hidden ${
                    nodes.length === 1
                      ? 'rounded-lg'
                      : index === 0
                        ? 'rounded-t-lg'
                        : index === nodes.length - 1
                          ? 'rounded-b-lg'
                          : ''
                  }`}
                  style={{
                    backgroundColor: theme.colors.bgTertiary,
                    borderColor: expandedNodes.has(node.nodeId) ? 'rgba(245, 158, 11, 0.3)' : theme.colors.border,
                    marginBottom: index < nodes.length - 1 ? '0' : undefined
                  }}
                >
                  <button
                    onClick={() => toggleNodeExpanded(node.nodeId)}
                    className="w-full px-3 py-2 flex items-center justify-between"
                    style={{ color: theme.colors.textPrimary }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
                        <span style={{ color: '#f59e0b', fontSize: '10px' }}>{getNodeIcon(getNodeType(node))}</span>
                      </div>
                      <div className="text-left min-w-0">
                        <div className="text-xs font-medium truncate">{node.description || node.fieldName || node.nodeName}</div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px]" style={{ color: theme.colors.textMuted }}>{getNodeType(node)}</span>
                          {node.fieldName && (
                            <>
                              <span className="text-[10px]" style={{ color: theme.colors.textMuted }}>·</span>
                              <span className="text-[10px] truncate" style={{ color: theme.colors.textMuted }}>{node.fieldName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      {expandedNodes.has(node.nodeId) ? (
                        <ChevronUp className="w-3 h-3" style={{ color: theme.colors.textMuted }} />
                      ) : (
                        <ChevronDown className="w-3 h-3" style={{ color: theme.colors.textMuted }} />
                      )}
                    </div>
                  </button>

                  {expandedNodes.has(node.nodeId) && (
                    <div
                      className="px-3 pb-2"
                      style={{ borderTop: `1px solid ${theme.colors.border}` }}
                    >
                      {node.description && (
                        <div className="mb-2 text-[10px] leading-relaxed" style={{ color: theme.colors.textMuted }}>
                          {node.description}
                        </div>
                      )}
                      {renderNodeInput(node)}
                    </div>
                  )}
                </div>
              ))}
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

      {/* 媒体预览模态框 */}
      {previewUrl && previewType && (
        <MediaPreviewModal
          type={previewType}
          url={previewUrl}
          onClose={closePreview}
          title={previewFileRef.current?.nodeName}
        />
      )}
    </div>
  );
};

export default memo(RunningHubNodeContent);
