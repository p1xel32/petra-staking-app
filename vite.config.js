import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    preserveSymlinks: true,
    alias: [
      // всё, что идёт из antd/es/... будет браться из lib
      {
        find: /^antd\/es\/(.*)$/,
        replacement: path.resolve(__dirname, 'node_modules/antd/lib/$1'),
      },
    ],
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    cssCodeSplit: true,
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
    ],
  },
  ssr: {
    noExternal: ['antd'],
  },
});
