import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const buildTime = new Date().toISOString();
    // Solo habilitar sourcemaps en desarrollo, nunca en producción
    const enableSourcemap = mode === 'development';
    
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        '__BUILD_TIME__': JSON.stringify(buildTime),
        '__APP_VERSION__': JSON.stringify('1.0.0')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      plugins: [react()],
      build: {
        outDir: 'dist',
        sourcemap: false, // ❌ Deshabilitado en producción para evitar errores 404
        minify: 'terser',
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              dnd: ['@hello-pangea/dnd']
            }
          }
        }
      },
      server: {
        proxy: {
          '/api': {
            target: env.VITE_WS_URL || 'http://localhost:3001',
            changeOrigin: true
          },
          '/socket.io': {
            target: env.VITE_WS_URL || 'http://localhost:3001',
            changeOrigin: true,
            ws: true
          }
        }
      }
    };
});
