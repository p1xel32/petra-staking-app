// renderer/PageShell.jsx
import React, { Suspense, useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async'; // ПРЯМОЙ ИМПОРТ
import { PageContextProvider } from './usePageContext';
import { ConfigProvider, theme as antTheme } from 'antd';
import { WalletProvider } from '../src/walletProvider';
import Layout from '../src/components/Layout/Layout';
import '../src/index.css';
import 'antd/dist/reset.css';

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <div>Loading...</div>
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

  // HelmetProvider теперь находится в onRenderHtml.jsx (для SSR)
  // и в onRenderClient.jsx (для клиента)

  return (
    <React.StrictMode>
      <PageContextProvider pageContext={pageContext}>
        <Helmet> {/* Используем Helmet для установки тегов */}
          <html lang="en" />
          <meta name="description" content="Petra Staking Application" />
        </Helmet>
        
        <WalletProvider>
          <ConfigProvider
            theme={{
              algorithm: isDarkMode ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
              token: { colorPrimary: '#a855f7' },
            }}
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