import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Maximize2, Minimize2, Play, Pause, Volume2, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface RunningHubFile {
  fileUrl: string;
  fileType: string;
  fileName?: string;
  fileSize?: string;
  duration?: string;
}

interface RunningHubResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskResult: {
    status: string;
    output?: any;
    taskId?: string;
    error?: string;
  };
  nodePosition?: { x: number; y: number };
}

const RunningHubResultModal: React.FC<RunningHubResultModalProps> = ({
  isOpen,
  onClose,
  taskResult,
  nodePosition
}) => {
  const { theme } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number }>();
  const modalRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // 解析输出数据，兼容多种格式
  const parseOutputData = () => {
    const output = taskResult.output;
    if (!output) return [];
    
    // 如果是数组（格式API返回）
    if (Array.isArray(output)) {
      return output.map((file, index) => ({
        fileUrl: file.fileUrl || (typeof file === 'string' ? file : ''),
        fileType: file.fileType || 'unknown',
        fileName: file.fileName || `文件_${index + 1}`,
        fileSize: file.fileSize || '',
        duration: file.duration || ''
      }));
    }
    
    // 如果是对象格式
    if (output.images || output.videos || output.files) {
      const files: RunningHubFile[] = [];
      
      (output.images || []).forEach((url: string, index: number) => {
        files.push({ fileUrl: url, fileType: 'png', fileName: `图片_${index + 1}` });
      });
      
      (output.videos || []).forEach((url: string, index: number) => {
        files.push({ fileUrl: url, fileType: 'mp4', fileName: `视频_${index + 1}` });
      });
      
      (output.files || []).forEach((file: any, index: number) => {
        files.push({
          fileUrl: file.fileUrl || file.url || '',
          fileType: file.fileType || 'file',
          fileName: file.fileName || `文件_${index + 1}`,
          fileSize: file.fileSize || '',
          duration: file.duration || ''
        });
      });
      
      return files;
    }
    
    return [];
  };

  const files = parseOutputData();
  const selectedFile = files[selectedFileIndex];
  const totalFiles = files.length;

  // 计算模态窗口位置
  useEffect(() => {
    if (isOpen && nodePosition && !isDragging) {
      const modalWidth = 800;
      const modalHeight = 600;
      
      let newX = nodePosition.x + 320; // 节点宽度 + 间距
      let newY = nodePosition.y;
      
      // 确保不超出屏幕边界
      newX = Math.min(newX, window.innerWidth - modalWidth - 20);
      newY = Math.min(newY, window.innerHeight - modalHeight - 20);
      newX = Math.max(newX, 20);
      newY = Math.max(newY, 20);
      
      setPosition({ x: newX, y: newY });
    }
  }, [isOpen, nodePosition, isDragging]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'f':
        case 'F':
          setIsFullscreen(!isFullscreen);
          break;
        case 'ArrowLeft':
          setSelectedFileIndex(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowRight':
          setSelectedFileIndex(prev => Math.min(totalFiles - 1, prev + 1));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, totalFiles]);

  // 拖拽功能
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isFullscreen) return;
    
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !dragRef.current) return;
    
    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;
    
    setPosition({
      x: dragRef.current.startPosX + deltaX,
      y: dragRef.current.startPosY + deltaY
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragRef.current = undefined;
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  // 下载文件
  const downloadFile = (file: RunningHubFile) => {
    const link = document.createElement('a');
    link.href = file.fileUrl;
    link.download = file.fileName || `runninghub-output.${file.fileType}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 批量下载
  const downloadAllFiles = () => {
    files.forEach((file, index) => {
      setTimeout(() => downloadFile(file), index * 500); // 间隔500ms下载
    });
  };

  // 文件类型渲染
  const renderFileContent = () => {
    if (!selectedFile) return null;

    const isImage = selectedFile.fileType.toLowerCase().startsWith('image');
    const isVideo = selectedFile.fileType.toLowerCase().startsWith('video');
    const isAudio = selectedFile.fileType.toLowerCase().startsWith('audio');

    if (isImage) {
      return (
        <div className="flex items-center justify-center h-full">
          <img
            src={selectedFile.fileUrl}
            alt={selectedFile.fileName}
            className="max-w-full max-h-full object-contain rounded"
            style={{ maxHeight: isFullscreen ? 'calc(100vh - 200px)' : '400px' }}
          />
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <video
            ref={videoRef}
            src={selectedFile.fileUrl}
            controls
            className="max-w-full max-h-full rounded"
            style={{ maxHeight: isFullscreen ? 'calc(100vh - 200px)' : '400px' }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        </div>
      );
    }

    if (isAudio) {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <div className="text-center">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto"
              style={{ backgroundColor: theme.colors.bgSecondary }}
            >
              <Volume2 size={32} style={{ color: theme.colors.textPrimary }} />
            </div>
            <p 
              className="mt-2 text-sm font-medium"
              style={{ color: theme.colors.textPrimary }}
            >
              {selectedFile.fileName || '音频文件'}
            </p>
            {selectedFile.duration && (
              <p 
                className="text-xs"
                style={{ color: theme.colors.textSecondary }}
              >
                时长: {selectedFile.duration}
              </p>
            )}
          </div>
          
          <audio
            ref={audioRef}
            src={selectedFile.fileUrl}
            controls
            className="w-full max-w-sm"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        </div>
      );
    }

    // 其他文件类型
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div 
          className="w-24 h-24 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: theme.colors.bgSecondary }}
        >
          <FileText size={32} style={{ color: theme.colors.textPrimary }} />
        </div>
        
        <div className="text-center">
          <p 
            className="text-sm font-medium"
            style={{ color: theme.colors.textPrimary }}
          >
            {selectedFile.fileName || '文件'}
          </p>
          {selectedFile.fileSize && (
            <p 
              className="text-xs"
              style={{ color: theme.colors.textSecondary }}
            >
              大小: {selectedFile.fileSize}
            </p>
          )}
          <p 
            className="text-xs"
            style={{ color: theme.colors.textSecondary }}
          >
            类型: {selectedFile.fileType}
          </p>
        </div>
        
        <button
          onClick={() => downloadFile(selectedFile)}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <Download size={16} />
          下载文件
        </button>
      </div>
    );
  };

  if (!isOpen) return null;

  const modalSize = isFullscreen 
    ? { width: '100vw', height: '100vh' }
    : { width: '800px', height: '600px' };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="rounded-2xl shadow-2xl border overflow-hidden flex flex-col"
        style={{
          width: modalSize.width,
          height: modalSize.height,
          left: isFullscreen ? 0 : position.x,
          top: isFullscreen ? 0 : position.y,
          transform: isFullscreen ? 'none' : 'translate(-50%, -50%)',
          backgroundColor: theme.colors.bgPanel,
          borderColor: theme.colors.border,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onClick={e => e.stopPropagation()}
        onMouseDown={handleMouseDown}
      >
        {/* 标题栏 */}
        <div 
          className="px-4 py-3 flex items-center justify-between border-b"
          style={{ borderColor: theme.colors.border }}
        >
          <div className="flex items-center gap-2">
            <span 
              className="text-sm font-semibold"
              style={{ color: theme.colors.textPrimary }}
            >
              RunningHub 执行结果
            </span>
            {taskResult.taskId && (
              <span 
                className="text-xs px-2 py-1 rounded-full"
                style={{ 
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  color: 'rgb(16, 185, 129)'
                }}
              >
                任务ID: {taskResult.taskId}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {totalFiles > 0 && (
              <button
                onClick={downloadAllFiles}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                style={{ color: theme.colors.textSecondary }}
                title="批量下载"
              >
                <Download size={16} />
              </button>
            )}
            
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              style={{ color: theme.colors.textSecondary }}
              title={isFullscreen ? "退出全屏" : "全屏"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-red-500/20 hover:text-red-300 transition-colors"
              style={{ color: theme.colors.textSecondary }}
              title="关闭"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        {totalFiles > 0 ? (
          <div className="flex-1 flex overflow-hidden">
            {/* 文件列表 */}
            <div 
              className="w-64 border-r overflow-y-auto"
              style={{ borderColor: theme.colors.border }}
            >
              <div className="p-3">
                <h3 
                  className="text-sm font-medium mb-3"
                  style={{ color: theme.colors.textPrimary }}
                >
                  文件列表 ({totalFiles})
                </h3>
                
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedFileIndex === index 
                          ? 'bg-green-500/20 border border-green-500' 
                          : 'hover:bg-white/5'
                      }`}
                      style={{ color: theme.colors.textPrimary }}
                      onClick={() => setSelectedFileIndex(index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded flex items-center justify-center"
                            style={{ 
                              backgroundColor: theme.colors.bgSecondary,
                              color: theme.colors.textSecondary 
                            }}
                          >
                            {file.fileType.toLowerCase().startsWith('image') && '🖼️'}
                            {file.fileType.toLowerCase().startsWith('video') && '🎥'}
                            {file.fileType.toLowerCase().startsWith('audio') && '🎵'}
                            {!file.fileType.toLowerCase().match(/^(image|video|audio)/) && '📄'}
                          </div>
                          <span className="text-sm truncate max-w-[120px]">
                            {file.fileName || `文件${index + 1}`}
                          </span>
                        </div>
                        
                        {selectedFileIndex === index && (
                          <ChevronRight size={14} style={{ color: 'rgb(16, 185, 129)' }} />
                        )}
                      </div>
                      
                      {file.fileSize && (
                        <div className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>
                          {file.fileSize}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 预览区域 */}
            <div className="flex-1 flex flex-col">
              {/* 导航控制 */}
              {totalFiles > 1 && (
                <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: theme.colors.border }}>
                  <button
                    onClick={() => setSelectedFileIndex(prev => Math.max(0, prev - 1))}
                    disabled={selectedFileIndex === 0}
                    className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    style={{ color: theme.colors.textPrimary }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  <span 
                    className="text-sm"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    {selectedFileIndex + 1} / {totalFiles}
                  </span>
                  
                  <button
                    onClick={() => setSelectedFileIndex(prev => Math.min(totalFiles - 1, prev + 1))}
                    disabled={selectedFileIndex === totalFiles - 1}
                    className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    style={{ color: theme.colors.textPrimary }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
              
              {/* 文件内容预览 */}
              <div className="flex-1 p-6 overflow-auto">
                {renderFileContent()}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: theme.colors.bgSecondary }}
              >
                <FileText size={24} style={{ color: theme.colors.textSecondary }} />
              </div>
              <p 
                className="text-lg font-medium mb-2"
                style={{ color: theme.colors.textPrimary }}
              >
                暂无生成结果
              </p>
              <p 
                className="text-sm"
                style={{ color: theme.colors.textSecondary }}
              >
                任务可能还在执行中，请稍后查看
              </p>
            </div>
          </div>
        )}

        {/* 状态栏 */}
        {totalFiles > 0 && (
          <div 
            className="px-4 py-3 border-t flex items-center justify-between"
            style={{ borderColor: theme.colors.border }}
          >
            <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
              共 {totalFiles} 个文件
            </div>
            
            <div className="flex items-center gap-3 text-sm" style={{ color: theme.colors.textSecondary }}>
              <span>ESC 关闭</span>
              <span>F 全屏</span>
              {totalFiles > 1 && <span>←→ 切换</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RunningHubResultModal;