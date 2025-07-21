import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { PageShell } from './PageShell.jsx';

export function onRenderClient(pageContext) {
  const { Page, pageProps } = pageContext;
  
  if (!Page) {
    throw new Error('Client-side render() hook expects pageContext.Page to be defined');
  }
  
  const container = document.getElementById('root');
  if (!container) {
    throw new Error('DOM element #root not found');
  }
  
  hydrateRoot(
    container,
    <PageShell pageContext={pageContext}>
      <Page {...pageProps} />
    </PageShell>
  );

  if (pageContext.isHydration) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'page_view',
      page: window.location.pathname + window.location.search,
    });
  }
}

export const onPageTransitionEnd = (pageContext) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'page_view',
    page: pageContext.urlPathname + window.location.search,
  });
};
