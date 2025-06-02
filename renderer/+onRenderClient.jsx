import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { PageShell } from './PageShell';

export async function onRenderClient(pageContext) {
  const { Page, pageProps } = pageContext;
  const page = (
    <PageShell pageContext={pageContext}>
      <Page {...pageProps} />
    </PageShell>
  );
  const container = document.getElementById('root');
  hydrateRoot(container, page);
}

