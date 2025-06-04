// renderer/+config.js
import vercelVikePluginConfig from '@vite-plugin-vercel/vike/config';

export default {
  extends: vercelVikePluginConfig,

  passToClient: [
    'pageProps',
    'title',
    'routeParams'
  ],
};