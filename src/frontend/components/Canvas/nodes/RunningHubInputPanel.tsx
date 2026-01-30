import React from 'react';
import { Upload, FileText, Image, Video } from 'lucide-react';

interface RunningHubInput {
  fieldName: string;
  fieldType: 'image' | 'text' | 'video' | 'file';
  value: any;
  label: string;
  required: boolean;
}

interface PreviewData {
  [key: string]: any;
}

interface RunningHubInputPanelProps {
  inputs: RunningHubInput[];
  preview?: PreviewData;
  onChange: (inputName: string, value: any) => void;
  isProcessing?: boolean;
}

export const RunningHubInputPanel: React.FC<RunningHubInputPanelProps> = ({
  inputs,
  preview,
  onChange,
  isProcessing = false
}) => {
  const getFieldIcon = (fieldType: string) => {
    switch (fieldType) {
      case 'image': return <Image size={14} className="text-blue-500" />;
      case 'video': return <Video size={14} className="text-purple-500" />;
      case 'file': return <FileText size={14} className="text-green-500" />;
      default: return <FileText size={14} className="text-gray-500" />;
    }
  };

  const handleFileUpload = async (inputName: string, file: File) => {
    try {
      // 验证文件类型
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/mov'];
      if (!validTypes.includes(file.type)) {
        throw new Error('不支持的文件类型');
      }

      // 验证文件大小 (30MB限制)
      if (file.size > 30 * 1024 * 1024) {
        throw new Error('文件大小不能超过30MB');
      }

      // 转换为base64用于即时预览
      const base64 = await convertToBase64(file);
      
      // 调用onChange更新值
      onChange(inputName, {
        file: file,
        base64: base64,
        name: file.name,
        size: file.size,
        type: file.type
      });

    } catch (error) {
      console.error('文件上传失败:', error);
      // 这里可以添加错误处理UI
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const renderInputField = (input: RunningHubInput) => {
    const previewValue = preview?.[input.fieldName];
    const hasValue = input.value || previewValue;

    return (
      <div key={input.fieldName} className="mb-3">
        <label className="flex items-center gap-2 text-xs font-medium text-gray-700 mb-1">
          {getFieldIcon(input.fieldType)}
          {input.label}
          {input.required && <span className="text-red-500">*</span>}
        </label>

        {input.fieldType === 'text' ? (
          <textarea
            value={input.value || ''}
            onChange={(e) => onChange(input.fieldName, e.target.value)}
            placeholder={`输入${input.label}...`}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={2}
          />
        ) : (
          <div className="relative">
            {/* 文件上传区域 */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept={input.fieldType === 'image' ? 'image/*' : input.fieldType === 'video' ? 'video/*' : '*'}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(input.fieldName, file);
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isProcessing}
              />
              
              {/* 预览图 */}
              {hasValue && input.fieldType === 'image' && (
                <div className="mb-2">
                  <img
                    src={input.value?.base64 || previewValue?.base64}
                    alt={input.label}
                    className="max-w-full max-h-20 mx-auto rounded"
                  />
                </div>
              )}

              {/* 上传提示 */}
              <div className="text-xs text-gray-500">
                <Upload size={16} className="mx-auto mb-1" />
                {hasValue ? '点击更换文件' : `上传${input.label}`}
                {input.required && <span className="text-red-500 ml-1">*</span>}
              </div>
            </div>

            {/* 文件信息 */}
            {hasValue && (
              <div className="mt-1 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                  <span className="truncate">
                    {input.value?.name || previewValue?.name || '未命名文件'}
                  </span>
                  {input.value?.size && (
                    <span>
                      {(input.value.size / 1024 / 1024).toFixed(1)}MB
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!inputs || inputs.length === 0) {
    return (
      <div className="text-xs text-gray-500 text-center py-2">
        暂无输入配置
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <h4 className="text-xs font-medium text-gray-700 mb-2">输入参数</h4>
      {inputs.map(renderInputField)}
      
      {isProcessing && (
        <div className="flex items-center gap-2 text-xs text-blue-600 mt-2">
          <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
          处理中...
        </div>
      )}
    </div>
  );
};