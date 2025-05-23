// vite.config.js
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    preserveSymlinks: true,
    mainFields: ['main', 'module'],
    alias: [
      // Redirect antd/es imports to antd/lib
      {
        find: /^antd\/es(.*)$/,
        replacement: path.resolve(__dirname, 'node_modules/antd/lib$1'),
      },
      // Use the browser bundle for axios
      {
        find: 'axios',
        replacement: path.resolve(__dirname, 'node_modules/axios/dist/axios.min.js'),
      },
    ],
  },
  optimizeDeps: {
    include: [
      'antd/es/grid',
      'antd/es/layout',
      'antd/es/space',
      'antd/es/button',
      'antd/es/form',
      'antd/es/input',
      'antd/es/input-number',
      'antd/es/checkbox',
      'antd/es/tooltip',
      'antd/es/spin',
      'antd/es/alert',
      'antd/es/typography',
      'antd/es/divider',
      'antd/es/avatar',
      'antd/es/avatar/group',
      'antd/es/flex',
    ],
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          let pkg = id.split('node_modules/')[1].split('/')[0];
          if (pkg.startsWith('@')) {
            const parts = id.split('node_modules/')[1].split('/');
            pkg = `${parts[0]}/${parts[1]}`;
          }
          return `vendor.${pkg.replace('@', '').replace('/', '.')}`;
        },
      },
    },
  },
  ssr: {
    noExternal: ['antd'],
  },
});
