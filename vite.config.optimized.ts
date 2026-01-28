import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { readFileSync } from 'fs';

// 从 package.json 读取版本号
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
const APP_VERSION = packageJson.version;

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';
    
    return {
      base: './', // 使用相对路径，适用于 Electron
      server: {
        port: 5206,
        strictPort: false,
        host: '0.0.0.0',
        proxy: {
          // 本地 Node.js 后端代理
          '/api': {
            target: 'http://localhost:8765',
            changeOrigin: true,
            secure: false,
          },
          // 本地文件服务
          '/files': {
            target: 'http://localhost:8765',
            changeOrigin: true,
            secure: false,
          },
          '/input': {
            target: 'http://localhost:8765',
            changeOrigin: true,
            secure: false,
          },
          '/output': {
            target: 'http://localhost:8765',
            changeOrigin: true,
            secure: false,
          },
          '/upload': {
            target: 'http://localhost:8765',
            changeOrigin: true,
            secure: false,
          },
        },
      },
      build: {
        // 生产环境优化
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: !isProduction,
        minify: isProduction ? 'esbuild' : false,
        target: 'es2020',
        rollupOptions: {
          output: {
            manualChunks: {
              // 分离第三方库
              'vendor-react': ['react', 'react-dom'],
              'vendor-ui': ['lucide-react', '@xyflow/react'],
              'vendor-utils': ['jszip', 'i18next'],
              'vendor-three': ['three', '@types/three']
            },
            chunkFileNames: (chunkInfo) => {
              const facadeModuleId = chunkInfo.facadeModuleId
                ? chunkInfo.facadeModuleId.split('/').pop().replace(/\.[jt]sx?$/, '')
                : 'chunk';
              return `js/${facadeModuleId}-[hash].js`;
            }
          },
        },
        // 减小包体积
        chunkSizeWarningLimit: 1000,
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        'process.env.NODE_ENV': JSON.stringify(mode),
        '__APP_VERSION__': JSON.stringify(APP_VERSION),
        '__BUILD_TIME__': JSON.stringify(new Date().toISOString())
      },
      resolve: {
        alias: {
          '@': path.resolve('.'),
          '@components': path.resolve('./src/components'),
          '@utils': path.resolve('./src/utils'),
          '@hooks': path.resolve('./src/hooks'),
          '@types': path.resolve('./src/types'),
        }
      },
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          '@xyflow/react',
          'lucide-react',
          'i18next',
          'jszip'
        ],
        exclude: ['electron']
      },
      esbuild: {
        // 提升构建性能
        logOverride: { 'this-is-undefined-in-esm': 'silent' }
      }
    };
});
