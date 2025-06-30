// renderer/+onRenderClient.jsx

import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { PageShell } from './PageShell';
import { HelmetProvider } from 'react-helmet-async';
import { WalletProvider } from '../src/walletProvider'; 

export async function onRenderClient(pageContext) {
 
  const { pageProps } = pageContext;
  
  const { Page } = pageContext;
  if (!Page) { return; }
  
  const container = document.getElementById('root');
  if (!container) { return; }
  
  hydrateRoot(
    container,
    <React.StrictMode>
      <HelmetProvider>
        <WalletProvider>
          <PageShell pageContext={pageContext}>
            <Page {...pageProps} />
          </PageShell>
        </WalletProvider>
      </HelmetProvider>
    </React.StrictMode>
  );
}