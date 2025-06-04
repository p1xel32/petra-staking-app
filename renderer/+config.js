// renderer/+config.js
// УБИРАЕМ импорт vikeReactConfigStringPointer
// УБИРАЕМ импорт PageShell (onRenderHtml сам его импортирует)

export default {
  // НЕТ extends: vikeReactConfigStringPointer
  // НЕТ PageShell: PageShell

  passToClient: [
    'pageProps',
    'title',
    'routeParams'
  ],
};