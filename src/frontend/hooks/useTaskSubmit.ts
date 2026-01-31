import { useState, useCallback, useRef } from 'react';
import type { RunningHubNodeType } from '@/shared/types/pebblingTypes';

export type TaskStatus = 'idle' | 'running' | 'success' | 'failed';

export interface TaskResult {
  status: TaskStatus;
  output?: {
    images?: string[];
    videos?: string[];
    files?: string[];
    message?: string;
    localImages?: string[];
    localVideos?: string[];
    localFiles?: string[];
  };
  error?: string;
  taskId?: string;
}

export interface NodeInfo {
  nodeId: string;
  nodeName: string;
  fieldName: string;
  fieldValue: string;
  fieldType: string;
  fieldData?: string;
  description?: string;
  uploadStatus?: string;
  serverFilePath?: string;
}

export interface UseTaskSubmitOptions {
  functionId: string;
  onTaskStart?: () => void;
  onTaskSuccess?: (result: TaskResult) => void;
  onTaskError?: (error: string) => void;
  onTaskProgress?: (status: TaskStatus, taskId?: string) => void;
}

export function useTaskSubmit(options: UseTaskSubmitOptions) {
  const { functionId, onTaskStart, onTaskSuccess, onTaskError, onTaskProgress } = options;

  const [taskStatus, setTaskStatus] = useState<TaskStatus>('idle');
  const [taskResult, setTaskResult] = useState<TaskResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const buildNodeInfoList = useCallback((nodes: RunningHubNodeType[]): NodeInfo[] => {
    return nodes.map(n => {
      let fieldValue = n.fieldValue || '';

      if (n.uploadStatus === 'success' && n.serverFilePath) {
        // 移除 api/ 前缀（RunningHub 期望的格式）
        fieldValue = n.serverFilePath.replace(/^api\//, '');
      } else if (n.uploadStatus === 'uploading') {
        fieldValue = `上传中: ${n.fieldValue}`;
      } else if (n.uploadStatus === 'failed') {
        fieldValue = `上传失败: ${n.fieldValue} - ${n.uploadError}`;
      }

      return {
        nodeId: n.nodeId,
        nodeName: n.nodeName,
        fieldName: n.fieldName,
        fieldValue,
        fieldType: n.fieldType,
        fieldData: n.fieldData,
        description: n.description,
        uploadStatus: n.uploadStatus,
        serverFilePath: n.serverFilePath
      };
    });
  }, []);

  const uploadLocalFiles = useCallback(async (nodeInfoList: NodeInfo[]): Promise<void> => {
    const localFileNodes = nodeInfoList.filter(n =>
      n.fieldType === 'IMAGE' &&
      n.uploadStatus !== 'success' &&  // 跳过已上传成功的节点
      n.fieldValue?.startsWith('/files/') &&
      !n.fieldValue.startsWith('http')
    );

    if (localFileNodes.length === 0) return;

    console.log('[RunningHub] 检测到本地文件，需要上传到 RunningHub:', localFileNodes.length);

    const pathMapping: Record<string, string> = {};

    for (const node of localFileNodes) {
      if (pathMapping[node.fieldValue]) {
        node.fieldValue = pathMapping[node.fieldValue];
        continue;
      }

      try {
        console.log(`[RunningHub] 上传本地文件到 RunningHub: ${node.fieldValue}`);
        const uploadResponse = await fetch('/api/runninghub/upload-to-runninghub', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ localPath: node.fieldValue, fileType: 'input' })
        });

        const uploadResult = await uploadResponse.json();

        if (uploadResult.success) {
          pathMapping[node.fieldValue] = uploadResult.data.runningHubPath;
          node.fieldValue = uploadResult.data.runningHubPath;
          console.log(`[RunningHub] 节点 ${node.nodeId} 文件上传成功:`, uploadResult.data.runningHubPath);
        } else {
          console.error(`[RunningHub] 节点 ${node.nodeId} 文件上传失败:`, uploadResult.error);
        }
      } catch (uploadError) {
        console.error(`[RunningHub] 节点 ${node.nodeId} 文件上传异常:`, uploadError);
      }
    }
  }, []);

  const pollTaskStatus = useCallback(async (taskId: string): Promise<TaskResult> => {
    const maxPolls = 60;
    const pollInterval = 5000;
    let pollCount = 0;

    const checkStatus = async (): Promise<TaskResult> => {
      try {
        pollCount++;
        console.log(`[RunningHub] 第${pollCount}次轮询任务状态: ${taskId}`);

        const url = `/api/runninghub/task-status/${taskId}`;
        const response = await fetch(url);
        const result = await response.json();

        console.log(`[RunningHub] 轮询结果:`, result);

        if (result.code === 0 && result.data) {
          return { status: 'success', output: result.data };
        }

        if (result.code === 805) {
          const failedReason = result.data?.failedReason;
          const errorMsg = failedReason
            ? `任务失败: ${failedReason.exception_message || result.message}`
            : result.message || '任务执行失败';
          return { status: 'failed', error: errorMsg, output: result.data };
        }

        if (result.code === 804 || result.code === 813) {
          if (pollCount >= maxPolls) {
            return { status: 'failed', error: '任务执行超时' };
          }
          if (pollTimerRef.current) {
            pollTimerRef.current = setTimeout(checkStatus, pollInterval);
          }
          return { status: 'running' };
        }

        return { status: 'failed', error: result.message || '未知错误' };

      } catch (err) {
        console.error('[RunningHub] 轮询请求失败:', err);
        if (pollCount >= maxPolls) {
          return { status: 'failed', error: '轮询请求失败超时' };
        }
        if (pollTimerRef.current) {
          pollTimerRef.current = setTimeout(checkStatus, pollInterval);
        }
        return { status: 'running' };
      }
    };

    return checkStatus();
  }, [functionId]);

  const submitTask = useCallback(async (nodes: RunningHubNodeType[]): Promise<TaskResult> => {
    if (!functionId) {
      const error = '功能ID未配置';
      setError(error);
      setTaskStatus('failed');
      setTaskResult({ status: 'failed', error });
      onTaskError?.(error);
      return { status: 'failed', error };
    }

    setIsSubmitting(true);
    setTaskStatus('running');
    setError(null);
    setTaskResult(null);
    onTaskStart?.();
    onTaskProgress?.('running');

    try {
      // 构建节点信息
      const nodeInfoList2 = buildNodeInfoList(nodes);
      console.log('[RunningHub] 提交任务，节点信息:', nodeInfoList2);

      // 上传本地文件
      await uploadLocalFiles(nodeInfoList2);

      // 提交任务
      const response = await fetch('/api/runninghub/save_nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: functionId,
          nodeInfoList2
        })
      });

      const result = await response.json();
      console.log('[RunningHub] save_nodes 返回结果:', result);

      if (!response.ok) {
        throw new Error(result.error || result.message || `HTTP ${response.status}: 请求失败`);
      }

      if (result.success) {
        console.log('[RunningHub] 任务提交成功!', result);

        const outputData = result.data || result.thirdPartyResponse?.data || result.thirdPartyResponse;

        if (outputData && typeof outputData === 'object' && Object.keys(outputData).length > 0) {
          const successResult = { status: 'success' as const, output: outputData, taskId: result.taskId };
          setTaskStatus('success');
          setTaskResult(successResult);
          setIsSubmitting(false);
          onTaskSuccess?.(successResult);
          onTaskProgress?.('success', result.taskId);
          return successResult;
        }

        if (result.taskId) {
          console.log('[RunningHub] 开始轮询任务状态...', result.taskId);
          setIsSubmitting(true);

          const pollResult = await pollTaskStatus(result.taskId);

          setTaskStatus(pollResult.status);
          setTaskResult(pollResult);
          setIsSubmitting(false);

          if (pollResult.status === 'success') {
            onTaskSuccess?.(pollResult);
            onTaskProgress?.('success', result.taskId);
          } else {
            onTaskError?.(pollResult.error || '任务执行失败');
            onTaskProgress?.('failed');
          }

          return pollResult;
        }

        const emptyResult = { status: 'failed' as const, error: '任务提交成功但没有生成有效结果' };
        setTaskStatus('failed');
        setTaskResult(emptyResult);
        setIsSubmitting(false);
        onTaskError?.('任务提交成功但没有生成有效结果');
        return emptyResult;

      } else {
        // 任务失败
        const errorDetails = [];
        if (result.message) errorDetails.push(`错误信息: ${result.message}`);
        if (result.data?.code) errorDetails.push(`错误代码: ${result.data.code}`);
        if (result.data?.msg) errorDetails.push(`服务器消息: ${result.data.msg}`);

        const fullErrorMessage = errorDetails.length > 0
          ? `${result.message || '任务执行失败'}\n\n${errorDetails.join('\n')}`
          : (result.message || '任务执行失败');

        console.error('[RunningHub] 任务执行失败:', result);

        const failedResult = { status: 'failed' as const, error: fullErrorMessage };
        setTaskStatus('failed');
        setTaskResult(failedResult);
        setError(fullErrorMessage);
        setIsSubmitting(false);
        onTaskError?.(fullErrorMessage);
        onTaskProgress?.('failed');

        return failedResult;
      }

    } catch (err) {
      console.error('[RunningHub] 请求失败:', err);

      let errorMessage = '网络请求失败';
      if (err instanceof Error) {
        errorMessage = err.message;

        if (err.message.includes('API Key')) {
          errorMessage += '\n\n请检查:\n1. RUNNINGHUB_API_KEY 是否正确配置\n2. API Key 是否有访问权限';
        } else if (err.message.includes('NOT_FOUND')) {
          errorMessage += '\n\n请检查:\n1. RUNNINGHUB_WEBAPP_ID 是否正确\n2. 应用是否存在且可访问';
        } else if (err.message.includes('fetch')) {
          errorMessage += '\n\n请检查:\n1. 后端服务是否启动 (http://127.0.0.1:8766)\n2. 网络连接是否正常';
        }
      }

      const errorResult = { status: 'failed' as const, error: errorMessage };
      setTaskStatus('failed');
      setTaskResult(errorResult);
      setError(errorMessage);
      setIsSubmitting(false);
      onTaskError?.(errorMessage);
      onTaskProgress?.('failed');

      return errorResult;
    }
  }, [functionId, buildNodeInfoList, uploadLocalFiles, pollTaskStatus, onTaskStart, onTaskSuccess, onTaskError, onTaskProgress]);

  const resetTask = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setTaskStatus('idle');
    setTaskResult(null);
    setError(null);
    setIsSubmitting(false);
    onTaskProgress?.('idle');
  }, [onTaskProgress]);

  return {
    taskStatus,
    taskResult,
    isSubmitting,
    error,
    submitTask,
    resetTask,
    buildNodeInfoList
  };
}
