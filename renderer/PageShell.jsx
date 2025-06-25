// renderer/PageShell.jsx

import React, { Suspense, useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { PageContextProvider } from './usePageContext';
import { ConfigProvider, theme as antTheme, Spin } from 'antd';
import { WalletProvider } from '../src/walletProvider';
import Layout from '../src/components/Layout/Layout';

// ADD THESE TWO LINES BACK. THIS IS THE CORRECT WAY.
import 'antd/dist/reset.css';
import '../src/index.css';

const PageLoader = () => (
  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#e0e0e0', backgroundColor: '#18181b' }}>
    <Spin size="large" />
    <p style={{ marginTop: '20px', fontSize: '1.1rem' }}>Loading Page...</p>
  </div>
);

export function PageShell({ pageContext, children }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    const rootHtmlElement = document.documentElement;
    const updateMode = () => setIsDarkMode(rootHtmlElement.classList.contains('dark'));
    updateMode();
    const observer = new MutationObserver(updateMode);
    observer.observe(rootHtmlElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <React.StrictMode>
      <PageContextProvider pageContext={pageContext}>
        <Helmet>
          <html lang="en" />
          <meta name="description" content="aptcore.one: Secure & Transparent Aptos (APT) Staking Platform" />
          <title>Stake your Aptos (APT) with aptcore.one. We offer transparent, secure Aptos staking with clear explanations of rewards, lock-ups (currently ~14 days), and the current 'no slashing' environment. Empower your Aptos journey.</title>
        </Helmet>
        <WalletProvider>
          <ConfigProvider
            theme={{ algorithm: isDarkMode ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm, token: { colorPrimary: '#a855f7' } }}
          >
            <Layout>
              <Suspense fallback={<PageLoader />}>
                {children}
              </Suspense>
            </Layout>
          </ConfigProvider>
        </WalletProvider>
      </PageContextProvider>
    </React.StrictMode>
  );
}