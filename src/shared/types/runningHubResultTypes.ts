// RunningHub 结果展示窗口相关类型定义

export interface TaskResult {
  status: 'idle' | 'running' | 'success' | 'failed';
  output?: {
    images?: string[];
    videos?: string[];
    audios?: string[];
    files?: string[];
    message?: string;
  };
  error?: string;
}

export interface FileItem {
  url: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'file';
  size?: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    format?: string;
  };
}

export interface Position {
  x: number;
  y: number;
}

export interface RunningHubResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskResult: TaskResult | null;
  nodePosition?: Position;
  title?: string;
}

// 模态窗口配置选项
export interface ModalConfig {
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: string;
  maxHeight?: string;
  resizable?: boolean;
  draggable?: boolean;
  fullscreen?: boolean;
}

// 预览模式
export type PreviewMode = 'grid' | 'list' | 'carousel';

// 下载选项
export interface DownloadOptions {
  individual?: boolean;
  bulk?: boolean;
  zip?: boolean;
  customName?: string;
}

// 动画配置
export interface AnimationConfig {
  fadeIn?: string;
  fadeOut?: string;
  slideIn?: string;
  slideOut?: string;
  duration?: number;
}

// 键盘快捷键
export interface KeyboardShortcuts {
  close?: string; // 'Escape'
  fullscreen?: string; // 'f'
  next?: string; // 'ArrowRight'
  prev?: string; // 'ArrowLeft'
  download?: string; // 'd'
  play?: string; // 'Space'
}