// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // Make sure to import 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    minify: 'esbuild',
    cssCodeSplit: true,
  },
  resolve: {
    preserveSymlinks: true, // You have this
    alias: {
      // This tells Vite: whenever you encounter an import for 'antd/es/flex',
      // resolve it to the absolute path of 'node_modules/antd/es/flex/index.js'.
      'antd/es/flex': path.resolve(__dirname, 'node_modules/antd/es/flex/index.js'),
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
      'antd/es/avatar',
      // We're trying alias first, so keeping 'antd/es/flex' out of here for now,
      // unless the alias alone doesn't work. If the alias works,
      // 'antd/es/flex' might still be needed here for pre-bundling.
    ],
  },
});