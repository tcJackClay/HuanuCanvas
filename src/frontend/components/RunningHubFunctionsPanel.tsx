import React, { useState, useEffect } from 'react';
import { X, Search, Filter, Loader2, AlertCircle } from 'lucide-react';
import { useRunningHubFunctions } from '../hooks/useRunningHubFunctions';
import type { RunningHubFunction, RunningHubFunctionsPanelProps } from '../../shared/types';
import FunctionIcon from './FunctionIcon';

/**
 * RunningHub功能面板组件
 * 以矩阵图标形式展示所有可用的RunningHub功能
 */
const RunningHubFunctionsPanel: React.FC<RunningHubFunctionsPanelProps> = ({
  isVisible,
  onClose,
  onSelectFunction,
}) => {
  const { 
    functions, 
    loading, 
    error, 
    fetchFunctions, 
    getFunctionsByCategory, 
    getCategories 
  } = useRunningHubFunctions();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 刷新功能列表
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchFunctions();
    setIsRefreshing(false);
  };

  // 过滤功能
  const filteredFunctions = functions.filter(func => {
    const matchesSearch = func.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         func.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || func.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 处理功能选择
  const handleFunctionSelect = (func: RunningHubFunction) => {
    onSelectFunction(func);
    onClose(); // 选择后自动关闭面板
  };

  // 获取所有分类
  const categories = getCategories();

  // 如果面板不可见，不渲染任何内容
  if (!isVisible) return null;

  return (
    <>
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* 功能面板 */}
      <div className="fixed left-0 top-0 h-full w-80 bg-gray-900/95 backdrop-blur-xl border-r border-gray-700/50 shadow-2xl z-50 flex flex-col">
        {/* 面板头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
            >
              🚀
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">RUNNINGHUB</h2>
              <p className="text-xs text-gray-400">功能面板</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 flex items-center justify-center text-gray-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 搜索和过滤区域 */}
        <div className="p-4 border-b border-gray-700/50 space-y-3">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索功能..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            />
          </div>

          {/* 分类过滤 */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-gray-800/50 text-gray-400 border border-gray-600/30 hover:bg-gray-700/50 hover:text-gray-300'
              }`}
            >
              <Filter className="w-3 h-3" />
              全部 ({functions.length})
            </button>
            
            {categories.map(category => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category.name
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-gray-800/50 text-gray-400 border border-gray-600/30 hover:bg-gray-700/50 hover:text-gray-300'
                }`}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>
        </div>

        {/* 功能网格区域 */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* 加载状态 */}
          {(loading || isRefreshing) && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              <span className="ml-2 text-gray-400">
                {isRefreshing ? '刷新中...' : '加载中...'}
              </span>
            </div>
          )}

          {/* 错误状态 */}
          {error && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-red-400 text-sm mb-3">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-sm transition-all"
                >
                  重试
                </button>
              </div>
            </div>
          )}

          {/* 空状态 */}
          {!loading && !error && filteredFunctions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <p className="text-gray-400 text-sm">
                {searchTerm ? '未找到匹配的功能' : '暂无功能'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
                >
                  清除搜索
                </button>
              )}
            </div>
          )}

          {/* 功能网格 */}
          {!loading && !error && filteredFunctions.length > 0 && (
            <div className="space-y-6">
              {/* 如果有分类过滤，显示当前分类 */}
              {selectedCategory !== 'all' && (
                <div className="text-center">
                  <h3 className="text-sm font-medium text-gray-300 mb-4">
                    {selectedCategory} ({filteredFunctions.length})
                  </h3>
                </div>
              )}

              {/* 功能图标矩阵 */}
              <div className="grid grid-cols-3 gap-3 justify-items-center">
                {filteredFunctions.map(func => (
                  <FunctionIcon
                    key={func.id}
                    func={func}
                    onClick={handleFunctionSelect}
                  />
                ))}
              </div>

              {/* 统计信息 */}
              <div className="text-center pt-4 border-t border-gray-700/30">
                <p className="text-xs text-gray-500">
                  显示 {filteredFunctions.length} 个功能
                  {selectedCategory !== 'all' && ` · ${selectedCategory}`}
                  {searchTerm && ` · 搜索: "${searchTerm}"`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 面板底部 */}
        <div className="p-4 border-t border-gray-700/50">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>点击图标快速创建</span>
            <button
              onClick={handleRefresh}
              disabled={loading || isRefreshing}
              className="flex items-center gap-1 px-2 py-1 hover:bg-gray-800/50 rounded transition-all disabled:opacity-50"
            >
              <Loader2 className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              刷新
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default RunningHubFunctionsPanel;