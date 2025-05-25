// vite.config.js
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    preserveSymlinks: true,
    mainFields: ['module', 'main'],
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
    alias: [
      {
        find: 'axios',
        replacement: path.resolve(
          __dirname,
          'node_modules/axios/dist/axios.min.js'
        ),
      },
      {
        find: /framer-motion\/dist\/es\/render\/dom\/motion\.mjs$/,
        replacement: path.resolve(
          __dirname,
          'node_modules/framer-motion/dist/es/render/dom/motion.js'
        ),
      },
    ],
  },
  optimizeDeps: {
    include: [
      'antd',
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
      'framer-motion',
    ],
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/],
    },
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
    noExternal: ['antd', 'framer-motion'],
  },
});
