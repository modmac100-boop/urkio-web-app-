import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || 'AIzaSyDLxQt-tYjj6sdNo58agfprFmefamg6mGo'),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || 'AIzaSyDLxQt-tYjj6sdNo58agfprFmefamg6mGo'),
      'process.env.VITE_AGORA_APP_ID': JSON.stringify(env.VITE_AGORA_APP_ID || process.env.VITE_AGORA_APP_ID || ''),
      'import.meta.env.VITE_AGORA_APP_ID': JSON.stringify(env.VITE_AGORA_APP_ID || process.env.VITE_AGORA_APP_ID || ''),
      'process.env.VITE_AGORA_APP_CERTIFICATE': JSON.stringify(env.VITE_AGORA_APP_CERTIFICATE || process.env.VITE_AGORA_APP_CERTIFICATE || ''),
      'import.meta.env.VITE_AGORA_APP_CERTIFICATE': JSON.stringify(env.VITE_AGORA_APP_CERTIFICATE || process.env.VITE_AGORA_APP_CERTIFICATE || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': {
          target: 'http://localhost:5174',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
            'vendor-ui': ['lucide-react', 'date-fns', 'clsx', 'tailwind-merge'],
          }
        }
      },
      chunkSizeWarningLimit: 1000,
    }
  };
});
