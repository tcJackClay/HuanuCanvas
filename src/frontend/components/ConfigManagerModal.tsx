/**
 * 配置文件管理模态框
 * 统一管理所有配置设置
 */

import React from 'react';
import { X, FileText, AlertTriangle } from 'lucide-react';

interface ConfigManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConfigManagerModal: React.FC<ConfigManagerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            配置文件管理
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6 space-y-6">
          {/* 配置说明 */}
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
            <div className="flex items-start">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium mb-2 text-blue-900 dark:text-blue-100">
                  配置文件管理
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-200 mb-3">
                  新的配置管理系统将所有设置统一存储在配置文件中，提供更好的安全性和可维护性。
                </p>
                
                <div className="bg-white dark:bg-gray-700 p-3 rounded border">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    配置文件位置：
                  </div>
                  <code className="block bg-gray-100 dark:bg-gray-600 text-xs p-2 rounded text-gray-800 dark:text-gray-200 font-mono">
                    src/data/app-config.json
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* 配置示例 */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-medium mb-3 text-gray-900 dark:text-gray-100">
              配置示例：
            </h4>
            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded border overflow-x-auto text-gray-800 dark:text-gray-200">
{`{
  "apis": {
    "runninghub": {
      "enabled": true,
      "apiKey": "your-api-key-here",
      "webappId": "your-webapp-id-here"
    }
  }
}`}
            </pre>
          </div>

          {/* 重要提示 */}
          <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                  重要提示
                </h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-200 space-y-1">
                  <li>• 请直接编辑配置文件来设置API密钥和参数</li>
                  <li>• 修改配置后需要重启应用程序</li>
                  <li>• 请妥善保管配置文件，避免泄露API密钥</li>
                  <li>• 如需重置配置，可删除配置文件后重启应用</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 配置验证 */}
          <div className="text-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              我知道了
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigManagerModal;