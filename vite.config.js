import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    minify: 'esbuild',
    cssCodeSplit: true,
  },
  resolve: {
    preserveSymlinks: false,
    alias: {
      // Только если реально нужен прямой импорт
      'antd/es/flex': path.resolve(__dirname, 'node_modules/antd/es/flex'),
    },
  },
  optimizeDeps: {
    include: [
      'antd',
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
      'antd/es/flex',      // фиксил ошибку ./flex на Vercel
      'antd/es/avatar',    // тоже встречалась как проблема
    ],
  },
});
