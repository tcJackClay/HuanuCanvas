# RUNNINGHUB 节点结果展示窗口组件

## 概述

RunningHubResultModal 是一个功能丰富的模态窗口组件，用于展示 RUNNINGHUB 节点执行后的生成结果。它支持多种文件类型的预览和管理，提供出色的用户体验。

## 功能特性

### 🎯 核心功能
- **多文件类型支持**: 图片、视频、音频、文档
- **智能预览**: 根据文件类型自动选择合适的预览方式
- **批量操作**: 支持批量下载和批量管理
- **响应式设计**: 适配不同屏幕尺寸

### 🎨 界面特性
- **拖拽移动**: 可自由拖拽窗口位置
- **全屏模式**: 支持全屏预览和操作
- **动画效果**: 流畅的进入/退出动画
- **主题适配**: 支持深色/浅色主题

### ⌨️ 交互特性
- **键盘快捷键**: ESC关闭、F全屏、方向键导航等
- **点击外部关闭**: 点击背景区域关闭模态窗口
- **图片轮播**: 多张图片时支持轮播查看
- **状态指示**: 清晰的任务状态显示

## 组件结构

```
RunningHubResultModal/
├── components/
│   ├── RunningHubResultModal.tsx     # 主组件
│   └── hooks/
│       └── useRunningHubResultModal.ts # 状态管理Hook
├── types/
│   └── runningHubResultTypes.ts     # 类型定义
├── styles/
│   └── RunningHubResultModal.css    # 样式文件
└── Canvas/nodes/
    └── RunningHubNode.tsx           # 集成示例
```

## 接口定义

### 主要接口

```typescript
interface RunningHubResultModalProps {
  isOpen: boolean;                    // 是否打开
  onClose: () => void;               // 关闭回调
  taskResult: TaskResult | null;     // 任务结果
  nodePosition?: Position;           // 节点位置
  title?: string;                    // 窗口标题
}

interface TaskResult {
  status: 'idle' | 'running' | 'success' | 'failed';
  output?: {
    images?: string[];               // 图片URL列表
    videos?: string[];               // 视频URL列表
    audios?: string[];               // 音频URL列表
    files?: string[];                // 文件URL列表
    message?: string;                // 消息内容
  };
  error?: string;                    // 错误信息
}
```

### 配置选项

```typescript
interface ModalConfig {
  width?: number;                    // 窗口宽度
  height?: number;                   // 窗口高度
  resizable?: boolean;              // 是否可调整大小
  draggable?: boolean;              // 是否可拖拽
  fullscreen?: boolean;             // 是否支持全屏
}

interface KeyboardShortcuts {
  close?: string;                   // 关闭快捷键 (默认: 'Escape')
  fullscreen?: string;              // 全屏快捷键 (默认: 'f')
  next?: string;                    // 下一个快捷键 (默认: 'ArrowRight')
  prev?: string;                    // 上一个快捷键 (默认: 'ArrowLeft')
  download?: string;                // 下载快捷键 (默认: 'd')
  play?: string;                    // 播放快捷键 (默认: 'Space')
}
```

## 使用方法

### 基本用法

```typescript
import RunningHubResultModal from './components/RunningHubResultModal';

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [taskResult, setTaskResult] = useState<TaskResult | null>(null);

  const handleTaskComplete = (result: TaskResult) => {
    setTaskResult(result);
    setIsOpen(true);
  };

  return (
    <RunningHubResultModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      taskResult={taskResult}
      nodePosition={{ x: 100, y: 100 }}
      title="任务执行结果"
    />
  );
}
```

### 高级用法 - 使用自定义Hook

```typescript
import { useRunningHubResultModal } from './hooks/useRunningHubResultModal';

function RunningHubNode() {
  const {
    isOpen,
    taskResult,
    openModal,
    closeModal,
    downloadFile,
    downloadAllFiles
  } = useRunningHubResultModal({
    config: {
      width: 900,
      height: 700,
      draggable: true,
      fullscreen: true
    },
    shortcuts: {
      close: 'Escape',
      fullscreen: 'f',
      next: 'ArrowRight',
      prev: 'ArrowLeft',
      download: 'd',
      play: ' '
    }
  });

  const handleTaskComplete = (result: TaskResult) => {
    openModal(result, { x: 200, y: 150 });
  };

  return (
    <div>
      <button onClick={() => handleTaskComplete(mockResult)}>
        执行任务
      </button>
      
      <RunningHubResultModal
        isOpen={isOpen}
        onClose={closeModal}
        taskResult={taskResult}
      />
    </div>
  );
}
```

