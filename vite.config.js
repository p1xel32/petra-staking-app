import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vike from 'vike/plugin';
import { cjsInterop } from 'vite-plugin-cjs-interop';
import vercel from 'vite-plugin-vercel';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    vike(),
    vercel(),
    cjsInterop({
      dependencies: ['react-helmet-async'],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  ssr: {
    external: ['@aptos-labs/ts-sdk'],
  },
  build: {
    outDir: process.env.SSR_BUILD === 'true' ? 'dist/server' : 'dist/client',
    target: 'es2022',
    minify: 'esbuild',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('antd')) return 'vendor_antd';
            if (id.includes('@aptos-labs/ts-sdk')) return 'vendor_aptos_sdk';
            if (id.includes('@aptos-labs/wallet-adapter')) return 'vendor_wallet_adapter';
            if (id.includes('lucide-react')) return 'vendor_icons';
            if (id.includes('react-helmet-async')) return 'vendor_helmet';
            if (id.includes('zustand')) return 'vendor_zustand';
            if (id.includes('viem')) return 'vendor_viem';
            return 'vendor_misc';
          }
          if (id.includes('/src/components/')) return 'chunk_components';
          if (id.includes('/src/pages/')) return 'chunk_pages';
          if (id.includes('/src/utils/')) return 'chunk_utils';
        },
      },
    },
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
