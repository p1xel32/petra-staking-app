import React, { useState, useEffect } from 'react';
import { PageContextProvider } from './usePageContext.jsx';
import { HelmetProvider } from 'react-helmet-async';
import { I18nextProvider } from 'react-i18next';
import { ConfigProvider, theme as antTheme, Spin } from 'antd';
import Layout from '../src/components/Layout/Layout.jsx';
import ClientOnly from '../src/components/ClientOnly.jsx';
import { WalletProvider } from '../src/walletProvider.jsx';
import { createI18nInstance } from '../src/i18n.js';
import { GtmScript } from '../src/components/GtmScript.jsx';

import 'antd/dist/reset.css';
import '../src/index.css';

const PageLoader = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#121212' }}>
        <Spin size="large" />
    </div>
);

export function PageShell({ pageContext, children }) {
    const { i18n: i18nFromServer, locale, initialI18nStore } = pageContext;
    const [i18n, setI18n] = useState(i18nFromServer);

    useEffect(() => {
        if (!i18nFromServer) {
            const init = async () => {
                const i18nClient = await createI18nInstance(locale);
                if (initialI18nStore && initialI18nStore[locale]) {
                   i18nClient.addResourceBundle(locale, 'translation', initialI18nStore[locale]);
                }
                setI18n(i18nClient);
            };
            init();
        }
    }, [i18nFromServer, locale, initialI18nStore]);

    // This structure is now IDENTICAL on server and client.
    // The i18n instance is passed, even if it's the server's version.
    return (
        <React.StrictMode>
            <PageContextProvider pageContext={pageContext}>
                <HelmetProvider>
                    <GtmScript /> 
                    <I18nextProvider i18n={i18n}>
                        <ConfigProvider theme={{ algorithm: antTheme.darkAlgorithm, token: { colorPrimary: '#a855f7' } }}>
                            <WalletProvider>
                                <ClientOnly fallback={<PageLoader />}>
                                    <Layout>
                                        {children}
                                    </Layout>
                                </ClientOnly>
                            </WalletProvider>
                        </ConfigProvider>
                    </I18nextProvider>
                </HelmetProvider>
            </PageContextProvider>
        </React.StrictMode>
    );
}