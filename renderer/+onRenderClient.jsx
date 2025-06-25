// renderer/+onRenderClient.jsx
import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { PageShell } from './PageShell';
import { HelmetProvider } from 'react-helmet-async';

export async function onRenderClient(pageContext) {
  // ИСПРАВЛЕНИЕ: Объединяем pageProps и данные из +data.js
  const pageProps = { ...pageContext.data, ...pageContext.pageProps };
  
  const { Page } = pageContext;
  if (!Page) { console.error("Client Error: pageContext.Page is undefined."); return; }
  
  const clientHelmetContext = {};
  const container = document.getElementById('root');
  if (!container) { console.error("Client Error: DOM element #root not found."); return; }
  
  hydrateRoot(
    container,
    <React.StrictMode>
      <HelmetProvider context={clientHelmetContext}>
        <PageShell pageContext={pageContext}>
          <Page {...pageProps} />
        </PageShell>
      </HelmetProvider>
    </React.StrictMode>
  );
}