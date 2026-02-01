
export type NodeType = 'text' | 'image' | 'idea' | 'edit' | 'video' | 'video-output' | 'runninghub-output' | 'combine' | 'llm' | 'resize' | 'relay' | 'remove-bg' | 'upscale' | 'bp' | 'runninghub';

export type NodeStatus = 'idle' | 'running' | 'completed' | 'error';

export type RunningHubNodeType = 'STRING' | 'LIST' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'INPUT';

export interface RunningHubNode {
  nodeId: string;
  nodeName: string;
  nodeType?: RunningHubNodeType;
  fieldType?: string;
  fieldName?: string;
  fieldValue?: string;
  required?: boolean;
  options?: string[];
  optionValues?: string[];
  placeholder?: string;
  cover?: string;
  fileType?: 'image' | 'audio' | 'video' | 'input';
  localPreviewUrl?: string;
  description?: string;
  fieldData?: string;
  // 新增：上传状态跟踪
  uploadStatus?: 'idle' | 'uploading' | 'success' | 'failed';
  uploadError?: string;
  serverFilePath?: string;
  originalFileName?: string;
}

export interface RunningHubCover {
  id: string;
  url: string;
  thumbnailUri?: string;
  name?: string;
}

export interface RunningHubTemplate {
  id: string;
  name: string;
  description?: string;
  webappId: string;
  webappName?: string;
  cover?: string;
  inputFieldDefaults: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

export interface RunningHubNodeInfoCache {
  timestamp: number;
  nodeInfoList: RunningHubNode[];
  covers: RunningHubCover[];
  webappName?: string;
}

export type InputDataType = 'IMAGE' | 'TEXT' | 'AUDIO' | 'VIDEO' | 'FILE' | 'ANY';

export interface GenerationConfig {
  aspectRatio?: string; // "1:1", "16:9", "9:16", "4:3" - 可选，不传则保持原图比例
  resolution?: string; // "1K", "2K", "4K"
}

export interface NodeData {
  crop?: { x: number; y: number; scale: number };
  prompt?: string; // Main User Prompt
  systemInstruction?: string; // System Context/Persona
  settings?: Record<string, any>;
  files?: Array<{ name: string; type: string; data: string }>; // Base64 files
  
  // 🔥 图片元数据(宽高/大小/格式)
  imageMetadata?: {
    width: number;
    height: number;
    size: string; // 格式化后的大小, 如 "125 KB"
    format: string; // 图片格式, 如 "PNG", "JPEG"
  };
  
  // Resize Node Specifics
  resizeMode?: 'longest' | 'shortest' | 'width' | 'height' | 'exact';
  resizeWidth?: number;
  resizeHeight?: number;
  
  // Video Node Specifics
  videoService?: 'sora' | 'veo';
  videoModel?: string;
  videoSize?: string;
  videoSeconds?: string;
  veoMode?: 'text2video' | 'image2video' | 'keyframes' | 'multi-reference';
  veoModel?: string;
  veoAspectRatio?: string;
  veoEnhancePrompt?: boolean;
  veoEnableUpsample?: boolean;
  videoTaskId?: string;
  videoProgress?: number;
  videoTaskStatus?: string;
  videoFailReason?: string;
  videoUrl?: string; // 原始URL（下载失败时保留）
  output?: string; // LLM/BP节点输出
  
  // BP Node Specifics - 存储BP创意库配置
  bpTemplate?: {
    id: number;
    title: string;
    prompt: string; // 模板提示词
    bpFields?: Array<{
      id: string;
      type: 'input' | 'agent';
      name: string;
      label: string;
      agentConfig?: {
        instruction: string;
        model: string;
      };
    }>;
    imageUrl?: string; // 缩略图
  };
  bpInputs?: Record<string, string>; // 用户填写的BP输入值
  
