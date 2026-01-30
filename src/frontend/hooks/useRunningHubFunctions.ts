import { useState, useCallback, useEffect } from 'react';
import type { 
  RunningHubFunction, 
  RunningHubFunctionsResponse, 
  RunningHubFunctionOperationResponse,
  ApiStatus 
} from '../../shared/types';

/**
 * RunningHub功能管理Hook
 * 提供功能的CRUD操作和状态管理
 */
export const useRunningHubFunctions = () => {
  const [functions, setFunctions] = useState<RunningHubFunction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取所有功能
  const fetchFunctions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/runninghub/functions');
      const data: RunningHubFunctionsResponse = await response.json();
      
      if (data.success) {
        setFunctions(data.data);
      } else {
        throw new Error(data.error || '获取功能列表失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setError(errorMessage);
      console.error('获取RunningHub功能失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 添加新功能
  const addFunction = useCallback(async (newFunction: Omit<RunningHubFunction, 'id'> & { id?: string }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/runninghub/functions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newFunction),
      });
      
      const data: RunningHubFunctionOperationResponse = await response.json();
      
      if (data.success) {
        setFunctions(prev => [...prev, data.data!]);
        return data.data;
      } else {
        throw new Error(data.details || data.error || '添加功能失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setError(errorMessage);
      console.error('添加RunningHub功能失败:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 更新功能
  const updateFunction = useCallback(async (id: string, updates: Partial<RunningHubFunction>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/runninghub/functions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      const data: RunningHubFunctionOperationResponse = await response.json();
      
      if (data.success) {
        setFunctions(prev => prev.map(func => 
          func.id === id ? data.data! : func
        ));
        return data.data;
      } else {
        throw new Error(data.details || data.error || '更新功能失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setError(errorMessage);
      console.error('更新RunningHub功能失败:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 删除功能
  const deleteFunction = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/runninghub/functions/${id}`, {
        method: 'DELETE',
      });
      
      const data: RunningHubFunctionOperationResponse = await response.json();
      
      if (data.success) {
        setFunctions(prev => prev.filter(func => func.id !== id));
        return data.deletedFunction;
      } else {
        throw new Error(data.details || data.error || '删除功能失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setError(errorMessage);
      console.error('删除RunningHub功能失败:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 按分类获取功能
  const getFunctionsByCategory = useCallback((category: string) => {
    return functions.filter(func => func.category === category);
  }, [functions]);

  // 获取所有分类
  const getCategories = useCallback(() => {
    const categories = new Map<string, number>();
    functions.forEach(func => {
      const count = categories.get(func.category) || 0;
      categories.set(func.category, count + 1);
    });
    return Array.from(categories.entries()).map(([name, count]) => ({
      name,
      count,
    }));
  }, [functions]);

  // 初始化时获取功能列表
  useEffect(() => {
    fetchFunctions();
  }, [fetchFunctions]);

  return {
    // 状态
    functions,
    loading,
    error,
    
    // 操作方法
    fetchFunctions,
    addFunction,
    updateFunction,
    deleteFunction,
    
    // 辅助方法
    getFunctionsByCategory,
    getCategories,
    
    // 状态管理
    setError,
    clearError: () => setError(null),
  };
};

// 导出类型
export type UseRunningHubFunctionsReturn = ReturnType<typeof useRunningHubFunctions>;