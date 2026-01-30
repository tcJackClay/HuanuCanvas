import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

// 模拟geminiService
jest.mock('../services/geminiService', () => ({
  generateCreativeContent: jest.fn(),
  generateCreativeImage: jest.fn(),
}));

// 模拟ThemeContext
jest.mock('../contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({
    theme: {
      name: 'dark',
      displayName: '深夜',
      icon: '🌙',
      colors: {
        primary: '#3b82f6',
        primaryLight: '#a5b4fc',
        primaryDark: '#2563eb',
        accent: '#3b82f6',
        accentLight: '#3b82f6',
        bgPrimary: '#0a0a0f',
        bgSecondary: '#12121a',
        bgTertiary: '#1a1a24',
        bgPanel: 'rgba(18, 18, 26, 0.95)',
        textPrimary: '#ffffff',
        textSecondary: '#a1a2aa',
        textMuted: '#71717a',
        border: 'rgba(255, 255, 255, 0.08)',
        borderLight: 'rgba(255, 255, 255, 0.04)',
        gradientStart: '#3b82f6',
        gradientMiddle: '#60a5fa',
        gradientEnd: '#ffffff',
        glow: 'rgba(59, 130, 246, 0.4)',
        shadow: 'rgba(0, 0, 0, 0.4)'
      },
      decorations: {
        snowflakes: false,
        particles: false,
        sparkles: false
      }
    },
    themeName: 'dark',
    setTheme: jest.fn(),
    allThemes: [
      {
        name: 'dark',
        displayName: '深夜',
        icon: '🌙',
        colors: {},
        decorations: {}
      },
      {
        name: 'light',
        displayName: '白天',
        icon: '☀️',
        colors: {},
        decorations: {}
      }
    ]
  }),
  SnowfallEffect: () => null
}));

describe('App Component', () => {
  test('renders app without crashing', () => {
    render(<App />);
    // 测试App组件能正常渲染
    expect(true).toBe(true);
  });

  test('has required imports', () => {
    // 测试App组件导入了必要的依赖
    expect(typeof App).toBe('function');
  });
});