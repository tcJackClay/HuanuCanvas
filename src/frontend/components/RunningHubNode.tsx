import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { CanvasNodeData } from '../index';
import { getNodeTypeColor } from '@/shared/types/pebblingTypes';
import RunningHubResultModal from '../../RunningHubResultModal';
import RunningHubNodeContent from '../RunningHubNodeContent';

interface RunningHubCanvasNodeData extends CanvasNodeData {
  id?: string;
  inputFields?: any[];
  onOpenConfig?: () => void;
  onTaskComplete?: (output: any) => void;
  onExecute?: () => void;
  onStop?: () => void;
  isRunning?: boolean;
  isSelected?: boolean;
}

interface TaskResult {
  status: 'idle' | 'running' | 'success' | 'failed';
  output?: any;
  error?: string;
}

const RunningHubNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const nodeData = data as RunningHubCanvasNodeData;
  const [showResultModal, setShowResultModal] = React.useState(false);
  const [taskResult, setTaskResult] = React.useState<TaskResult | null>(null);

  const handleTaskComplete = (output: any) => {
    console.log('[RunningHubNode] 收到任务完成通知:', output);

    let files: any[] = [];
    if (Array.isArray(output)) {
      files = output;
    } else if (output.files) {
      files = output.files;
    } else if (output.images || output.videos) {
      if (output.images) {
        output.images.forEach((url: string, i: number) => {
          files.push({ fileUrl: url, fileType: 'png', fileName: `图片_${i + 1}` });
        });
      }
      if (output.videos) {
        output.videos.forEach((url: string, i: number) => {
          files.push({ fileUrl: url, fileType: 'mp4', fileName: `视频_${i + 1}` });
        });
      }
    }

    setTaskResult({ status: 'success', output });
    setShowResultModal(true);

    if (nodeData.onTaskComplete) {
      nodeData.onTaskComplete(output);
    }
  };

  const handleExecute = () => {
    nodeData.onExecute?.();
  };

  const handleStop = () => {
    nodeData.onStop?.();
  };

  const nodeColors = getNodeTypeColor('runninghub' as any);

  return (
    <>
      <div
        className={`rounded-xl overflow-hidden transition-all ${
          selected ? 'ring-2 ring-offset-2 ring-offset-[#1a1a2e]' : ''
        }`}
        style={{
          '--node-border': nodeColors.primary,
          '--node-bg': `linear-gradient(135deg, ${nodeColors.primary}33, ${nodeColors.primary}22)`,
          '--node-shadow': '0 4px 20px -4px rgba(0,0,0,0.5)'
        } as React.CSSProperties}
      >
        {nodeData.inputPortConfig && (
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 group/port cursor-crosshair z-10"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              nodeData.onPortClick?.(id || 'root', 'in', { x: rect.left, y: rect.top });
            }}
          >
            <div
              className="w-4 h-8 rounded-l-lg border-y-2 border-l-2 transition-all group-hover/port:scale-110"
              style={{
                borderColor: nodeColors.primary,
                backgroundColor: 'var(--color-bg-secondary)'
              }}
            />
          </div>
        )}

        <div
          className="px-3 py-2 border-b flex items-center justify-between"
          style={{
            background: `linear-gradient(135deg, ${nodeColors.primary}66, ${nodeColors.primary}44)`,
            borderColor: `${nodeColors.primary}99`
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: nodeColors.primary }}
            >
              <RefreshCw className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium text-sm text-white">RunningHub</span>
          </div>
        </div>

        <RunningHubNodeContent
          data={{
            id: nodeData.id,
            inputFields: nodeData.inputFields,
            onPortClick: (nodeId, portType, pos) => nodeData.onPortClick?.(id || nodeId, portType, pos),
            onExecute: handleExecute,
            onStop: handleStop,
            onTaskComplete: handleTaskComplete,
            isRunning: nodeData.isRunning,
            isSelected: selected
          }}
        />

        {nodeData.outputPortConfig && (
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 group/port cursor-crosshair z-10"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              nodeData.onPortClick?.(id || 'root', 'out', { x: rect.left, y: rect.top });
            }}
          >
            <div
              className="w-4 h-8 rounded-r-lg border-y-2 border-r-2 transition-all group-hover/port:scale-110"
              style={{
                borderColor: nodeColors.primary,
                backgroundColor: 'var(--color-bg-secondary)'
              }}
            />
          </div>
        )}
      </div>

      <RunningHubResultModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        taskResult={taskResult}
        nodePosition={{ x: 0, y: 0 }}
        title="RunningHub 执行结果"
      />
    </>
  );
};

function RefreshCw({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

export default memo(RunningHubNode);