## 文件类型处理

### 图片文件
- 直接显示预览
- 支持多图片轮播
- 支持缩放查看
- 支持下载原始文件

### 视频文件
- 内置播放器
- 支持播放控制
- 显示视频信息
- 支持下载

### 音频文件
- 音频播放器
- 播放控制
- 音频可视化
- 支持下载

### 其他文件
- 显示文件信息
- 提供下载链接
- 支持批量下载

## 布局结构

```
┌─────────────────────────────────────────┐
│ 标题栏 [关闭] [全屏] [下载]              │
├─────────────────────────────────────────┤
│ 文件列表            │     预览区域      │
│ - 图片1              │                   │
│ - 图片2              │   [图片/视频]     │
│ - 视频1              │   [音频播放器]    │
│ - 文件1              │   [文件信息]      │
│                      │                   │
│                      │   [控制按钮]      │
├─────────────────────────────────────────┤
│ 状态栏 - 文件统计 - 操作按钮             │
└─────────────────────────────────────────┘
```

## 样式定制

### CSS变量

```css
.running-hub-result-modal {
  --modal-bg-primary: rgba(17, 24, 39, 0.95);
  --modal-bg-secondary: rgba(31, 41, 55, 0.95);
  --modal-border: rgba(255, 255, 255, 0.1);
  --modal-text-primary: #f9fafb;
  --modal-text-secondary: #d1d5db;
  --modal-accent: #f59e0b;
  --modal-success: #22c55e;
  --modal-error: #ef4444;
  --modal-warning: #f59e0b;
}
```

### 主题切换

```typescript
// 支持自动主题切换
<RunningHubResultModal
  theme={isDarkMode ? 'dark' : 'light'}
  // ...其他props
/>
```

## 动画效果

### 进入动画
```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
```

### 退出动画
```css
@keyframes fadeOut {
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  to {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
}
```

## 键盘快捷键

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `Escape` | 关闭窗口 | 关闭模态窗口 |
| `F` | 全屏切换 | 切换全屏模式 |
| `←` | 上一个 | 切换到上一张图片 |
| `→` | 下一个 | 切换到下一张图片 |
| `Space` | 播放/暂停 | 播放或暂停音视频 |
| `Ctrl+D` | 下载 | 下载当前文件 |

## 响应式设计

### 桌面端 (≥768px)
- 宽度: 800px (可配置)
- 高度: 600px (可配置)
- 完整功能展示

### 平板端 (768px - 1024px)
- 宽度: 90vw
- 高度: 85vh
- 适当调整布局

### 移动端 (≤768px)
- 宽度: 100vw
- 高度: 100vh
- 简化界面
- 触摸优化

## 无障碍支持

### ARIA属性
```typescript
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">RunningHub 执行结果</h2>
  <p id="modal-description">查看任务执行结果和下载文件</p>
</div>
```

### 键盘导航
- Tab键在控件间切换
- 方向键在列表中导航
- Enter键确认操作
- Escape键关闭窗口

## 性能优化

### 懒加载
```typescript
// 图片懒加载
const LazyImage = ({ src, alt }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    });
    
    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);
  
  return (
    <img
      ref={imgRef}
      src={isVisible ? src : undefined}
      alt={alt}
      onLoad={() => setIsLoaded(true)}
    />
  );
};
```

### 虚拟滚动
```typescript
// 大量文件时的虚拟滚动
const VirtualList = ({ items, itemHeight, containerHeight }) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  const visibleItems = items.slice(startIndex, endIndex);
  
  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.target.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => (
          <div
            key={startIndex + index}
            style={{
              position: 'absolute',
              top: (startIndex + index) * itemHeight,
              height: itemHeight,
              width: '100%'
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};
```