  // RunningHub Node Specifics
  runningHubConfig?: {
    webappId?: string;
    apiKey?: string;
    workflowId?: string;
    isAIApp?: boolean;
    inputFields?: Array<{
      id: string;
      label: string;
      type: 'text' | 'select' | 'image' | 'audio' | 'video';
      nodeId: string;
      fieldName: string;
      required?: boolean;
      defaultValue?: string;
      options?: string[];
      placeholder?: string;
    }>;
  };
  webappId?: string; // RunningHub应用ID
  apiKey?: string; // RunningHub API密钥
  nodeIds?: string[]; // RunningHub节点ID列表，用于动态生成输入端口
  inputPortCount?: number; // 输入端口数量，用于动态生成输入端口
  
  // RunningHub Output Node Specifics
  runninghubOutput?: {
    images?: string[];
    videos?: string[];
    files?: Array<{ fileUrl: string; fileName?: string; fileType?: string }>;
    message?: string;
  };
  downloadFiles?: Array<{ fileUrl: string; fileName?: string; fileType?: string }>;
}

export interface CanvasNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: NodeType;
  content: string; // Text content or Image Base64/URL
  title?: string;
  data?: NodeData;
  isEditing?: boolean;
  status?: NodeStatus;
}

export interface Connection {
  id: string;
  fromNode: string;
  toNode: string;
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface PresetInput {
  nodeId: string;
  field: 'content' | 'prompt' | 'systemInstruction';
  label: string; // User defined label e.g., "Main Topic"
  defaultValue: string;
}

export interface CanvasPreset {
  id: string;
  title: string;
  description: string;
  nodes: CanvasNode[];
  connections: Connection[];
  inputs: PresetInput[];
}

// 北极冰原配色方案 - 低饱和度冷色调
export const ARCTIC_COLORS = {
  // 冰川蓝 - Image类节点（image/edit/remove-bg/upscale/resize）
  glacierBlue: 'rgb(125, 163, 184)',
  glacierBlueLight: 'rgb(168, 197, 214)',
  
  // 苔原灰绿 - Text类节点（text/idea）
  tundraGreen: 'rgb(158, 179, 168)',
  tundraGreenLight: 'rgb(184, 207, 194)',
  
  // 极光紫灰 - LLM类节点
  auroraViolet: 'rgb(168, 155, 184)',
  auroraVioletLight: 'rgb(194, 184, 207)',
  
  // 冰雪白蓝 - Video类节点
  snowBlue: 'rgb(184, 197, 207)',
  snowBlueLight: 'rgb(209, 220, 229)',
  
  // 冰原灰 - Default/Relay节点
  arcticGray: 'rgb(155, 163, 171)',
  arcticGrayLight: 'rgb(184, 192, 200)',
  
  // BP蓝 - BP节点（智能体模式）
  bpBlue: 'rgb(96, 165, 250)',
  bpBlueLight: 'rgb(147, 197, 253)',
} as const;

// 节点类型颜色映射 - 使用 CSS 变量实现主题适配
export const getNodeTypeColor = (type: NodeType): { primary: string; light: string } => {
  switch (type) {
    case 'image':
    case 'edit':
    case 'remove-bg':
    case 'upscale':
    case 'resize':
      return { primary: 'var(--color-node-image)', light: 'var(--color-node-image-light)' };
    
    case 'text':
    case 'idea':
      return { primary: 'var(--color-node-text)', light: 'var(--color-node-text-light)' };
    
    case 'llm':
      return { primary: 'var(--color-node-llm)', light: 'var(--color-node-llm-light)' };
    
    case 'video':
    case 'video-output':
      return { primary: 'var(--color-node-video)', light: 'var(--color-node-video-light)' };
    
    case 'bp':
      return { primary: 'var(--color-node-bp)', light: 'var(--color-node-bp-light)' };
    
    case 'runninghub':
    case 'runninghub-output':
      return { primary: 'var(--color-node-runninghub)', light: 'var(--color-node-runninghub-light)' };
    
    default:
      return { primary: 'var(--color-border)', light: 'var(--color-border-light)' };
  }
};
