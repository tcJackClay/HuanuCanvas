/**
 * 文件缩略图组件
 * 支持图片、视频、音频等文件类型的缩略图显示
 */

import React from 'react';
import { Play, Music, FileText, File } from 'lucide-react';

interface FileThumbnailProps {
  file: {
    fileUrl: string;
    fileType: string;
    fileName: string;
    fileSize?: number;
  };
  size?: 'small' | 'medium' | 'large';
  showOverlay?: boolean;
  onClick?: () => void;
}

const FileThumbnail: React.FC<FileThumbnailProps> = ({
  file,
  size = 'medium',
  showOverlay = true,
  onClick
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-16 h-16';
      case 'medium':
        return 'w-20 h-20';
      case 'large':
        return 'w-24 h-24';
      default:
        return 'w-20 h-20';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'medium':
        return 20;
      case 'large':
        return 24;
      default:
        return 20;
    }
  };

  const renderThumbnail = () => {
    const iconSize = getIconSize();
    
    // 图片文件
    if (file.fileType.startsWith('image')) {
      return (
        <img
          src={file.fileUrl}
          alt={file.fileName}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            // 图片加载失败时显示默认图标
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      );
    }
    
    // 视频文件
    if (file.fileType.startsWith('video')) {
      return (
        <div className="relative w-full h-full bg-gray-800 flex items-center justify-center">
          <video
            src={file.fileUrl}
            className="w-full h-full object-cover"
            muted
            onMouseEnter={(e) => {
              e.currentTarget.play();
            }}
            onMouseLeave={(e) => {
              e.currentTarget.pause();
              e.currentTarget.currentTime = 0;
            }}
            onError={(e) => {
              // 视频加载失败时显示默认图标
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden">
            <Play size={iconSize} className="text-white" />
          </div>
        </div>
      );
    }
    
    // 音频文件
    if (file.fileType.startsWith('audio')) {
      return (
        <div className="w-full h-full bg-purple-600 flex items-center justify-center">
          <Music size={iconSize} className="text-white" />
        </div>
      );
    }
    
    // 文档文件
    if (file.fileType.includes('pdf') || file.fileType.includes('text') || file.fileType.includes('document')) {
      return (
        <div className="w-full h-full bg-blue-600 flex items-center justify-center">
          <FileText size={iconSize} className="text-white" />
        </div>
      );
    }
    
    // 默认文件图标
    return (
      <div className="w-full h-full bg-gray-600 flex items-center justify-center">
        <File size={iconSize} className="text-white" />
      </div>
    );
  };

  return (
    <div
      className={`
        ${getSizeClasses()}
        rounded-lg overflow-hidden cursor-pointer
        border border-gray-600 hover:border-gray-400
        transition-all duration-200 hover:shadow-lg
        ${onClick ? 'hover:scale-105' : ''}
      `}
      onClick={onClick}
      title={file.fileName}
    >
      {renderThumbnail()}
      
      {showOverlay && (
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 hover:opacity-100 transition-opacity duration-200">
            <Play size={16} className="text-white" />
          </div>
        </div>
      )}
    </div>
  );
};

export default FileThumbnail;