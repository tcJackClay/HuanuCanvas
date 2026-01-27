import React, { useState } from 'react';
import { ApiStatus } from '../../../shared/types';
import { Download, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface BatchExportProps {
  selectedImages: Array<{
    id: string;
    name: string;
    imageUrl: string;
  }>;
  onExportComplete?: (successCount: number, failedCount: number) => void;
}

export const BatchExport: React.FC<BatchExportProps> = ({ 
  selectedImages, 
  onExportComplete 
}) => {
  const { theme } = useTheme();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({
    total: 0,
    completed: 0,
    failed: 0
  });
  const [exportStatus, setExportStatus] = useState<ApiStatus>(ApiStatus.Idle);

  const handleExport = async () => {
    if (selectedImages.length === 0) return;

    setIsExporting(true);
    setExportStatus(ApiStatus.Loading);
    setExportProgress({
      total: selectedImages.length,
      completed: 0,
      failed: 0
    });

    let successCount = 0;
    let failedCount = 0;

    for (const image of selectedImages) {
      try {
        await downloadImage(image.imageUrl, image.name);
        successCount++;
      } catch (error) {
        console.error(`Failed to export image ${image.name}:`, error);
        failedCount++;
      }
      
      setExportProgress(prev => ({
        ...prev,
        completed: successCount,
        failed: failedCount
      }));
    }

    setExportStatus(ApiStatus.Success);
    setIsExporting(false);
    
    if (onExportComplete) {
      onExportComplete(successCount, failedCount);
    }

    // 3秒后重置状态
    setTimeout(() => {
      setExportStatus(ApiStatus.Idle);
    }, 3000);
  };

  // 下载图片函数
  const downloadImage = async (url: string, fileName: string): Promise<void> => {
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  };

  return (
    <div 
      className="p-4 rounded-xl shadow-lg transition-all"
      style={{
        background: theme.colors.bgSecondary,
        border: `1px solid ${theme.colors.border}`
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 
          className="text-lg font-semibold"
          style={{ color: theme.colors.textPrimary }}
        >
          批量导出
        </h3>
        <Download 
          size={20} 
          style={{ color: theme.colors.primary }} 
        />
      </div>

      <div className="space-y-3">
        <div>
          <label 
            className="block text-sm font-medium mb-2"
            style={{ color: theme.colors.textSecondary }}
          >
            已选择图片
          </label>
          <div 
            className="p-3 rounded-lg"
            style={{
              background: theme.colors.bgTertiary,
              border: `1px solid ${theme.colors.borderLight}`
            }}
          >
            <p 
              className="text-sm"
              style={{ color: theme.colors.textPrimary }}
            >
              {selectedImages.length} 张图片
            </p>
          </div>
        </div>

        {exportStatus === ApiStatus.Loading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span 
                className="text-sm"
                style={{ color: theme.colors.textSecondary }}
              >
                导出进度
              </span>
              <span 
                className="text-sm font-medium"
                style={{ color: theme.colors.textPrimary }}
              >
                {exportProgress.completed + exportProgress.failed} / {exportProgress.total}
              </span>
            </div>
            <div 
              className="w-full h-2 rounded-full overflow-hidden"
              style={{ background: theme.colors.bgTertiary }}
            >
              <div 
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${((exportProgress.completed + exportProgress.failed) / exportProgress.total) * 100}%`,
                  background: theme.colors.primary
                }}
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle 
                size={16} 
                style={{ color: '#10b981' }} 
              />
              <span style={{ color: '#10b981' }}>
                {exportProgress.completed} 成功
              </span>
              <XCircle 
                size={16} 
                style={{ color: '#ef4444' }} 
              />
              <span style={{ color: '#ef4444' }}>
                {exportProgress.failed} 失败
              </span>
            </div>
          </div>
        )}

        {exportStatus === ApiStatus.Success && (
          <div 
            className="p-3 rounded-lg flex items-center gap-2"
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}
          >
            <CheckCircle 
              size={18} 
              style={{ color: '#10b981' }} 
            />
            <span 
              className="text-sm font-medium"
              style={{ color: '#10b981' }}
            >
              导出完成！
            </span>
          </div>
        )}

        <button
          onClick={handleExport}
          disabled={isExporting || selectedImages.length === 0}
          className="w-full py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: isExporting 
              ? theme.colors.primaryLight 
              : theme.colors.primary,
            color: 'white',
            boxShadow: theme.colors.shadow
          }}
        >
          {isExporting ? (
            <div className="flex items-center justify-center gap-2">
              <Clock size={18} className="animate-spin" />
              导出中...
            </div>
          ) : (
            `导出 ${selectedImages.length} 张图片`
          )}
        </button>
      </div>
    </div>
  );
};