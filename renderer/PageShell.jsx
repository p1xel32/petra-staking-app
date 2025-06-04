// renderer/PageShell.jsx
import React, { Suspense, useState, useEffect } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async'; // Прямой импорт
import { PageContextProvider, usePageContext } from './usePageContext'; // usePageContext может быть полезен здесь
import { ConfigProvider, Spin, theme as antTheme } from 'antd'; // Добавил Spin для PageLoader
import { WalletProvider } from '../src/walletProvider'; // Предполагается, что путь правильный или используется alias
import Layout from '../src/components/Layout/Layout';   // Предполагается, что путь правильный или используется alias
import '../src/index.css';                             // Глобальные стили
import 'antd/dist/reset.css';                          // Сброс стилей Ant Design

const PageLoader = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column', // Для текста под спиннером
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh', // Занимает всю высоту экрана
    color: '#e0e0e0', // Светлый текст для темной темы по умолчанию
    backgroundColor: '#18181b', // Темный фон по умолчанию
  }}>
    <Spin size="large" />
    <p style={{ marginTop: '20px', fontSize: '1.1rem' }}>Loading Page...</p>
  </div>
);

export function PageShell({ pageContext, children }) {
  const [isDarkMode, setIsDarkMode] = useState(false); // Начальное состояние (может быть уточнено)

  useEffect(() => {
    // Этот useEffect выполняется только на клиенте
    const rootHtmlElement = document.documentElement;
    const updateMode = () => {
      const darkModeEnabled = rootHtmlElement.classList.contains('dark');
      setIsDarkMode(darkModeEnabled);
      // Можно также сохранить предпочтение пользователя в localStorage
      // localStorage.setItem('theme', darkModeEnabled ? 'dark' : 'light');
    };

    // Устанавливаем начальное состояние на клиенте, если тема уже применена (например, из localStorage)
    // Это поможет избежать "мелькания", если пользователь уже выбрал темную тему
    // и класс 'dark' был добавлен до гидратации React.
    updateMode();

    const observer = new MutationObserver(updateMode);
    observer.observe(rootHtmlElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);
  
  // На сервере pageContext должен быть предоставлен и проверен
  if (import.meta.env.SSR) {
    if (typeof pageContext.helmetContext !== 'object' || pageContext.helmetContext === null) {
      // Эта ошибка остановит SSR, если helmetContext не был правильно инициализирован (например, в onBeforeRender)
      throw new Error(`[SSR PageShell] pageContext.helmetContext is not a valid object. Received: ${JSON.stringify(pageContext.helmetContext)}`);
    }
    // Для SSR, isDarkMode будет false (начальное состояние useState),
    // если только вы не передаете начальное состояние темы через pageContext.
    // Для консистентности SSR и первого клиентского рендера, лучше, чтобы сервер всегда рендерил одну тему,
    // а клиент переключался после гидратации, если нужно.
  }

  return (
    <React.StrictMode>
      <PageContextProvider pageContext={pageContext}>
        {/* HelmetProvider использует helmetContext из pageContext, который должен быть создан в onBeforeRender */}
        <HelmetProvider context={pageContext.helmetContext || {}}> {/* Добавлен fallback на всякий случай */}
          {/* Глобальные теги для всех страниц, которые могут быть переопределены */}
          <Helmet>
            <html lang="en" /> {/* Язык по умолчанию */}
            <meta name="application-name" content="Petra Staking App" />
            {/* Здесь можно задать дефолтный title, если страницы его не переопределяют */}
            {/* <title>Petra Staking</title> */}
            {/* Дефолтное описание, если страница его не задает */}
            {/* <meta name="description" content="Securely stake your Aptos (APT) tokens with Petra Staking." /> */}
          </Helmet>
          
          <WalletProvider>
            <ConfigProvider
              theme={{
                algorithm: isDarkMode ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
                token: {
                  colorPrimary: '#a855f7', // Ваш основной цвет
                  // Другие токены темы Ant Design можно настроить здесь
                },
              }}
            >
              <Layout> {/* Ваш основной компонент Layout */}
                <Suspense fallback={<PageLoader />}>
                  {children} {/* Здесь рендерятся ваши конкретные страницы (+Page.jsx) */}
                </Suspense>
              </Layout>
            </ConfigProvider>
          </WalletProvider>
        </HelmetProvider>
      </PageContextProvider>
    </React.StrictMode>
  );
}