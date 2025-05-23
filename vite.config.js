// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // Keep this if your alias needs it

export default defineConfig({
  plugins: [react()],
  build: { // Your existing build config
    target: 'es2020',
    minify: 'esbuild',
    cssCodeSplit: true,
  },
  resolve: { // Your existing resolve config
    preserveSymlinks: true,
    alias: {
      // You can keep this alias, but optimizeDeps might make it redundant for the 'es' path issue
      // 'antd/es': path.resolve(__dirname, 'node_modules/antd/es'), 
    },
  },
  optimizeDeps: { // ADD THIS SECTION
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
      'antd/es/avatar',       // For the "./avatar" error
      // Add 'antd/es/flex' if you see an error resolving "./flex" specifically,
      // though often including the components that *use* flex (like grid, space, layout) is enough.
      // 'antd/es/flex',
      // Add any other AntD ES modules that Vercel build logs might complain about
    ],
  },
});
