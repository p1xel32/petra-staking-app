// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // теперь нужен

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
      'antd/es/flex': path.resolve(__dirname, 'node_modules/antd/es/flex'),
    },
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
      'antd/es/flex',
      'antd/es/date-picker',
      'antd/es/modal',
      'antd/es/dropdown',
      'antd/es/menu',
      'antd/es/select',
      'antd/es/table',
      'antd/es/config-provider',
      'antd/es/locale-provider',
    ],
  },
});
