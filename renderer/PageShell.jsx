import React, { Suspense } from 'react';
import { Helmet, HelmetProvider } from '@/lib/helmet';



import { ConfigProvider, theme as antTheme } from 'antd';
import { WalletProvider } from '../src/walletProvider'; 
import Layout from '../src/components/Layout/Layout'; 
import '../src/index.css'; 
import 'antd/dist/reset.css'; 
import { PageContextProvider } from './usePageContext';

const PageLoader = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
  </div>
);

export function PageShell({ pageContext, children }) {
  const { Page } = pageContext;
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  React.useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
        setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {attributes: true, attributeFilter: ['class']});
    return () => observer.disconnect();
  }, []);

  return (
    <React.StrictMode>
      <PageContextProvider pageContext={pageContext}>
        <HelmetProvider context={pageContext.helmetContext}>
          <WalletProvider>
            <ConfigProvider
              theme={{
                algorithm: isDarkMode ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
                token: {
                  colorPrimary: '#a855f7',
                },
              }}
            >
              <Layout>
                <Suspense fallback={<PageLoader />}>
                  {children}
                </Suspense>
              </Layout>
            </ConfigProvider>
          </WalletProvider>
        </HelmetProvider>
      </PageContextProvider>
    </React.StrictMode>
  );
}

