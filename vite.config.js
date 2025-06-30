// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vike from 'vike/plugin';
import path from 'path';
import vercel from 'vite-plugin-vercel';
import { cjsInterop } from 'vite-plugin-cjs-interop';

// ✅ НАШ ФИНАЛЬНЫЙ, ИСПРАВЛЕННЫЙ ПЛАГИН ДЛЯ `vite dev`
const localApiServerPlugin = () => ({
  name: 'local-api-server',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      // Мы перехватываем все запросы, которые начинаются с /api/
      if (req.originalUrl.startsWith('/api/')) {
        try {
          // ✅ ГЛАВНОЕ ИСПРАВЛЕНИЕ: Правильно конструируем путь к файлу
          // req.originalUrl будет, например, /api/getUserStake?param=1
          // Мы берем часть до `?` и заменяем /api на /_api
          const filePath = req.originalUrl.split('?')[0].replace(/^\/api/, '/_api');
          const apiFilePath = `.${filePath}.js`;
          
          console.log(`[Local API] Routing ${req.originalUrl} to ${apiFilePath}`);

          // Vite загружает наш API-файл как модуль
          const apiHandlerModule = await server.ssrLoadModule(apiFilePath);
          const apiHandler = apiHandlerModule.default;
          
          // Выполняем наш API-хендлер
          await apiHandler(req, res);
          // `res.end()` будет вызван внутри хендлера, поэтому мы не вызываем next()
          return; 
        } catch (error) {
          console.error(`[Local API] Handler error for ${req.originalUrl}:`, error);
          res.statusCode = 500;
          res.end('Internal Server Error');
          return;
        }
      }
      // Если URL не /api/, передаем управление дальше
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
    localApiServerPlugin(), // ✅ ВКЛЮЧАЕМ НАШ ИСПРАВЛЕННЫЙ ПЛАГИН
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  // ❌ Убедитесь, что здесь НЕТ секции `server.proxy`.
});