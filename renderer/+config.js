import vercelVikePluginConfig from '@vite-plugin-vercel/vike/config';

export default {
  extends: vercelVikePluginConfig,

  // Подключаем наш новый глобальный хук маршрутизации
  onBeforeRoute: './+onBeforeRoute.js',

  passToClient: [
    'pageProps',
    'title',
    'routeParams',
    'data',
    'locale',
    'initialI18nStore',
    'helmet'
  ]
};