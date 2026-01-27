import React, { useState, useEffect } from 'react';
import { Eye as EyeIcon, EyeOff as EyeOffIcon, Check, X } from 'lucide-react';

interface RunningHubConfig {
  webappId: string;
  apiKey: string;
}

interface RunningHubConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialConfig: RunningHubConfig;
  onSave: (config: RunningHubConfig) => void;
}

export const RunningHubConfigPanel: React.FC<RunningHubConfigPanelProps> = ({
  isOpen,
  onClose,
  initialConfig,
  onSave
}) => {
  const [webappId, setWebappId] = useState(initialConfig.webappId || '');
  const [apiKey, setApiKey] = useState(initialConfig.apiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setWebappId(initialConfig.webappId || '');
      setApiKey(initialConfig.apiKey || '');
      setSaveSuccess(false);
    }
  }, [isOpen, initialConfig]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ webappId, apiKey });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      {/* 弹窗 */}
      <div 
        className="relative w-full max-w-md rounded-2xl overflow-hidden animate-fade-in flex flex-col bg-[#1c1c1e] border border-white/10 shadow-2xl"
      >
        {/* 头部 */}
        <div className="px-6 py-5 border-b border-white/5">
          <h2 className="text-xl font-bold text-white">RunningHub 配置</h2>
          <p className="text-sm text-gray-400 mt-1">配置 WebAppId 和 API Key</p>
        </div>

        {/* 内容区 */}
        <div className="px-6 py-5 space-y-5">
          {/* WebAppId */}
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              WebAppId
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
              value={webappId}
              onChange={(e) => setWebappId(e.target.value)}
              placeholder="输入 WebAppId"
            />
          </div>

          {/* API Key */}
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none pr-10"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="输入 API Key"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showApiKey ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-white/5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-lg border border-gray-700 bg-gray-900 text-white hover:bg-gray-800 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 px-4 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
                保存成功
              </>
            ) : (
              '保存'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
