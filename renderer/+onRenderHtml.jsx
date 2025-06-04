import React from 'react';
import { renderToString } from 'react-dom/server';
import { escapeInject, dangerouslySkipEscape } from 'vike/server';
import { HelmetProvider } from 'react-helmet-async';
import { PageShell } from './PageShell';

export async function onRenderHtml(pageContext) {
  const { Page, pageProps } = pageContext;
  if (!Page) {
    return { documentHtml: '<!DOCTYPE html><html><head><title>Error</title></head><body>Page component not found.</body></html>' };
  }
  const localHelmetContext = {};
  let pageHtml = "";
  try {
    pageHtml = renderToString(
      <HelmetProvider context={localHelmetContext}>
        <PageShell pageContext={pageContext}>
          <Page {...pageProps} />
        </PageShell>
      </HelmetProvider>
    );
  } catch (error) {
    console.error("[SSR onRenderHtml] Error during renderToString:", error);
    throw error;
  }
  const { helmet } = localHelmetContext;
  const documentHtml = escapeInject`<!DOCTYPE html>
    <html lang="en" ${dangerouslySkipEscape(helmet?.htmlAttributes?.toString() || '')}>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        ${dangerouslySkipEscape(helmet?.title?.toString() || '<title>Petra Staking</title>')}
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
  return { documentHtml, pageContext: {} };
}