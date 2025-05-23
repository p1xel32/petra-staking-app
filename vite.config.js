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
      'antd/es': path.resolve(__dirname, 'node_modules/antd/es'),
    },
  },
});
