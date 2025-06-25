import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vike from 'vike/plugin';
import { cjsInterop } from 'vite-plugin-cjs-interop';
import vercel from 'vite-plugin-vercel';
import path from 'path';

// This is our new custom plugin for the dev server
const devApiPlugin = () => ({
  name: 'dev-api-plugin',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.originalUrl.startsWith('/api/getUserStake')) {
        try {
          const apiHandler = (await server.ssrLoadModule('./api-functions/getUserStake.js')).default;
          
          const response = await apiHandler(req);

          res.statusCode = response.status;
          response.headers.forEach((value, key) => {
            res.setHeader(key, value);
          });
          res.end(await response.text());

          return;
        } catch (error) {
          console.error('API handler error:', error);
          res.statusCode = 500;
          res.end('Internal Server Error');
          return;
        }
      }
      next();
    });
  },
});


export default defineConfig({
  plugins: [
    react(),
    vike(),
    vercel({
      additionalEndpoints: [
        {
          source: 'api-functions/getUserStake.js',
          destination: 'getUserStake',
        },
      ],
    }),
    cjsInterop({
      dependencies: ['react-helmet-async'],
    }),
    devApiPlugin(),
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
            if (id.includes('antd')) return 'vendor-antd';
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