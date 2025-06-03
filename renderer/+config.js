// renderer/+config.js
// import { PageShell } from './PageShell'; // Не обязательно здесь указывать, если onRenderHtml импортирует

export default {
  passToClient: [
    'pageProps',
    'title',
    'routeParams'
  ],
};