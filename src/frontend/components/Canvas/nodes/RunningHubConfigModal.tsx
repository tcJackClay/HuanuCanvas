import React, { useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { X, Save, Eye, EyeOff } from 'lucide-react';

interface RunningHubConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (webappId: string, apiKey: string) => void;
  initialWebappId?: string;
  initialApiKey?: string;
}

const RunningHubConfigModal: React.FC<RunningHubConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialWebappId = '',
  initialApiKey = ''
}) => {
  const { theme } = useTheme();
  const [webappId, setWebappId] = useState(initialWebappId);
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [errors, setErrors] = useState<{ webappId?: string; apiKey?: string }>({});

  const validateAndSave = () => {
    const newErrors: { webappId?: string; apiKey?: string } = {};
    
    if (!webappId.trim()) {
      newErrors.webappId = '请输入 WebApp ID';
    }
    
    if (!apiKey.trim()) {
      newErrors.apiKey = '请输入 API Key';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(webappId.trim(), apiKey.trim());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
        onClick={onClose} 
      />

      {/* 主弹窗 */}
      <div 
        className="relative w-full max-w-md rounded-2xl overflow-hidden animate-fade-in"
        style={{
          background: theme.colors.bgPanel,
          border: `1px solid ${theme.colors.border}`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
        }}
      >
        {/* 头部 */}
        <div 
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: theme.colors.border }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
            >
              <span className="text-white font-bold">R</span>
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: theme.colors.textPrimary }}>RunningHub 配置</h2>
              <p className="text-xs" style={{ color: theme.colors.textSecondary }}>配置应用访问凭证</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', color: theme.colors.textSecondary }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="p-6 space-y-6">
          {/* WebApp ID 输入 */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textPrimary }}>
              WebApp ID <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={webappId}
              onChange={(e) => {
                setWebappId(e.target.value);
                if (errors.webappId) {
                  setErrors(prev => ({ ...prev, webappId: undefined }));
                }
              }}
              placeholder="请输入 RunningHub WebApp ID"
              className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors"
              style={{
                backgroundColor: theme.colors.bgTertiary,
                color: theme.colors.textPrimary,
                borderColor: errors.webappId ? '#ef4444' : theme.colors.border,
                border: `1px solid ${errors.webappId ? '#ef4444' : theme.colors.border}`
              }}
            />
            {errors.webappId && (
              <p className="mt-1 text-xs text-red-400">{errors.webappId}</p>
            )}
          </div>

          {/* API Key 输入 */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textPrimary }}>
              API Key <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  if (errors.apiKey) {
                    setErrors(prev => ({ ...prev, apiKey: undefined }));
                  }
                }}
                placeholder="请输入 RunningHub API Key"
                className="w-full px-4 py-3 pr-12 rounded-lg text-sm outline-none transition-colors"
                style={{
                  backgroundColor: theme.colors.bgTertiary,
                  color: theme.colors.textPrimary,
                  borderColor: errors.apiKey ? '#ef4444' : theme.colors.border,
                  border: `1px solid ${errors.apiKey ? '#ef4444' : theme.colors.border}`
                }}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors"
                style={{ color: theme.colors.textMuted }}
              >
                {showApiKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.apiKey && (
              <p className="mt-1 text-xs text-red-400">{errors.apiKey}</p>
            )}
          </div>

          {/* 帮助提示 */}
          <div 
            className="p-4 rounded-lg text-xs"
            style={{ 
              backgroundColor: 'rgba(59, 130, 246, 0.1)', 
              border: '1px solid rgba(59, 130, 246, 0.2)',
              color: '#60a5fa'
            }}
          >
            <p className="font-medium mb-1">💡 获取配置信息：</p>
            <ul className="space-y-1 ml-4">
              <li>• 登录 RunningHub 平台</li>
              <li>• 创建或选择一个应用</li>
              <li>• 在应用设置中找到 WebApp ID</li>
              <li>• 生成 API Key 并复制</li>
            </ul>
          </div>
        </div>

        {/* 底部操作区 */}
        <div 
          className="flex items-center justify-between px-6 py-4 border-t"
          style={{ borderColor: theme.colors.border, backgroundColor: 'rgba(10, 10, 10, 0.95)' }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm transition-colors"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.06)', 
              color: theme.colors.textSecondary
            }}
          >
            取消
          </button>
          <button
            onClick={validateAndSave}
            className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ 
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white',
            }}
          >
            <Save className="w-4 h-4" />
            保存配置
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default RunningHubConfigModal;