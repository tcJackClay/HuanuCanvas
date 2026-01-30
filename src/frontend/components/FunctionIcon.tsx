import React from 'react';
import type { FunctionIconProps } from '../../shared/types';

/**
 * 功能图标组件
 * 显示单个RunningHub功能的方形图标
 */
const FunctionIcon: React.FC<FunctionIconProps> = ({ 
  func, 
  onClick, 
  isSelected = false 
}) => {
  const handleClick = () => {
    onClick(func);
  };

  return (
    <div
      className={`
        relative group cursor-pointer transition-all duration-300 ease-out
        hover:scale-105 hover:shadow-xl active:scale-95
        ${isSelected ? 'ring-2 ring-offset-2 ring-offset-gray-900' : ''}
      `}
      style={{
        width: '64px',
        height: '64px',
        background: `linear-gradient(135deg, ${func.color}33, ${func.color}22)`,
        borderRadius: '12px',
        border: `1px solid ${func.color}66`,
        boxShadow: isSelected 
          ? `0 0 0 2px ${func.color}, 0 8px 25px ${func.color}40`
          : '0 4px 20px rgba(0,0,0,0.3)',
      }}
      onClick={handleClick}
      title={`${func.name}\n${func.description}\n分类: ${func.category}`}
    >
      {/* 背景装饰 */}
      <div 
        className="absolute inset-0 rounded-xl opacity-20"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${func.color}66, transparent 70%)`,
        }}
      />
      
      {/* 图标内容 */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center p-2">
        {/* Emoji图标 */}
        <div className="text-2xl mb-1 filter drop-shadow-sm">
          {func.icon}
        </div>
        
        {/* 功能名称 - 截断显示 */}
        <div 
          className="text-xs font-medium text-center leading-tight px-1"
          style={{ 
            color: 'white',
            textShadow: '0 1px 2px rgba(0,0,0,0.7)',
            maxWidth: '60px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {func.name}
        </div>
      </div>

      {/* 悬停时的波纹效果 */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div 
          className="absolute inset-0 rounded-xl animate-pulse"
          style={{
            background: `radial-gradient(circle, ${func.color}22, transparent 70%)`,
          }}
        />
      </div>

      {/* 选中状态的动画效果 */}
      {isSelected && (
        <div 
          className="absolute inset-0 rounded-xl animate-ping"
          style={{
            background: `radial-gradient(circle, ${func.color}33, transparent 70%)`,
          }}
        />
      )}

      {/* 工具提示 */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 pointer-events-none">
        <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 max-w-48 shadow-lg border border-gray-700">
          <div className="font-semibold text-white mb-1">{func.name}</div>
          <div className="text-gray-300 text-xs mb-1">{func.description}</div>
          <div className="text-gray-400 text-xs">分类: {func.category}</div>
          {/* 小箭头 */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      </div>
    </div>
  );
};

export default FunctionIcon;