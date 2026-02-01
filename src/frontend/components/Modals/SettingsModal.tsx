import React from 'react';
import { useTheme, ThemeName } from '../../contexts/ThemeContext';
import { Check, X, Moon as MoonIcon, Sun as SunIcon, Save as SaveIcon } from 'lucide-react';

declare const __APP_VERSION__: string;
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

const themeIconMap: Record<ThemeName, React.FC<{ className?: string }>> = {
  dark: MoonIcon,
  light: SunIcon,
};

const themePreviewColors: Record<ThemeName, string[]> = {
  dark: ['#3b82f6', '#1a1a24', '#60a5fa'],
  light: ['#2563eb', '#ffffff', '#3b82f6'],
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  autoSaveEnabled: boolean;
  onAutoSaveToggle: (enabled: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  autoSaveEnabled,
  onAutoSaveToggle,
}) => {
  const { theme, themeName, setTheme, allThemes } = useTheme();
  const colors = theme.colors;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div 
        className="settings-modal relative w-full max-w-[400px] rounded-[20px] overflow-hidden animate-fade-in flex flex-col"
        style={{
          background: colors.bgPanel,
          border: `1px solid ${colors.border}`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          maxHeight: '80vh'
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-lg flex items-center justify-center transition-all z-10"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <X className="w-4 h-4" style={{ color: colors.textSecondary }} />
        </button>

        <div className="px-6 pt-6 pb-5 text-center border-b" style={{ borderColor: colors.borderLight }}>
          <div 
            className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})` }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>设置</h2>
          <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>主题与偏好设置</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 custom-scrollbar">
          <div>
            <div className="section-title">THEME</div>
            <div className="grid grid-cols-2 gap-3">
              {allThemes.map((t) => {
                const ThemeIcon = themeIconMap[t.name];
                const previewColors = themePreviewColors[t.name];
                const isActive = themeName === t.name;
                
                return (
                  <button
                    key={t.name}
                    onClick={() => setTheme(t.name)}
                    className="option-card text-left"
                    style={{
                      borderColor: isActive ? 'rgba(59, 130, 246, 0.5)' : colors.border,
                      background: isActive ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ 
                          background: isActive 
                            ? `linear-gradient(135deg, ${previewColors[0]}, ${previewColors[2]})`
                            : 'rgba(255,255,255,0.06)',
                        }}
                      >
                        <ThemeIcon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} style={{ color: isActive ? 'white' : colors.textSecondary }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{t.displayName}</p>
                        <div className="flex gap-1 mt-1.5">
                          {previewColors.map((color, i) => (
                            <div key={i} className="h-1.5 rounded-full flex-1" style={{ background: color, opacity: isActive ? 1 : 0.5 }} />
                          ))}
                        </div>
                      </div>
                    </div>
                    {isActive && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})` }}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="section-title">FEATURES</div>
            
            <div className="config-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="option-icon" style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
                  <SaveIcon className="w-5 h-5" style={{ color: colors.primary }} />
                </div>
                <div>
                  <h4 className="text-sm font-medium" style={{ color: colors.textPrimary }}>自动保存</h4>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>生成图片后自动下载</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={autoSaveEnabled} onChange={(e) => onAutoSaveToggle(e.target.checked)} />
                <div 
                  className="w-11 h-6 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                  style={{ background: autoSaveEnabled ? `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})` : 'rgba(255,255,255,0.1)' }}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 px-6 py-4 border-t" style={{ borderColor: colors.borderLight, background: colors.bgPrimary }}>
          <button
            onClick={onClose}
            className="btn btn-primary w-full py-3.5"
          >
            完成
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        
        .section-title {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 12px;
        }
        
        .option-card {
          padding: 14px;
          border-radius: 12px;
          border: 2px solid rgba(255, 255, 255, 0.06);
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 10px;
          position: relative;
        }
        .option-card:hover { border-color: rgba(255, 255, 255, 0.12); }
        
        .option-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .config-card {
          padding: 14px;
          border-radius: 12px;
           background: rgba(255, 255, 255, 0.02);
           border: 1px solid rgba(255, 255, 255, 0.06);
           margin-bottom: 10px;
         }
         
         .btn {
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .btn-primary {
          color: white;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }
      `}</style>
    </div>
  );
};
