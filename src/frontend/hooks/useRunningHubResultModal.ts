import { useState, useCallback, useRef, useEffect } from 'react';
import { TaskResult, Position, ModalConfig, KeyboardShortcuts } from '../types/runningHubResultTypes';

interface UseRunningHubResultModalOptions {
  config?: ModalConfig;
  shortcuts?: KeyboardShortcuts;
}

export const useRunningHubResultModal = (options: UseRunningHubResultModalOptions = {}) => {
  const { config, shortcuts } = options;
  
  const [isOpen, setIsOpen] = useState(false);
  const [taskResult, setTaskResult] = useState<TaskResult | null>(null);
  const [nodePosition, setNodePosition] = useState<Position | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef<Position>({ x: 100, y: 100 });
  const dragOffsetRef = useRef<Position>({ x: 0, y: 0 });

  // 打开模态窗口
  const openModal = useCallback((
    result: TaskResult, 
    position?: Position,
    options?: { title?: string }
  ) => {
    setTaskResult(result);
    setNodePosition(position);
    setIsOpen(true);
    
    // 如果提供了节点位置且不是全屏模式，设置窗口位置
    if (position && !isFullscreen && config?.draggable !== false) {
      positionRef.current = {
        x: position.x + 50,
        y: position.y
      };
    }
  }, [isFullscreen, config?.draggable]);

  // 关闭模态窗口
  const closeModal = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      setTaskResult(null);
      setNodePosition(null);
    }, 300); // 等待关闭动画完成
  }, []);

  // 切换全屏模式
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // 更新任务结果
  const updateTaskResult = useCallback((result: TaskResult) => {
    setTaskResult(result);
  }, []);

  // 键盘快捷键处理
  useEffect(() => {
    if (!isOpen || !shortcuts) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, ctrlKey, metaKey } = event;

      // 关闭快捷键
      if (key === (shortcuts.close || 'Escape')) {
        event.preventDefault();
        closeModal();
        return;
      }

      // 全屏快捷键
      if (key === (shortcuts.fullscreen || 'f')) {
        event.preventDefault();
        toggleFullscreen();
        return;
      }

      // 只有在有图片时才处理图片导航快捷键
      if (taskResult?.output?.images && taskResult.output.images.length > 0) {
        // 下一张图片
        if (key === (shortcuts.next || 'ArrowRight')) {
          event.preventDefault();
          // 这里需要通过事件或者其他方式通知组件切换图片
          return;
        }

        // 上一张图片
        if (key === (shortcuts.prev || 'ArrowLeft')) {
          event.preventDefault();
          // 这里需要通过事件或者其他方式通知组件切换图片
          return;
        }
      }

      // 下载快捷键
      if ((key === (shortcuts.download || 'd')) && (ctrlKey || metaKey)) {
        event.preventDefault();
        // 这里需要通过事件通知组件触发下载
        return;
      }

      // 播放/暂停快捷键
      if (key === (shortcuts.play || ' ')) {
        event.preventDefault();
        // 这里需要通过事件通知组件切换播放状态
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, shortcuts, closeModal, toggleFullscreen, taskResult]);

  // 拖拽功能
  const startDrag = useCallback((clientX: number, clientY: number) => {
    if (isFullscreen || config?.draggable === false) return;

    const rect = modalRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffsetRef.current = {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
      setIsDragging(true);
    }
  }, [isFullscreen, config?.draggable]);

  const handleDrag = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || isFullscreen || config?.draggable === false) return;

    positionRef.current = {
      x: clientX - dragOffsetRef.current.x,
      y: clientY - dragOffsetRef.current.y
    };
  }, [isDragging, isFullscreen, config?.draggable]);

  const endDrag = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 全局鼠标事件处理
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleDrag(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      endDrag();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleDrag, endDrag]);

  // 窗口位置和大小调整
  const updatePosition = useCallback((position: Position) => {
    positionRef.current = position;
  }, []);

  const getPosition = useCallback(() => {
    return isFullscreen ? { x: 0, y: 0 } : positionRef.current;
  }, [isFullscreen]);

  // 窗口大小计算
  const getModalSize = useCallback(() => {
    if (isFullscreen) {
      return {
        width: '100vw',
        height: '100vh',
        maxWidth: '100vw',
        maxHeight: '100vh'
      };
    }

    return {
      width: config?.width || 800,
      height: config?.height || 600,
      maxWidth: config?.maxWidth || '90vw',
      maxHeight: config?.maxHeight || '85vh'
    };
  }, [isFullscreen, config]);

  // 文件下载辅助函数
  const downloadFile = useCallback(async (url: string, filename: string): Promise<boolean> => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      window.URL.revokeObjectURL(downloadUrl);
      return true;
    } catch (error) {
      console.error('Download failed:', error);
      return false;
    }
  }, []);

  // 批量下载
  const downloadAllFiles = useCallback(async (files: Array<{ url: string; name: string }>) => {
    const results = await Promise.allSettled(
      files.map(file => downloadFile(file.url, file.name))
    );
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    return { successful, failed };
  }, [downloadFile]);

  return {
    // 状态
    isOpen,
    taskResult,
    nodePosition,
    isFullscreen,
    isDragging,
    
    // 操作方法
    openModal,
    closeModal,
    toggleFullscreen,
    updateTaskResult,
    
    // 拖拽相关
    startDrag,
    updatePosition,
    getPosition,
    
    // 样式相关
    getModalSize,
    
    // 工具方法
    downloadFile,
    downloadAllFiles,
    
    // Ref
    modalRef
  };
};

// 事件管理器，用于组件间通信
export class RunningHubResultModalEventManager {
  private listeners: Map<string, Set<Function>> = new Map();

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, data?: any) {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }

  // 预定义事件
  static readonly EVENTS = {
    OPEN_MODAL: 'open-modal',
    CLOSE_MODAL: 'close-modal',
    TOGGLE_FULLSCREEN: 'toggle-fullscreen',
    NEXT_IMAGE: 'next-image',
    PREV_IMAGE: 'prev-image',
    PLAY_PAUSE: 'play-pause',
    DOWNLOAD_FILE: 'download-file',
    DOWNLOAD_ALL: 'download-all',
    UPDATE_RESULT: 'update-result'
  };
}

// 全局事件管理器实例
export const runningHubResultModalEvents = new RunningHubResultModalEventManager();