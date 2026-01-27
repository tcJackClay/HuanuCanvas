import React, { useState } from 'react';
import RunningHubResultModal from './RunningHubResultModal';
import { TaskResult } from '../types/runningHubResultTypes';

const mockTaskResults: Record<string, TaskResult> = {
  success: {
    status: 'success',
    output: {
      images: [
        'https://picsum.photos/800/600?random=1',
        'https://picsum.photos/800/600?random=2',
        'https://picsum.photos/800/600?random=3'
      ],
      videos: ['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'],
      audios: ['https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'],
      files: ['https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'],
      message: '任务执行成功！生成了 3 张图片、1 个视频、1 个音频和 1 个文件。'
    }
  },
  running: {
    status: 'running'
  },
  failed: {
    status: 'failed',
    error: '网络连接超时，请检查网络设置后重试。'
  },
  noOutput: {
    status: 'success',
    output: {
      message: '任务执行完成，但没有生成任何输出文件。'
    }
  }
};

const RunningHubResultDemo: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentResult, setCurrentResult] = useState<TaskResult | null>(null);

  const handleOpenModal = (resultKey: string) => {
    const result = mockTaskResults[resultKey];
    setCurrentResult(result);
    setIsOpen(true);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">RunningHub 结果展示窗口演示</h1>
        <p className="text-gray-600">点击下面的按钮来测试不同的结果展示效果</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold mb-2">成功结果</h3>
          <p className="text-sm text-gray-600 mb-4">包含多种文件类型的成功执行结果</p>
          <button 
            onClick={() => handleOpenModal('success')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            查看成功结果
          </button>
        </div>

        <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold mb-2">运行中</h3>
          <p className="text-sm text-gray-600 mb-4">显示任务正在执行的状态</p>
          <button 
            onClick={() => handleOpenModal('running')}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            查看运行状态
          </button>
        </div>

        <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold mb-2">执行失败</h3>
          <p className="text-sm text-gray-600 mb-4">显示任务执行失败的错误信息</p>
          <button 
            onClick={() => handleOpenModal('failed')}
            className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            查看失败结果
          </button>
        </div>

        <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold mb-2">无输出</h3>
          <p className="text-sm text-gray-600 mb-4">显示成功但没有文件输出的结果</p>
          <button 
            onClick={() => handleOpenModal('noOutput')}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            查看无输出结果
          </button>
        </div>
      </div>

      <div className="border rounded-lg p-6 mb-8 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">功能特性</h2>
        <p className="text-gray-600 mb-4">RunningHubResultModal 组件的主要功能特性</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium">多文件类型支持</h4>
              <p className="text-sm text-gray-600">图片、视频、音频、文档预览</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium">拖拽移动</h4>
              <p className="text-sm text-gray-600">可自由拖拽窗口位置</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium">全屏模式</h4>
              <p className="text-sm text-gray-600">支持全屏预览和操作</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium">批量下载</h4>
              <p className="text-sm text-gray-600">一键下载所有文件</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium">键盘快捷键</h4>
              <p className="text-sm text-gray-600">ESC关闭、F全屏等快捷操作</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium">响应式设计</h4>
              <p className="text-sm text-gray-600">适配不同屏幕尺寸</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">快捷键说明</h2>
        <p className="text-gray-600 mb-4">支持的键盘快捷键操作</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">ESC</kbd>
            <span className="text-sm">关闭窗口</span>
          </div>
          <div className="flex items-center space-x-3">
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">F</kbd>
            <span className="text-sm">全屏切换</span>
          </div>
          <div className="flex items-center space-x-3">
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">←</kbd>
            <span className="text-sm">上一张图片</span>
          </div>
          <div className="flex items-center space-x-3">
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">→</kbd>
            <span className="text-sm">下一张图片</span>
          </div>
          <div className="flex items-center space-x-3">
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">Space</kbd>
            <span className="text-sm">播放/暂停</span>
          </div>
          <div className="flex items-center space-x-3">
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">Ctrl+D</kbd>
            <span className="text-sm">下载文件</span>
          </div>
        </div>
      </div>

      {/* 结果展示模态窗口 */}
      <RunningHubResultModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        taskResult={currentResult}
        nodePosition={{ x: 100, y: 100 }}
        title="RunningHub 执行结果"
      />
    </div>
  );
};

export default RunningHubResultDemo;