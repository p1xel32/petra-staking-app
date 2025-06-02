// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vike from 'vike/plugin';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    vike({
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist', 
    target: 'es2022', 
    minify: 'esbuild',
    cssCodeSplit: true,
  },
  esbuild: {
    target: 'es2022'
  },
  ssr: {
    external: ['@aptos-labs/ts-sdk']
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