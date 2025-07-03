// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vike from 'vike/plugin';
import path from 'path';
import vercel from 'vite-plugin-vercel';
import { cjsInterop } from 'vite-plugin-cjs-interop';

const localApiServerPlugin = () => ({
  name: 'local-api-server',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.originalUrl.startsWith('/api/')) {
        try {
          const filePath = req.originalUrl.split('?')[0].replace(/^\/api/, '/_api');
          const apiFilePath = `.${filePath}.js`;
          
          console.log(`[Local API] Routing ${req.originalUrl} to ${apiFilePath}`);

          const apiHandlerModule = await server.ssrLoadModule(apiFilePath);
          const apiHandler = apiHandlerModule.default;
          
          await apiHandler(req, res);
          return; 
        } catch (error) {
          console.error(`[Local API] Handler error for ${req.originalUrl}:`, error);
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
    vercel(),
    cjsInterop({ dependencies: ['react-helmet-async'] }),
    localApiServerPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});