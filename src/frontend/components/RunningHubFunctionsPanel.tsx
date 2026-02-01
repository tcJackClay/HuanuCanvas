import React, { useState } from 'react';
import { X, Search, Filter, Loader2, AlertCircle, Zap } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useRunningHubFunctions } from '../hooks/useRunningHubFunctions';
import type { RunningHubFunction, RunningHubFunctionsPanelProps } from '../../shared/types';
import FunctionIcon from './FunctionIcon';

/**
 * RunningHub功能面板组件
 * 以矩阵图标形式展示所有可用的RunningHub功能
 * 适配白天/夜晚主题
 */
const RunningHubFunctionsPanel: React.FC<RunningHubFunctionsPanelProps> = ({
  isVisible,
  onClose,
  onSelectFunction,
}) => {
  const { theme } = useTheme();
  const {
    functions,
    loading,
    error,
    fetchFunctions,
    getCategories
  } = useRunningHubFunctions();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // 如果面板不可见，不渲染任何内容
  if (!isVisible) return null;

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
    onClose();
  };

  // 获取所有分类
  const categories = getCategories();

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onClose}
      />

      {/* 功能面板 - 统一风格 */}
      <div
        className="fixed left-16 top-0 h-full w-72 backdrop-blur-xl border-l shadow-2xl flex flex-col rounded-2xl z-50 overflow-hidden"
        style={{
          backgroundColor: theme.colors.bgPanel,
          borderColor: theme.colors.border,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 面板头部 */}
        <div
          className="flex items-center justify-between p-2.5 border-b"
          style={{ borderColor: theme.colors.border }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.nodeRunningHub}33, ${theme.colors.nodeRunningHubLight}22)`,
              border: `1px solid ${theme.colors.nodeRunningHub}66`
            }}
          >
            <Zap size={18} style={{ color: theme.colors.nodeRunningHub }} />
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{
              backgroundColor: theme.colors.bgTertiary,
              color: theme.colors.textSecondary,
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* 搜索和分类区域 */}
        <div className="p-2.5 space-y-2 border-b" style={{ borderColor: theme.colors.border }}>
          {/* 搜索框 */}
          <div className="relative">
            <Search
              className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5"
              style={{ color: theme.colors.textMuted }}
            />
            <input
              type="text"
              placeholder="搜索功能..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 rounded-lg transition-all text-xs"
              style={{
                backgroundColor: theme.colors.bgTertiary,
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.textPrimary,
              }}
            />
          </div>

          {/* 分类过滤 */}
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap transition-all"
              style={{
                backgroundColor: selectedCategory === 'all' ? `${theme.colors.nodeRunningHub}33` : theme.colors.bgTertiary,
                color: selectedCategory === 'all' ? theme.colors.nodeRunningHub : theme.colors.textSecondary,
                border: `1px solid ${selectedCategory === 'all' ? theme.colors.nodeRunningHub + '66' : theme.colors.border}`,
              }}
            >
              <Filter className="w-2.5 h-2.5" />
              全部 ({functions.length})
            </button>

            {categories.map(category => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap transition-all"
                style={{
                  backgroundColor: selectedCategory === category.name ? `${theme.colors.nodeRunningHub}33` : theme.colors.bgTertiary,
                  color: selectedCategory === category.name ? theme.colors.nodeRunningHub : theme.colors.textSecondary,
                  border: `1px solid ${selectedCategory === category.name ? theme.colors.nodeRunningHub + '66' : theme.colors.border}`,
                }}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>
        </div>

        {/* 功能网格区域 */}
        <div className="flex-1 overflow-y-auto p-2.5">
          {/* 加载状态 */}
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: theme.colors.nodeRunningHub }} />
              <span className="ml-1.5 text-[10px]" style={{ color: theme.colors.textSecondary }}>
                加载中...
              </span>
            </div>
          )}

          {/* 错误状态 */}
          {error && (
            <div className="flex items-center justify-center py-4">
              <div className="text-center">
                <AlertCircle className="w-5 h-5 mx-auto mb-1.5" style={{ color: theme.colors.error }} />
                <p className="text-[10px] mb-2" style={{ color: theme.colors.error }}>
                  {error}
                </p>
                <button
                  onClick={() => fetchFunctions()}
                  className="px-2.5 py-1 rounded-lg text-[10px] transition-all"
                  style={{
                    backgroundColor: `${theme.colors.nodeRunningHub}22`,
                    color: theme.colors.nodeRunningHub,
                  }}
                >
                  重试
                </button>
              </div>
            </div>
          )}

          {/* 空状态 */}
          {!loading && !error && filteredFunctions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
                style={{ backgroundColor: theme.colors.bgTertiary }}
              >
                <Search className="w-4 h-4" style={{ color: theme.colors.textMuted }} />
              </div>
              <p className="text-[10px]" style={{ color: theme.colors.textSecondary }}>
                {searchTerm ? '未找到匹配的功能' : '暂无功能'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-1.5 text-[10px] transition-all"
                  style={{ color: theme.colors.nodeRunningHub }}
                >
                  清除搜索
                </button>
              )}
            </div>
          )}

          {/* 功能网格 */}
          {!loading && !error && filteredFunctions.length > 0 && (
            <div className="space-y-3">
              {/* 当前分类显示 */}
              {selectedCategory !== 'all' && (
                <div className="text-center">
                  <h3 className="text-[10px] font-medium" style={{ color: theme.colors.textSecondary }}>
                    {selectedCategory} ({filteredFunctions.length})
                  </h3>
                </div>
              )}

              {/* 功能图标矩阵 */}
              <div className="grid grid-cols-3 gap-1.5 justify-items-center">
                {filteredFunctions.map(func => (
                  <FunctionIcon
                    key={func.id}
                    func={func}
                    onClick={handleFunctionSelect}
                  />
                ))}
              </div>

              {/* 统计信息 */}
              <div className="text-center pt-2 border-t" style={{ borderColor: theme.colors.border }}>
                <p className="text-[9px]" style={{ color: theme.colors.textMuted }}>
                  {filteredFunctions.length} 个功能
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 面板底部 */}
        <div
          className="p-2 border-t flex items-center justify-between"
          style={{ borderColor: theme.colors.border }}
        >
          <span className="text-[9px]" style={{ color: theme.colors.textMuted }}>
            点击图标快速创建
          </span>
          <button
            onClick={() => fetchFunctions()}
            disabled={loading}
            className="flex items-center gap-1 px-2 py-0.5 rounded transition-all"
            style={{
              color: theme.colors.textSecondary,
              opacity: loading ? 0.5 : 1,
              fontSize: '10px',
            }}
          >
            <Loader2 className={`w-2.5 h-2.5 ${!loading && 'animate-spin'}`} />
            刷新
          </button>
        </div>
      </div>
    </>
  );
};

export default RunningHubFunctionsPanel;