// renderer/+onRenderHtml.jsx
import React from 'react';
import { renderToString } from 'react-dom/server';
import { dangerouslySkipEscape, escapeInject } from 'vike/server';
import { PageShell } from './PageShell';
import logoUrl from '../src/assets/aptcore-logo.svg';

export async function onRenderHtml(pageContext) {
  const { Page, pageProps } = pageContext;

  const helmetContext = {};
  pageContext.helmetContext = helmetContext;

  const pageHtml = renderToString(
    <PageShell pageContext={pageContext}>
      <Page {...pageProps} />
    </PageShell>
  );

  const { helmet } = helmetContext;

  const titleString = (helmet && helmet.title && helmet.title.toString()) || '<title>aptcore.one: Stake Aptos (APT)</title>';

  const documentHtml = escapeInject`<!DOCTYPE html>
    <html lang="en" ${dangerouslySkipEscape(helmet && helmet.htmlAttributes ? helmet.htmlAttributes.toString() : '')}>
      <head>
        <meta charset="UTF-8" />
        <link rel="icon" href="${logoUrl}" type="image/svg+xml" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        ${dangerouslySkipEscape(titleString)}
        ${dangerouslySkipEscape(helmet && helmet.meta ? helmet.meta.toString() : '')}
        ${dangerouslySkipEscape(helmet && helmet.link ? helmet.link.toString() : '')}
        ${dangerouslySkipEscape(helmet && helmet.script ? helmet.script.toString() : '')}
        ${dangerouslySkipEscape(helmet && helmet.noscript ? helmet.noscript.toString() : '')}
        ${dangerouslySkipEscape(helmet && helmet.style ? helmet.style.toString() : '')}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" media="print" onload="this.media='all'" />
        <noscript>
          <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
        </noscript>
      </head>
      <body ${dangerouslySkipEscape(helmet?.bodyAttributes?.toString() || '')}>
        <div id="root">${dangerouslySkipEscape(pageHtml)}</div>
        <div id="modal-root"></div>
      </body>
    </html>`;

  return {
    documentHtml,
    pageContext: {
      helmetContext,
    },
  };
}
