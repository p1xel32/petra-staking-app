// renderer/+onRenderClient.js
import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { PageShell } from './PageShell';

export default async function onRenderClient(pageContext) {
  const { Page, pageProps } = pageContext;
  if (!Page) { /* ... */ }

  // PageShell уже содержит HelmetProvider, которому нужен helmetContext
  // Убедимся, что он есть на клиенте (vike-react/config мог его не передать,
  // так как клиентский HelmetProvider обычно создает свой).
  if (typeof pageContext.helmetContext === 'undefined') {
    pageContext.helmetContext = {};
  }

  const container = document.getElementById('root');
  if (!container) { /* ... */ }

  hydrateRoot(
    container,
    <React.StrictMode>
      <PageShell pageContext={pageContext}> {/* PageShell содержит HelmetProvider */}
        <Page {...pageProps} />
      </PageShell>
    </React.StrictMode>
  );
}