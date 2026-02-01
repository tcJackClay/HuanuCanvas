import React from 'react';
import { Eye, Download, Loader } from 'lucide-react';
import { normalizeImageUrl } from '../../../utils/image';

interface PreviewData {
  [key: string]: any;
}

interface RunningHubPreviewProps {
  preview?: PreviewData;
  isProcessing?: boolean;
  error?: string | null;
}

export const RunningHubPreview: React.FC<RunningHubPreviewProps> = ({
  preview,
  isProcessing = false,
  error = null
}) => {
  const hasPreview = preview && Object.keys(preview).length > 0;

  // 生成预览缩略图
  const generatePreviewThumbnail = (data: any) => {
    if (!data) return null;

    // 获取并标准化图片URL
    const imageUrl = data.base64 || normalizeImageUrl(data.url);
    const imageType = data.type || (data.url ? getImageTypeFromUrl(data.url) : 'image/jpeg');

    // 图片预览
    if (data.type?.startsWith('image/') || data.base64?.startsWith('data:image/') || data.url) {
      console.log('[RunningHubPreview] 生成预览图:', {
        originalUrl: data.url,
        normalizedUrl: imageUrl,
        type: imageType
      });

      return (
        <div className="relative">
          <img
            src={imageUrl}
            alt="预览图"
            className="w-full h-32 object-cover rounded border"
            onError={(e) => {
              console.error('[RunningHubPreview] 预览图加载失败:', imageUrl);
              e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect fill="#f0f0f0" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="#999" font-size="10">图片加载失败</text></svg>');
            }}
          />
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            {data.type?.split('/')[1]?.toUpperCase() || imageType.split('/')[1]?.toUpperCase() || 'IMG'}
          </div>
        </div>
      );
    }

    // 文本预览
    if (typeof data === 'string' || data.text) {
      const text = typeof data === 'string' ? data : data.text;
      return (
        <div className="p-2 bg-gray-50 rounded border text-xs max-h-32 overflow-y-auto">
          <div className="text-gray-600">{text}</div>
        </div>
      );
    }

    // JSON对象预览
    if (typeof data === 'object' && data !== null) {
      return (
        <div className="p-2 bg-gray-50 rounded border text-xs max-h-32 overflow-y-auto">
          <pre className="text-gray-600 text-xs">
            {JSON.stringify(data, null, 2).substring(0, 200)}
            {JSON.stringify(data, null, 2).length > 200 && '...'}
          </pre>
        </div>
      );
    }

    return null;
  };

  // 从URL获取图片类型
  const getImageTypeFromUrl = (url: string): string => {
    const ext = url.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      default:
        return 'image/jpeg';
    }
  };

  // 下载预览内容
  const handleDownload = (data: any, key: string) => {
    if (data.base64) {
      const link = document.createElement('a');
      link.href = data.base64;
      link.download = data.name || `${key}_preview.png`;
      link.click();
    }
  };

  // 渲染预览内容
  const renderPreviewContent = () => {
    if (isProcessing) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader className="animate-spin mx-auto mb-2 text-blue-500" size={24} />
            <div className="text-xs text-gray-600">正在生成预览...</div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-3 bg-red-50 border border-red-200 rounded">
          <div className="text-xs text-red-600">
            <strong>错误:</strong> {error}
          </div>
        </div>
      );
    }

    if (!hasPreview) {
      return (
        <div className="text-center py-6 text-gray-400">
          <Eye size={24} className="mx-auto mb-2 opacity-50" />
          <div className="text-xs">暂无预览内容</div>
          <div className="text-xs mt-1">配置参数后自动生成</div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-medium text-gray-700">即时预览</h4>
          {hasPreview && (
            <button
              onClick={() => {
                // 下载所有预览内容
                Object.entries(preview).forEach(([key, data]) => {
                  if (data?.base64) {
                    handleDownload(data, key);
                  }
                });
              }}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <Download size={12} />
              下载
            </button>
          )}
        </div>

        <div className="space-y-2">
          {Object.entries(preview).map(([key, data]) => (
            <div key={key} className="border rounded p-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">{key}</span>
                {data?.base64 && (
                  <button
                    onClick={() => handleDownload(data, key)}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    <Download size={12} />
                  </button>
                )}
              </div>
              
              <div className="min-h-[60px]">
                {generatePreviewThumbnail(data)}
              </div>
              
              {data?.size && (
                <div className="text-xs text-gray-500 mt-1">
                  大小: {(data.size / 1024 / 1024).toFixed(1)}MB
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg">
      {renderPreviewContent()}
      
      {/* 预览统计信息 */}
      {hasPreview && !isProcessing && !error && (
        <div className="mt-3 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>预览项目: {Object.keys(preview).length}</span>
            <span>状态: 就绪</span>
          </div>
        </div>
      )}
    </div>
  );
};