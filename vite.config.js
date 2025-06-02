// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import ssr from 'vike/plugin'; 
import path from 'path';

export default defineConfig({
  server: {
    hmr: {
      port: 3000
    }
  },
  plugins: [
    react(),
    ssr({
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'es2022', 
    minify: 'esbuild',
    cssCodeSplit: true,
  },
  esbuild: {
    target: 'es2022' 
  },
  optimizeDeps: {
    include: [
      'react-helmet-async',
      'antd/es/typography',
      'antd/es/spin',
      'antd/es/divider',
      'antd/es/form',
      'antd/es/input-number',
      'antd/es/checkbox',
      'antd/es/tooltip',
      'antd/es/space',
      'antd/es/alert',
      'antd/es/config-provider',
      'antd/es/avatar',
    ],
  },
});
