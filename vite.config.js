import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vike from 'vike/plugin';
import { cjsInterop } from 'vite-plugin-cjs-interop';
import vercel from 'vite-plugin-vercel';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    vike(),
    vercel(),
    cjsInterop({
      dependencies: ['react-helmet-async'],
    }),
    visualizer({ open: true }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  ssr: {
    external: ['@aptos-labs/ts-sdk', 'ethers'],
    noExternal: ['ethers'],
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
            if (id.includes('antd')) {
              return 'vendor-antd';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-framer-motion';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-lucide-react';
            }
            if (id.includes('@aptos-labs/ts-sdk')) {
              return 'vendor-aptos-ts-sdk';
            }
            if (id.includes('@aptos-labs/wallet-adapter')) {
              return 'vendor-aptos-wallet-adapter';
            }
            if (id.includes('ethers')) {
              return 'vendor-ethers';
            }
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('react-router-dom')
            ) {
              return 'vendor-react';
            }
            return 'vendor';
          }
        },
      },
    },
  },
  esbuild: {
    target: 'es2022',
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