## 错误处理

### 网络错误
```typescript
const downloadFile = async (url: string, filename: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    window.URL.revokeObjectURL(downloadUrl);
    return true;
  } catch (error) {
    console.error('Download failed:', error);
    // 显示错误提示
    showErrorToast('下载失败，请重试');
    return false;
  }
};
```

### 文件类型错误
```typescript
const getFileType = (url: string): 'image' | 'video' | 'audio' | 'file' => {
  const extension = url.split('.').pop()?.toLowerCase();
  
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const videoTypes = ['mp4', 'webm', 'ogg', 'mov'];
  const audioTypes = ['mp3', 'wav', 'ogg', 'aac', 'flac'];
  
  if (imageTypes.includes(extension)) return 'image';
  if (videoTypes.includes(extension)) return 'video';
  if (audioTypes.includes(extension)) return 'audio';
  
  return 'file';
};
```

## 测试

### 单元测试
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import RunningHubResultModal from './RunningHubResultModal';

describe('RunningHubResultModal', () => {
  test('renders correctly when open', () => {
    const mockResult = {
      status: 'success' as const,
      output: {
        images: ['image1.jpg', 'image2.jpg'],
        videos: ['video1.mp4']
      }
    };

    render(
      <RunningHubResultModal
        isOpen={true}
        onClose={() => {}}
        taskResult={mockResult}
      />
    );

    expect(screen.getByText('RunningHub 执行结果')).toBeInTheDocument();
    expect(screen.getByText('image1.jpg')).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    const mockOnClose = jest.fn();
    
    render(
      <RunningHubResultModal
        isOpen={true}
        onClose={mockOnClose}
        taskResult={null}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
```

### 集成测试
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RunningHubNode } from './RunningHubNode';

describe('RunningHubNode Integration', () => {
  test('opens result modal when task completes', async () => {
    const user = userEvent.setup();
    
    render(<RunningHubNode />);
    
    const runButton = screen.getByRole('button', { name: /运行应用/i });
    await user.click(runButton);
    
    // 模拟任务完成
    await waitFor(() => {
      expect(screen.getByText('查看结果')).toBeInTheDocument();
    });
    
    const viewResultButton = screen.getByRole('button', { name: /查看结果/i });
    await user.click(viewResultButton);
    
    expect(screen.getByText('RunningHub 执行结果')).toBeInTheDocument();
  });
});
```

## 最佳实践

### 1. 性能优化
- 使用 React.memo 避免不必要的重渲染
- 实现虚拟滚动处理大量文件
- 使用懒加载延迟加载图片
- 防抖处理用户交互

### 2. 用户体验
- 提供加载状态反馈
- 支持撤销操作
- 友好的错误提示
- 响应式设计

### 3. 可维护性
- 统一的样式管理
- 清晰的类型定义
- 模块化的代码结构
- 完善的文档和测试

### 4. 可访问性
- 语义化HTML结构
- 键盘导航支持
- 屏幕阅读器兼容
- 适当的颜色对比度

## 故障排除

### 常见问题

**Q: 模态窗口无法显示**
A: 检查 `isOpen` 状态是否正确设置，确保 `taskResult` 数据格式正确

**Q: 图片无法加载**
A: 检查图片URL是否有效，确认CORS设置是否允许跨域访问

**Q: 下载功能失效**
A: 确认文件URL可访问，检查浏览器下载权限设置

**Q: 拖拽功能不工作**
A: 检查是否在全屏模式下，确认 `draggable` 配置是否启用

### 调试技巧

1. 使用React DevTools检查组件状态
2. 检查浏览器控制台错误信息
3. 验证API响应数据格式
4. 测试不同文件类型的处理逻辑

## 版本更新

### v1.0.0
- 基础功能实现
- 支持图片、视频、音频预览
- 拖拽和全屏功能

### v1.1.0 (计划中)
- 批量操作优化
- 文件夹上传支持
- 更多文件格式支持

### v1.2.0 (计划中)
- 云存储集成
- 分享功能
- 协作编辑支持

---

这个组件设计提供了完整的解决方案，可以根据具体需求进行定制和扩展。如有问题或建议，欢迎反馈！