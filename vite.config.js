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
    preserveSymlinks: true,
    alias: {
      'antd': path.resolve(__dirname, 'node_modules/antd'),
      'antd/es': path.resolve(__dirname, 'node_modules/antd/es'),
    },
  },
  optimizeDeps: {
    include: [
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
      'antd/es/flex',
      'antd/es/avatar',
    ],
  },
});
