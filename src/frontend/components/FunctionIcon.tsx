import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import type { FunctionIconProps } from '../../shared/types';
import { Icons } from './Icons';

// 图标名称到 Lucide 图标的映射
const iconTypeMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  // 基础图标
  'Image': Icons.Image,
  'Film': Icons.Video,
  'Video': Icons.Video,
  'Maximize': Icons.Resize,
  'Palette': Icons.Layers,
  'Package': Icons.Box,
  'Activity': Icons.Activity,
  'Refresh': Icons.Relay,
  'Wand': Icons.Magic,
  'Layers': Icons.Layers,
  'Box': Icons.Upload,
  // 默认图标
  'Default': Icons.Zap,
};

/**
 * 功能图标组件
 * 显示单个RunningHub功能的方形图标
 * 适配白天/夜晚主题
 */
const FunctionIcon: React.FC<FunctionIconProps> = ({
  func,
  onClick,
  isSelected = false
}) => {
  const { theme } = useTheme();

  // 获取图标组件
  const getIconComponent = () => {
    const iconType = func.iconType || 'Default';
    const IconComponent = iconTypeMap[iconType] || iconTypeMap['Default'];
    return <IconComponent size={20} />;
  };

  const handleClick = () => {
    onClick(func);
  };

  return (
    <div
      className={`
        relative group cursor-pointer transition-all duration-300 ease-out
        hover:scale-105 active:scale-95
        ${isSelected ? 'ring-2 ring-offset-2' : ''}
      `}
      style={{
        width: '48px',
        height: '48px',
        borderRadius: '10px',
        background: `linear-gradient(135deg, ${func.color}22, ${func.color}11)`,
        border: `1px solid ${func.color}44`,
        boxShadow: isSelected
          ? `0 0 0 2px ${func.color}, 0 3px 10px ${func.color}33`
          : `0 2px 6px rgba(0, 0, 0, ${theme.name === 'dark' ? 0.2 : 0.06})`,
      } as React.CSSProperties}
      onClick={handleClick}
      title={`${func.name}\n${func.description}\n分类: ${func.category}`}
    >
      {/* 背景装饰 */}
      <div
        className="absolute inset-0 rounded-xl opacity-25"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${func.color}44, transparent 70%)`,
        }}
      />

      {/* 图标内容 */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center p-1">
        {/* 图标/emoji */}
        <div
          className="flex items-center justify-center"
          style={{
            filter: `drop-shadow(0 1px 2px ${func.color}40)`,
          }}
        >
          {func.iconType ? getIconComponent() : (
            <span className="text-lg">{func.icon}</span>
          )}
        </div>

        {/* 功能名称 */}
        <div
          className="text-[8px] font-medium text-center leading-tight px-0.5"
          style={{
            color: theme.colors.textSecondary,
            maxWidth: '44px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {func.name}
        </div>
      </div>

      {/* 悬停光效 */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            background: `radial-gradient(circle, ${func.color}12, transparent 70%)`,
          }}
        />
      </div>

      {/* 选中状态动画 */}
      {isSelected && (
        <div
          className="absolute inset-0 rounded-xl animate-pulse"
          style={{
            background: `radial-gradient(circle, ${func.color}22, transparent 70%)`,
          }}
        />
      )}

      {/* 工具提示 */}
      <div
        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 pointer-events-none"
      >
        <div
          className="rounded-lg py-1.5 px-2.5 max-w-40 shadow-lg"
          style={{
            backgroundColor: theme.colors.bgPanel,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <div
            className="font-semibold text-xs mb-0.5"
            style={{ color: theme.colors.textPrimary }}
          >
            {func.name}
          </div>
          <div
            className="text-[10px] mb-0.5"
            style={{ color: theme.colors.textSecondary }}
          >
            {func.description}
          </div>
          <div
            className="text-[9px]"
            style={{ color: theme.colors.textMuted }}
          >
            分类: {func.category}
          </div>
          <div
            className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-3 border-transparent"
            style={{
              borderTopColor: theme.colors.bgPanel,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default FunctionIcon;