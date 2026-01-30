import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { readFileSync } from 'fs';

// 从 package.json 读取版本号
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
const APP_VERSION = packageJson.version;

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: './', // 使用相对路径，适用于 Electron
      server: {
        port: 5206,
        strictPort: false,
        proxy: {
          // 本地 Node.js 后端代理
          '/api': {
            target: 'http://localhost:8766',
            changeOrigin: true,
          },
          // 本地文件服务
          '/files': {
            target: 'http://localhost:8766',
            changeOrigin: true,
          },
          '/input': {
            target: 'http://localhost:8766',
            changeOrigin: true,
          },
          '/output': {
            target: 'http://localhost:8766',
            changeOrigin: true,
          },
        },
      },
      build: {
        // Electron 渲染进程构建配置
        outDir: 'dist',
        assetsDir: 'assets',
        cssCodeSplit: true,
        rollupOptions: {
          output: {
            manualChunks: {
              // React ecosystem
              'react-vendor': ['react', 'react-dom'],
              
              // React Flow (canvas library)
              'canvas-vendor': ['@xyflow/react'],
              
              // 3D and graphics
              'three-vendor': ['three'],
              
              // AI services - split heavy AI functionality
              'ai-services': [
                './src/frontend/services/ai/soraService.ts',
                './src/frontend/services/ai/veoService.ts'
              ],
              
              // Internationalization
              'i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
              
              // UI libraries
              'ui-vendor': ['lucide-react'],
              
              // Utility libraries
              'utils': ['jszip', 'sharp'],
              
              // Express backend (for electron)
              'backend': ['express', 'cors', 'multer']
            },
            assetFileNames: 'assets/[name].[hash][extname]',
            chunkFileNames: 'assets/[name].[hash].js',
            entryFileNames: 'assets/[name].[hash].js'
          },
        },
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        '__APP_VERSION__': JSON.stringify(APP_VERSION)
      },
      resolve: {
        alias: {
          '@/': path.resolve('./src/frontend'),
          '@/shared': path.resolve('./src/shared'),
          '@/src': path.resolve('./src'),
          '@': path.resolve('./src/frontend'),
        }
      }
    };
});
