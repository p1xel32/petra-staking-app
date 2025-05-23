// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// import path from 'path'; // Only if you use path for other aliases

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    minify: 'esbuild',
    cssCodeSplit: true,
  },
  resolve: {
    preserveSymlinks: true,
    // alias: { // This antd/es alias is likely not needed if optimizeDeps works
    //   'antd/es': path.resolve(__dirname, 'node_modules/antd/es'),
    // },
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
      'antd/es/avatar',       // Crucial for the "./avatar" error
      // If you had a "./flex" error before, these might have helped:
      // 'antd/es/flex', 
    ],
  },
});