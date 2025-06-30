// renderer/PageShell.jsx

import React, { Suspense, useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { PageContextProvider } from './usePageContext';
import { ConfigProvider, theme as antTheme, Spin } from 'antd';
import Layout from '../src/components/Layout/Layout';
// ✅ 1. Импортируем ClientOnly
import ClientOnly from '../src/components/ClientOnly';

// Стили остаются здесь
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
          <title>aptcore.one: Secure & Transparent Aptos (APT) Staking</title>
        </Helmet>        
        <ConfigProvider
          theme={{ algorithm: isDarkMode ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm, token: { colorPrimary: '#a855f7' } }}
        >
          {/* ✅ 2. Оборачиваем Layout в ClientOnly */}
          <ClientOnly>
            <Layout>
              <Suspense fallback={<PageLoader />}>
                {children}
              </Suspense>
            </Layout>
          </ClientOnly>
        </ConfigProvider>
      </PageContextProvider>
    </React.StrictMode>
  );
}