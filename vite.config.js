// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// import path from 'path'; // path is usually not needed for antd/es if optimizeDeps works

export default defineConfig({
  plugins: [react()],
  build: { 
    target: 'es2020',
    minify: 'esbuild',
    cssCodeSplit: true,
  },
  resolve: { 
    preserveSymlinks: true,
    // alias: { // The 'aptos' alias might be needed if you encounter "BCS not exported" errors later
    //   'aptos': '@aptos-labs/ts-sdk', 
    // },
  },
  optimizeDeps: { 
    include: [
      // Common Ant Design ES modules for Vite pre-bundling
      // Add or remove based on specific errors you encounter during 'vite build' or on Vercel
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
      'antd/es/avatar',       // Was for "./avatar" error
      'antd/es/flex',         // Add this if you get "./flex" error
      'antd/es/date-picker',
      'antd/es/modal',
      'antd/es/dropdown',
      'antd/es/menu',
      'antd/es/select',
      'antd/es/table',
      'antd/es/config-provider',
      'antd/es/locale-provider',
      // 'antd/es/locale/en_US', // Example locale
    ],
  },
  // define: { // Optional: If 'global' is needed for some dependency
  //   'global': 'globalThis',
  // },
});