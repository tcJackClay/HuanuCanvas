/**
 * Pebbling application types
 */

export interface BPField {
  id: string;
  name: string;
  type: string;
  placeholder?: string;
  required?: boolean;
}

export interface CanvasNodeData {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: any;
}

export interface GenerationHistory {
  id: string;
  inputImageData?: string;
  inputImageName?: string;
  inputImageType?: string;
  inputImagePaths?: string;
  inputImages?: string[];
  outputImage?: string;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export interface DesktopImageItem {
  id: string;
  name: string;
  type: 'image';
  imageUrl: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface DesktopFolderItem {
  id: string;
  name: string;
  type: 'folder';
  position: { x: number; y: number };
  size: { width: number; height: number };
  items: DesktopItem[];
}

export type DesktopItem = DesktopImageItem | DesktopFolderItem;

export interface RunningHubFunction {
  id: string;
  name: string;
  icon: string;
  color: string;
  webappId: string;
  category: string;
  description: string;
  defaultInputs: Record<string, any>;
}

export interface RunningHubFunctionOperationResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface RunningHubFunctionsResponse {
  functions: RunningHubFunction[];
}

export interface ThemeContextValue {
  theme: 'light' | 'dark';
  isDark: boolean;
  toggleTheme?: () => void;
}

export interface NodeData {
  id: string;
  type: string;
  [key: string]: any;
}

export interface RunningHubCanvasNodeData extends NodeData {
  onDelete?: () => void;
  executionStatus?: 'idle' | 'running' | 'completed' | 'error';
}

export type Theme = 'light' | 'dark';

export interface RunningHubNode {
  id: string;
  type: string;
  data: any;
}