// renderer/+onRenderHtml.jsx
import React from 'react';
import { renderToString } from 'react-dom/server';
import { escapeInject, dangerouslySkipEscape } from 'vike/server';
import { HelmetProvider } from 'react-helmet-async'; // ПРЯМОЙ ИМПОРТ
import { PageShell } from './PageShell';

export async function onRenderHtml(pageContext) {
  const { Page, pageProps } = pageContext;

  if (!Page) {
    // Возвращаем простой HTML для ошибки, чтобы Vike не искал _error.page.jsx в этом случае
    return { documentHtml: '<!DOCTYPE html><html><head><title>Error</title></head><body>Page component not found.</body></html>' };
  }

  const localHelmetContext = {}; // Локальный контекст только для этого рендера

  let pageHtml;
  try {
    pageHtml = renderToString(
      <HelmetProvider context={localHelmetContext}>
        <PageShell pageContext={pageContext}> {/* PageShell НЕ СОДЕРЖИТ HelmetProvider */}
          <Page {...pageProps} />
        </PageShell>
      </HelmetProvider>
    );
  } catch (error) {
    console.error("[SSR onRenderHtml] Error during renderToString:", error);
    // Для отладки можно вывести ошибку прямо в HTML
    // return { documentHtml: `<h1>Server Render Error</h1><pre>${error.stack}</pre>`};
    throw error; // Позволяем Vike использовать _error.page.jsx, если он есть
  }

  const { helmet } = localHelmetContext; // Извлекаем из локального контекста

  const documentHtml = escapeInject`<!DOCTYPE html>
    <html lang="en" ${dangerouslySkipEscape(helmet?.htmlAttributes?.toString() || '')}>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        ${dangerouslySkipEscape(helmet?.title?.toString() || '<title>Petra Staking (Manual Control)</title>')}
        ${dangerouslySkipEscape(helmet?.meta?.toString() || '')}
        ${dangerouslySkipEscape(helmet?.link?.toString() || '')}
        ${dangerouslySkipEscape(helmet?.script?.toString() || '')}
        ${dangerouslySkipEscape(helmet?.noscript?.toString() || '')}
        ${dangerouslySkipEscape(helmet?.style?.toString() || '')}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body ${dangerouslySkipEscape(helmet?.bodyAttributes?.toString() || '')}>
        <div id="root">${dangerouslySkipEscape(pageHtml)}</div>
        <div id="modal-root"></div>
      </body>
    </html>`;

  return {
    documentHtml,
    pageContext: {} 
  };
}