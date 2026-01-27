import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { normalizeImageUrl } from '../../utils/image';

interface MediaPreviewModalProps {
  type: 'image' | 'audio' | 'video';
  url: string;
  onClose: () => void;
  title?: string;
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({ type, url, onClose, title }) => {
  const [transform, setTransform] = useState({ scale: 1, posX: 0, posY: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  const handleZoomIn = () => setTransform(t => ({ ...t, scale: Math.min(t.scale + 0.2, 5) }));
  const handleZoomOut = () => setTransform(t => ({ ...t, scale: Math.max(t.scale - 0.2, 0.5) }));
  const handleReset = () => setTransform({ scale: 1, posX: 0, posY: 0 });

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setTransform(t => ({ ...t, scale: Math.max(0.5, Math.min(t.scale + delta, 5)) }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || transform.scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.posX, y: e.clientY - transform.posY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || transform.scale <= 1) return;
    e.preventDefault();
    setTransform(prev => ({
      ...prev,
      posX: e.clientX - dragStart.x,
      posY: e.clientY - dragStart.y,
    }));
  };

  const handleMouseUp = () => setIsDragging(false);

  const togglePlay = () => {
    if (type === 'video') {
      if (videoRef.current) {
        if (isPlaying) videoRef.current.pause();
        else videoRef.current.play();
        setIsPlaying(!isPlaying);
      }
    } else if (type === 'audio') {
      if (audioRef.current) {
        if (isPlaying) audioRef.current.pause();
        else audioRef.current.play();
        setIsPlaying(!isPlaying);
      }
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const normalizedUrl = normalizeImageUrl(url);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const ext = type === 'image' ? 'png' : type === 'audio' ? 'mp3' : 'mp4';
    const filename = `media-${timestamp}.${ext}`;

    if (normalizedUrl.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = normalizedUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    try {
      const response = await fetch(normalizedUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      if (blob && blob.size > 0) {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      } else {
        window.open(normalizedUrl, '_blank');
      }
    } catch {
      window.open(normalizedUrl, '_blank');
    }
  };

  const renderContent = () => {
    const normalizedUrl = normalizeImageUrl(url);

    switch (type) {
      case 'image':
        return (
          <img
            src={normalizedUrl}
            alt={title || 'Preview'}
            className="block rounded-lg shadow-2xl"
            style={{
              maxWidth: '90vw',
              maxHeight: '70vh',
              objectFit: 'contain',
              transform: `translate(${transform.posX}px, ${transform.posY}px) scale(${transform.scale})`,
              cursor: transform.scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
            draggable={false}
            onMouseDown={handleMouseDown}
          />
        );

      case 'audio':
        return (
          <div className="flex flex-col items-center gap-6 p-8 bg-gray-900/50 rounded-xl">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              {isPlaying ? (
                <Pause className="w-12 h-12 text-white" />
              ) : (
                <Play className="w-12 h-12 text-white ml-1" />
              )}
            </div>
            <audio ref={audioRef} src={normalizedUrl} onEnded={() => setIsPlaying(false)} />
            <button
              onClick={togglePlay}
              className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white font-medium transition-colors"
            >
              {isPlaying ? '暂停' : '播放'}
            </button>
          </div>
        );

      case 'video':
        return (
          <div className="relative">
            <video
              ref={videoRef}
              src={normalizedUrl}
              className="max-w-[80vw] max-h-[70vh] rounded-lg"
              onEnded={() => setIsPlaying(false)}
            />
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors rounded-lg"
            >
              {isPlaying ? (
                <Pause className="w-16 h-16 text-white" />
              ) : (
                <Play className="w-16 h-16 text-white ml-2" />
              )}
            </button>
          </div>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      style={{ animation: 'fadeIn 0.2s ease-out' }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {type === 'image' && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-gray-900/70 backdrop-blur-sm rounded-full p-2 flex items-center gap-2 shadow-lg z-10">
          <button onClick={handleZoomOut} className="p-2 text-white rounded-full hover:bg-gray-700 transition-colors">
            <ZoomOut className="w-5 h-5" />
          </button>
          <button onClick={handleReset} className="p-2 text-white rounded-full hover:bg-gray-700 transition-colors">
            <RotateCcw className="w-5 h-5" />
          </button>
          <button onClick={handleZoomIn} className="p-2 text-white rounded-full hover:bg-gray-700 transition-colors">
            <ZoomIn className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-gray-600 mx-1" />
          <button onClick={handleDownload} className="p-2 text-white rounded-full hover:bg-gray-700 transition-colors">
            <Download className="w-5 h-5" />
          </button>
        </div>
      )}

      {type !== 'image' && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-gray-900/70 backdrop-blur-sm rounded-full p-2 flex items-center gap-2 shadow-lg z-10">
          <button onClick={handleDownload} className="p-2 text-white rounded-full hover:bg-gray-700 transition-colors">
            <Download className="w-5 h-5" />
          </button>
        </div>
      )}

      <div
        className="relative flex items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
      >
        {renderContent()}
      </div>

      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white bg-gray-800/70 rounded-full p-2 hover:bg-gray-700 transition-colors z-10"
      >
        <X className="w-6 h-6" />
      </button>
    </div>
  );
};
