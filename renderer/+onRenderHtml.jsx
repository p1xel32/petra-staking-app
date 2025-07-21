import React from 'react';
import { renderToString } from 'react-dom/server';
import { escapeInject, dangerouslySkipEscape } from 'vike/server';
import { PageShell } from './PageShell.jsx';

const locales = ['en', 'es', 'ja', 'ko', 'ru', 'vi'];
const defaultLocale = 'en';
const siteUrl = 'https://aptcore.one';
const GTM_ID = 'GTM-TKTNVW6T';

export function onRenderHtml(pageContext) {
  const { Page, pageProps, urlPathname } = pageContext;

  if (!Page) {
    throw new Error('Vike config error: pageContext.Page is not defined.');
  }

  const helmetContext = {};
  pageContext.helmet = helmetContext;

  const pageHtml = renderToString(
    <PageShell pageContext={pageContext}>
      <Page {...pageProps} />
    </PageShell>
  );

  const { helmet } = helmetContext;

  const base_path = urlPathname.replace(new RegExp(`^\/(${locales.filter(l => l !== defaultLocale).join('|')})`), '');
  
  const hreflangLinks = locales.map(locale => {
    const path = locale === defaultLocale ? base_path : `/${locale}${base_path}`;
    const href = new URL(path, siteUrl).href;
    return `<link rel="alternate" hreflang="${locale}" href="${href}">`;
  }).join('\n');

  const xDefaultHref = new URL(base_path, siteUrl).href;
  const xDefaultLink = `<link rel="alternate" hreflang="x-default" href="${xDefaultHref}">`;

  const noscriptTag = GTM_ID 
    ? `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>` 
    : '';

  return escapeInject`<!DOCTYPE html>
    <html lang="${pageContext.locale || 'en'}" ${dangerouslySkipEscape(helmet?.htmlAttributes?.toString() || '')}>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        ${dangerouslySkipEscape(helmet?.title?.toString() || '<title>aptcore.one</title>')}
        ${dangerouslySkipEscape(helmet?.meta?.toString() || '')}
        ${dangerouslySkipEscape(helmet?.link?.toString() || '')}
        
        ${dangerouslySkipEscape(hreflangLinks)}
        ${dangerouslySkipEscape(xDefaultLink)}

        ${dangerouslySkipEscape(helmet?.script?.toString() || '')}
        
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body ${dangerouslySkipEscape(helmet?.bodyAttributes?.toString() || '')}>
        ${dangerouslySkipEscape(noscriptTag)}
        <div id="root">${dangerouslySkipEscape(pageHtml)}</div>
        <div id="modal-root"></div>
      </body>
    </html>`;
}
