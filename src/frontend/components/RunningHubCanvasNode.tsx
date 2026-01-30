import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, X, Settings, RefreshCw, Upload, FileText, Image as ImageIcon, Music, Video, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { RunningHubNode } from '../services/api/runninghub';
import { CanvasNode, NodeStatus, RunningHubNodeType, RunningHubCover } from '@/shared/types/pebblingTypes';

interface RunningHubCanvasNodeProps {
  node: CanvasNode;
  isSelected: boolean;
  onExecute: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onUpdate: (nodeId: string, updates: Partial<CanvasNode>) => void;
  onOpenConfig?: () => void;
}

interface RunningHubNodeData {
  webappId?: string;
  apiKey?: string;
  nodeInfoList?: RunningHubNode[];
  covers?: RunningHubCover[];
  selectedCover?: string;
  executionStatus?: NodeStatus;
  executionResult?: any;
}

const RunningHubCanvasNode: React.FC<RunningHubCanvasNodeProps> = ({
  node,
  isSelected,
  onExecute,
  onDelete,
  onUpdate,
  onOpenConfig
}) => {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [nodeValues, setNodeValues] = useState<Record<string, string>>({});
  const [selectedCover, setSelectedCover] = useState<string>('');
  const [showResultModal, setShowResultModal] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement>>({});

  const nodeData = node.data as RunningHubNodeData || {};
  const { nodeInfoList = [], covers = [] } = nodeData;
  const isRunning = nodeData.executionStatus === 'running';
  const hasConfig = nodeData.webappId && nodeData.apiKey;

  // 动态节点高度计算
  const nodeHeight = 120 + (isExpanded ? Math.min(nodeInfoList.length, 5) * 60 : 0) + 60;
  const nodeWidth = 320;

  // 获取预览图片
  const previewImage = selectedCover || covers[0]?.thumbnailUri || '';
  const displayedNodes = isExpanded ? nodeInfoList.slice(0, 5) : [];

  useEffect(() => {
    // 初始化节点值
    const initialValues: Record<string, string> = {};
    nodeInfoList.forEach(node => {
      initialValues[node.nodeId] = node.fieldValue || '';
    });
    setNodeValues(initialValues);
  }, [nodeInfoList]);

  const handleNodeValueChange = (nodeId: string, value: string) => {
    setNodeValues(prev => ({
      ...prev,
      [nodeId]: value
    }));
    
    // 更新节点数据
    const updatedNodeInfoList = nodeInfoList.map(node =>
      node.nodeId === nodeId ? { ...node, fieldValue: value } : node
    );
    
    onUpdate(node.id, {
      data: {
        ...nodeData,
        nodeInfoList: updatedNodeInfoList
      }
    });
  };

  const handleFileUpload = (nodeId: string, fileType: string, file: File) => {
    // 文件上传处理
    setIsLoading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', fileType);
    formData.append('apiKey', nodeData.apiKey || '');

    fetch('/api/runninghub/upload-file', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(result => {
      if (result.success && result.thirdPartyResponse?.data?.fileName) {
        handleNodeValueChange(nodeId, result.thirdPartyResponse.data.fileName);
      } else {
        console.error('文件上传失败:', result);
      }
    })
    .catch(error => {
      console.error('文件上传错误:', error);
    })
    .finally(() => {
      setIsLoading(false);
    });
  };

  const handleExecute = async () => {
    if (!hasConfig || !nodeInfoList.length) return;

    onUpdate(node.id, {
      data: {
        ...nodeData,
        executionStatus: 'running'
      }
    });

    try {
      const response = await fetch('/api/runninghub/ai-app-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webappId: nodeData.webappId,
          nodeInfoList: nodeInfoList.map(node => ({
            ...node,
            fieldValue: nodeValues[node.nodeId] || node.fieldValue
          }))
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // 轮询任务状态
        pollTaskStatus(result.data.taskId);
      } else {
        onUpdate(node.id, {
          data: {
            ...nodeData,
            executionStatus: 'error'
          }
        });
      }
    } catch (error) {
      console.error('执行失败:', error);
      onUpdate(node.id, {
        data: {
          ...nodeData,
          executionStatus: 'error'
        }
      });
    }
  };

  const pollTaskStatus = async (taskId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/runninghub/task-status/${taskId}`);
        const result = await response.json();

        if (result.data?.code === 0 && result.data?.data) {
          // 任务完成
          onUpdate(node.id, {
            data: {
              ...nodeData,
              executionStatus: 'completed',
              executionResult: result.data.data
            }
          });
          setShowResultModal(true);
        } else if (result.data?.code === 804 || result.data?.code === 813) {
          // 继续轮询
          setTimeout(poll, 3000);
        } else {
          // 任务失败
          onUpdate(node.id, {
            data: {
              ...nodeData,
              executionStatus: 'error'
            }
          });
        }
      } catch (error) {
        console.error('轮询状态失败:', error);
        onUpdate(node.id, {
          data: {
            ...nodeData,
            executionStatus: 'error'
          }
        });
      }
    };

    setTimeout(poll, 2000);
  };

  const renderNodeField = (nodeInfo: RunningHubNode) => {
    const value = nodeValues[nodeInfo.nodeId] || nodeInfo.fieldValue || '';

    switch (nodeInfo.fieldType) {
      case 'STRING':
        return (
          <textarea
            value={value}
            onChange={(e) => handleNodeValueChange(nodeInfo.nodeId, e.target.value)}
            placeholder={nodeInfo.description}
            className="w-full h-12 px-2 py-1 text-xs bg-white/5 border border-white/10 rounded text-white placeholder-gray-400 resize-none"
            style={{ color: theme.colors.textPrimary }}
          />
        );

      case 'LIST':
        try {
          const options = JSON.parse(nodeInfo.fieldData || '[]');
          return (
            <select
              value={value}
              onChange={(e) => handleNodeValueChange(nodeInfo.nodeId, e.target.value)}
              className="w-full h-8 px-2 py-1 text-xs bg-white/5 border border-white/10 rounded text-white"
              style={{ color: theme.colors.textPrimary }}
            >
              <option value="">请选择...</option>
              {options.map((option: any, index: number) => (
                <option key={index} value={option.index}>
                  {option.name} - {option.description}
                </option>
              ))}
            </select>
          );
        } catch (error) {
          return (
            <input
              type="text"
              value={value}
              onChange={(e) => handleNodeValueChange(nodeInfo.nodeId, e.target.value)}
              placeholder={nodeInfo.description}
              className="w-full h-8 px-2 py-1 text-xs bg-white/5 border border-white/10 rounded text-white"
            />
          );
        }

      case 'IMAGE':
      case 'AUDIO':
      case 'VIDEO':
        return (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={value}
              readOnly
              placeholder={nodeInfo.description}
              className="flex-1 h-8 px-2 py-1 text-xs bg-white/5 border border-white/10 rounded text-white"
              style={{ color: theme.colors.textPrimary }}
            />
            <input
              ref={el => fileInputRefs.current[nodeInfo.nodeId] = el!}
              type="file"
              accept={`${nodeInfo.fieldType.toLowerCase()}/*`}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(nodeInfo.nodeId, nodeInfo.fieldType.toLowerCase(), file);
              }}
              className="hidden"
            />
            <button
              onClick={() => fileInputRefs.current[nodeInfo.nodeId]?.click()}
              className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 border border-white/10 rounded text-white transition-colors"
            >
              <Upload size={12} />
            </button>
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleNodeValueChange(nodeInfo.nodeId, e.target.value)}
            placeholder={nodeInfo.description}
            className="w-full h-8 px-2 py-1 text-xs bg-white/5 border border-white/10 rounded text-white"
          />
        );
    }
  };

  const getNodeIcon = (fieldType: string) => {
    switch (fieldType) {
      case 'STRING': return <FileText size={12} />;
      case 'LIST': return <ChevronDown size={12} />;
      case 'IMAGE': return <ImageIcon size={12} />;
      case 'AUDIO': return <Music size={12} />;
      case 'VIDEO': return <Video size={12} />;
      default: return <FileText size={12} />;
    }
  };

  return (
    <div className="absolute">
      {/* 右上角按钮组 */}
      {isSelected && (
        <div 
          className="absolute -top-10 right-0 flex gap-1.5 animate-in fade-in slide-in-from-bottom-2 z-[60]"
          style={{ right: 0 }}
        >
          {/* 运行/停止按钮 */}
          <button
            onClick={handleExecute}
            disabled={!hasConfig || nodeInfoList.length === 0 || isRunning}
            className="h-8 px-2.5 rounded-l-lg border shadow-lg flex items-center gap-1.5 
                     font-bold text-[10px] uppercase tracking-wider transition-colors"
            style={{
              backgroundColor: isRunning 
                ? 'rgb(239, 68, 68)' 
                : hasConfig 
                  ? 'rgb(16, 185, 129)' 
                  : 'rgb(107, 114, 128)',
              color: 'white',
              borderColor: theme.colors.border
            }}
          >
            {isRunning ? (
              <>
                <Square size={12} fill="currentColor" />
                Stop
              </>
            ) : (
              <>
                <Play size={12} fill="currentColor" />
                Run
              </>
            )}
          </button>

          {/* 配置按钮 */}
          <button
            onClick={onOpenConfig}
            className="h-8 w-8 border shadow-lg flex items-center justify-center transition-colors"
            style={{
              backgroundColor: 'rgb(16, 185, 129)',
              color: 'white',
              borderColor: theme.colors.border
            }}
          >
            <Settings size={14} />
          </button>

          {/* 删除按钮 */}
          <button
            onClick={() => onDelete(node.id)}
            className="h-8 w-8 rounded-r-lg border shadow-lg flex items-center justify-center 
                     hover:bg-red-500/20 hover:text-red-300 transition-colors"
            style={{
              backgroundColor: 'rgb(16, 185, 129)',
              color: 'white',
              borderColor: theme.colors.border
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 主节点内容 */}
      <div
        className="rounded-xl shadow-2xl border backdrop-blur-xl overflow-hidden"
        style={{
          width: `${nodeWidth}px`,
          height: `${nodeHeight}px`,
          backgroundColor: theme.colors.bgPanel,
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: '2px'
        }}
      >
        {/* 标题栏 */}
        <div 
          className="px-3 py-2 flex items-center justify-between"
          style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
        >
          <div className="flex items-center gap-2">
            <div 
              className="w-5 h-5 rounded-lg flex items-center justify-center text-white font-bold text-xs"
              style={{ backgroundColor: 'rgb(16, 185, 129)' }}
            >
              R
            </div>
            <span 
              className="text-xs font-semibold"
              style={{ color: theme.colors.textPrimary }}
            >
              RUNNINGHUB
            </span>
          </div>
          
          {/* 展开/收起按钮 */}
          {nodeInfoList.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>

        {/* 预览图区域 */}
        <div className="h-[120px] relative overflow-hidden" style={{ backgroundColor: theme.colors.bgSecondary }}>
          {previewImage ? (
            <img 
              src={previewImage} 
              alt="RunningHub Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <ImageIcon size={24} style={{ color: theme.colors.textSecondary }} />
                <p 
                  className="text-xs mt-2"
                  style={{ color: theme.colors.textSecondary }}
                >
                  暂无预览图
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 配置项列表 */}
        {isExpanded && displayedNodes.length > 0 && (
          <div className="px-3 py-2 space-y-2">
            {displayedNodes.map((nodeInfo, index) => (
              <div key={nodeInfo.nodeId} className="space-y-1">
                <div className="flex items-center gap-2">
                  {getNodeIcon(nodeInfo.fieldType)}
                  <span 
                    className="text-xs font-medium"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    {nodeInfo.fieldName} ({nodeInfo.fieldType})
                  </span>
                </div>
                {renderNodeField(nodeInfo)}
              </div>
            ))}
            
            {nodeInfoList.length > 5 && (
              <div 
                className="text-center py-1 text-xs cursor-pointer hover:text-green-400 transition-colors"
                style={{ color: theme.colors.textSecondary }}
                onClick={() => setIsExpanded(!isExpanded)}
              >
                ... 还有 {nodeInfoList.length - 5} 个配置项
              </div>
            )}
          </div>
        )}

        {/* 底部运行按钮 */}
        {!hasConfig && (
          <div className="px-3 py-2">
            <button
              onClick={onOpenConfig}
              className="w-full py-2 text-xs font-medium rounded-lg transition-colors"
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                color: 'rgb(16, 185, 129)',
                border: '1px solid rgb(16, 185, 129)'
              }}
            >
              请先配置 WebAppId 和 API Key
            </button>
          </div>
        )}
      </div>

      {/* 执行状态指示器 */}
      {isRunning && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      )}
    </div>
  );
};

export default RunningHubCanvasNode;