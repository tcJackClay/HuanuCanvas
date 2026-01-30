import { useState, useCallback, useMemo } from 'react';

interface PreviewData {
  [key: string]: any;
}

interface TaskResult {
  success: boolean;
  data?: any;
  error?: string;
  taskId: string;
  timestamp: number;
}

interface RunningHubConfig {
  nodeType: string;
  parameters: Record<string, any>;
  version?: string;
}

interface InstantState {
  preview: PreviewData | null;
  isProcessing: boolean;
  error: string | null;
  selectedTask: TaskResult | null;
}

interface DeepState {
  taskHistory: TaskResult[];
  currentConfig: RunningHubConfig | null;
  lastTask: TaskResult | null;
  taskQueue: TaskResult[];
}

interface RunningHubState {
  instantState: InstantState;
  deepState: DeepState;
  updateInstantState: (updates: Partial<InstantState>) => void;
  updateDeepState: (updates: Partial<DeepState>) => void;
  clearState: () => void;
  // 便捷方法
  addTask: (task: TaskResult) => void;
  updateTask: (taskId: string, updates: Partial<TaskResult>) => void;
  removeTask: (taskId: string) => void;
  getTask: (taskId: string) => TaskResult | undefined;
  clearTasks: () => void;
  updateConfig: (config: RunningHubConfig) => void;
  isTaskRunning: boolean;
  latestTask: TaskResult | null;
}

export const useRunningHubState = (): RunningHubState => {
  // 即时状态（用于UI预览和交互）
  const [instantState, setInstantState] = useState<InstantState>({
    preview: null,
    isProcessing: false,
    error: null,
    selectedTask: null
  });

  // 深度状态（用于数据持久化和历史记录）
  const [deepState, setDeepState] = useState<DeepState>({
    taskHistory: [],
    currentConfig: null,
    lastTask: null,
    taskQueue: []
  });

  // 更新即时状态
  const updateInstantState = useCallback((updates: Partial<InstantState>) => {
    setInstantState(prev => ({ ...prev, ...updates }));
  }, []);

  // 更新深度状态
  const updateDeepState = useCallback((updates: Partial<DeepState>) => {
    setDeepState(prev => ({ ...prev, ...updates }));
  }, []);

  // 清空所有状态
  const clearState = useCallback(() => {
    setInstantState({
      preview: null,
      isProcessing: false,
      error: null,
      selectedTask: null
    });
    setDeepState({
      taskHistory: [],
      currentConfig: null,
      lastTask: null,
      taskQueue: []
    });
  }, []);

  // 添加任务到历史
  const addTask = useCallback((task: TaskResult) => {
    setDeepState(prev => ({
      ...prev,
      taskHistory: [task, ...prev.taskHistory],
      lastTask: task,
      taskQueue: prev.taskQueue.filter(t => t.taskId !== task.taskId)
    }));
  }, []);

  // 更新特定任务
  const updateTask = useCallback((taskId: string, updates: Partial<TaskResult>) => {
    setDeepState(prev => ({
      ...prev,
      taskHistory: prev.taskHistory.map(task => 
        task.taskId === taskId ? { ...task, ...updates } : task
      ),
      lastTask: prev.lastTask?.taskId === taskId 
        ? { ...prev.lastTask, ...updates }
        : prev.lastTask
    }));
  }, []);

  // 移除任务
  const removeTask = useCallback((taskId: string) => {
    setDeepState(prev => ({
      ...prev,
      taskHistory: prev.taskHistory.filter(task => task.taskId !== taskId),
      lastTask: prev.lastTask?.taskId === taskId ? null : prev.lastTask,
      taskQueue: prev.taskQueue.filter(task => task.taskId !== taskId)
    }));
  }, []);

  // 获取特定任务
  const getTask = useCallback((taskId: string): TaskResult | undefined => {
    return deepState.taskHistory.find(task => task.taskId === taskId);
  }, [deepState.taskHistory]);

  // 清空任务历史
  const clearTasks = useCallback(() => {
    setDeepState(prev => ({
      ...prev,
      taskHistory: [],
      lastTask: null,
      taskQueue: []
    }));
  }, []);

  // 更新配置
  const updateConfig = useCallback((config: RunningHubConfig) => {
    setDeepState(prev => ({
      ...prev,
      currentConfig: config
    }));
  }, []);

  // 计算属性
  const isTaskRunning = useMemo(() => {
    return deepState.taskQueue.length > 0 || 
           deepState.taskHistory.some(task => !task.success && !task.error);
  }, [deepState.taskQueue, deepState.taskHistory]);

  const latestTask = useMemo(() => {
    return deepState.taskHistory.length > 0 ? deepState.taskHistory[0] : null;
  }, [deepState.taskHistory]);

  return {
    instantState,
    deepState,
    updateInstantState,
    updateDeepState,
    clearState,
    addTask,
    updateTask,
    removeTask,
    getTask,
    clearTasks,
    updateConfig,
    isTaskRunning,
    latestTask
  };
};

// 任务状态管理Hook
export const useTaskManager = () => {
  const { addTask, updateTask, removeTask, getTask, isTaskRunning, latestTask } = useRunningHubState();

  // 创建新任务
  const createTask = useCallback((inputs: any[] = []): TaskResult => {
    const taskId = generateTaskId();
    return {
      taskId,
      success: false,
      error: null,
      data: null,
      timestamp: Date.now()
    };
  }, []);

  // 生成任务ID
  const generateTaskId = useCallback((): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // 完成任务
  const completeTask = useCallback((taskId: string, data: any) => {
    updateTask(taskId, {
      success: true,
      data,
      error: null
    });
  }, [updateTask]);

  // 标记任务失败
  const failTask = useCallback((taskId: string, error: string) => {
    updateTask(taskId, {
      success: false,
      error
    });
  }, [updateTask]);

  // 提交任务
  const submitTask = useCallback(async (
    config: RunningHubConfig,
    inputs: any[],
    apiKey: string
  ): Promise<TaskResult> => {
    const task = createTask(inputs);
    addTask(task);

    try {
      // 这里应该调用实际的API
      const result = await RunningHubTaskService.submitTask(config, inputs, apiKey);
      
      if (result.success) {
        completeTask(task.taskId, result.data);
      } else {
        failTask(task.taskId, result.error || '未知错误');
      }

      return result;
    } catch (error) {
      failTask(task.taskId, error instanceof Error ? error.message : '提交失败');
      throw error;
    }
  }, [createTask, addTask, completeTask, failTask]);

  return {
    createTask,
    submitTask,
    completeTask,
    failTask,
    removeTask,
    getTask,
    isTaskRunning,
    latestTask
  };
};

// 简化的任务服务（实际项目中应该从服务层导入）
const RunningHubTaskService = {
  async submitTask(
    config: RunningHubConfig,
    inputs: any[],
    apiKey: string
  ): Promise<TaskResult> {
    // 这里应该调用实际的API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          taskId: 'mock-task-id',
          success: Math.random() > 0.3, // 70%成功率
          data: { result: 'mock result' },
          error: Math.random() > 0.3 ? null : '模拟错误',
          timestamp: Date.now()
        });
      }, 2000);
    });
  }
};