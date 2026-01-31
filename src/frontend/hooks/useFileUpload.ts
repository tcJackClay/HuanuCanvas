import { useState, useCallback } from 'react';

export interface UploadState {
  status: 'idle' | 'uploading' | 'success' | 'failed' | 'local_success';
  progress: number;
  error: string | null;
  localPreviewUrl: string | null;
  serverFilePath: string | null;
  localUrl: string | null;
}

export interface UseFileUploadOptions {
  maxFileSize?: number; // 默认 30MB
  acceptedTypes?: string[];
  onUploadStart?: (file: File) => void;
  onUploadSuccess?: (result: UploadResult) => void;
  onUploadError?: (error: string) => void;
}

export interface UploadResult {
  success: boolean;
  localUrl: string;
  serverFilePath: string | null;
  thirdPartyResponse?: any;
  error?: string;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const {
    maxFileSize = 30 * 1024 * 1024, // 30MB
    acceptedTypes = ['image/*'],
    onUploadStart,
    onUploadSuccess,
    onUploadError
  } = options;

  const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const getUploadState = useCallback((nodeId: string) => uploadStates[nodeId] || {
    status: 'idle' as const,
    progress: 0,
    error: null,
    localPreviewUrl: null,
    serverFilePath: null,
    localUrl: null
  }, [uploadStates]);

  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.replace('/*', ''));
      }
      return file.type === type;
    })) {
      return `请选择正确的文件类型 (${acceptedTypes.join(', ')})`;
    }

    if (file.size > maxFileSize) {
      return `文件大小不能超过 ${Math.round(maxFileSize / 1024 / 1024)}MB`;
    }

    return null;
  }, [acceptedTypes, maxFileSize]);

  const uploadFile = useCallback(async (
    nodeId: string,
    file: File,
    fileType: string = 'input'
  ): Promise<UploadResult> => {
    // 验证文件
    const validationError = validateFile(file);
    if (validationError) {
      const error = validationError;
      setUploadStates(prev => ({
        ...prev,
        [nodeId]: { ...prev[nodeId], status: 'failed', error }
      }));
      setGlobalError(error);
      onUploadError?.(error);
      return { success: false, localUrl: '', serverFilePath: null, error };
    }

    // 通知上传开始
    onUploadStart?.(file);

    // 创建本地预览 URL
    const localPreviewUrl = URL.createObjectURL(file);

    // 更新状态为上传中
    setUploadStates(prev => ({
      ...prev,
      [nodeId]: {
        status: 'uploading',
        progress: 0,
        error: null,
        localPreviewUrl,
        serverFilePath: null,
        localUrl: null
      }
    }));

    try {
      console.log('[RunningHub] 开始上传文件:', { fileName: file.name, size: file.size, type: file.type });

      // 1. 上传到本地服务器
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileType);

      const localResponse = await fetch('/api/runninghub/upload-file', {
        method: 'POST',
        body: formData
      });

      const localData = await localResponse.json();
      console.log('[RunningHub] 本地上传响应:', localData);

      if (!localData.success) {
        const errorMsg = localData.error || localData.details || '文件上传失败';
        throw new Error(errorMsg);
      }

      const localUrl = localData.data?.localUrl || localData.localUrl;
      console.log('[RunningHub] 本地文件保存成功:', localUrl);

      // 2. 上传到 RunningHub
      let serverFilePath = null;
      try {
        console.log('[RunningHub] 开始上传到 RunningHub:', localUrl);
        const rhResponse = await fetch('/api/runninghub/upload-to-runninghub', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ localPath: localUrl, fileType })
        });

        const rhResult = await rhResponse.json();
        console.log('[RunningHub] RunningHub 上传响应:', rhResult);

        if (rhResult.success) {
          serverFilePath = rhResult.data?.filePath;
          console.log('[RunningHub] RunningHub 上传成功，路径:', serverFilePath);
        } else {
          console.warn('[RunningHub] RunningHub 上传失败:', rhResult.error);
        }
      } catch (rhError) {
        console.warn('[RunningHub] RunningHub 上传异常（使用本地路径）:', rhError);
      }

      // 更新状态为成功
      const finalFieldValue = serverFilePath 
        ? serverFilePath.replace(/^api\//, '') 
        : localUrl || file.name;

      setUploadStates(prev => ({
        ...prev,
        [nodeId]: {
          status: serverFilePath ? 'success' : 'local_success',
          progress: 100,
          error: null,
          localPreviewUrl,
          serverFilePath,
          localUrl
        }
      }));

      const result: UploadResult = {
        success: true,
        localUrl,
        serverFilePath,
        thirdPartyResponse: localData.thirdPartyResponse
      };

      onUploadSuccess?.(result);
      setGlobalError(null);

      return result;

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '网络错误';
      console.error('[RunningHub] 文件上传失败:', err);

      setUploadStates(prev => ({
        ...prev,
        [nodeId]: {
          status: 'failed',
          progress: 0,
          error: errorMsg,
          localPreviewUrl,
          serverFilePath: null,
          localUrl: null
        }
      }));

      setGlobalError(errorMsg);
      onUploadError?.(errorMsg);

      return { success: false, localUrl: '', serverFilePath: null, error: errorMsg };
    }
  }, [validateFile, onUploadStart, onUploadSuccess, onUploadError]);

  const resetUploadState = useCallback((nodeId: string) => {
    setUploadStates(prev => {
      const current = prev[nodeId];
      if (current?.localPreviewUrl) {
        URL.revokeObjectURL(current.localPreviewUrl);
      }
      const { [nodeId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const clearAllUploadStates = useCallback(() => {
    Object.values(uploadStates).forEach(state => {
      if (state.localPreviewUrl) {
        URL.revokeObjectURL(state.localPreviewUrl);
      }
    });
    setUploadStates({});
    setGlobalError(null);
  }, [uploadStates]);

  return {
    uploadStates,
    globalError,
    getUploadState,
    uploadFile,
    resetUploadState,
    clearAllUploadStates
  };
}
