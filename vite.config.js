// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// import path from 'path'; // Временно не нужен, если алиас комментируем

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    minify: 'esbuild',
    cssCodeSplit: true,
  },
  resolve: {
    // preserveSymlinks: true, // << КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: Установите false или закомментируйте
    // alias: { // << Также закомментируйте для чистоты теста preserveSymlinks
    //   'antd/es/flex': path.resolve(__dirname, 'node_modules/antd/es/flex/index.js'),
    // },
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
      // 'antd/es/flex' // Можно также временно закомментировать
    ],
  },
});