import React, { useCallback, useState, useMemo, useRef, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Panel,
  NodeTypes,
  EdgeTypes,
  MarkerType,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  ReactFlowProvider,
  SelectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTheme } from '../../contexts/ThemeContext';
import { CreativeIdea, DesktopImageItem, GeneratedContent } from '../../types';
import { normalizeImageUrl } from '../utils/image';
import { ChevronRight, X } from 'lucide-react';

// 自定义节点组件
import CreativeNode from './nodes/CreativeNode';
import ImageNode from './nodes/ImageNode';
import PromptNode from './nodes/PromptNode';
import TextNode from './nodes/TextNode';
import SaveImageNode from './nodes/SaveImageNode';
import MultiAngleNode from './nodes/MultiAngleNode';
import RunningHubNode from './nodes/RunningHubNode';

// RunningHub功能面板组件
import RunningHubFunctionsPanel from '../RunningHubFunctionsPanel';
import type { RunningHubFunction } from '../../../shared/types';

// 节点类型定义
export type CanvasNodeType = 'creative' | 'image' | 'prompt' | 'text' | 'saveImage' | 'multiAngle' | 'runninghub';

export interface CanvasNodeData {
  [key: string]: unknown; // 索引签名，满足 Record<string, unknown> 约束
  label: string;
  type: CanvasNodeType;
  // 创意库节点
  creativeIdea?: CreativeIdea;
  bpInputValues?: Record<string, string>; // BP变量输入值
  // 图片节点
  imageItem?: DesktopImageItem;
  imageUrl?: string;
  // 提示词节点
  promptText?: string;
  // 文本节点
  text?: string;
  // 通用
  onDelete?: (id: string) => void;
  onEdit?: (id: string, data: Partial<CanvasNodeData>) => void;
}

// 注册自定义节点类型
const nodeTypes: NodeTypes = {
  creative: CreativeNode,
  image: ImageNode,
  prompt: PromptNode,
  text: TextNode,
  saveImage: SaveImageNode,
  multiAngle: MultiAngleNode,
  runninghub: RunningHubNode,
};

}

