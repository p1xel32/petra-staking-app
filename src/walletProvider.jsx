//src/walletProvider.jsx
import React, { useState, useEffect } from 'react';
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import ClientOnly from './components/ClientOnly';

// Обертка для динамической загрузки
const DynamicWalletProvider = ({ children }) => {
  const [plugins, setPlugins] = useState(null);

  useEffect(() => {
    const initializePlugins = async () => {
      try {
        // Динамически импортируем модуль
        const pluginModule = await import('@aptos-connect/wallet-adapter-plugin');
        
        // ✅ ГЛАВНОЕ ИСПРАВЛЕНИЕ:
        // Мы используем правильное имя, которое увидели в логе.
        const AptosConnectWallet = pluginModule.AptosConnectWallet;
        
        // Теперь создаем экземпляр через new
        const walletPlugins = [
          new AptosConnectWallet({
            network: 'mainnet',
          })
        ];

        setPlugins(walletPlugins);
      } catch (error) {
        console.error("Failed to load Aptos Connect wallet plugin:", error);
        setPlugins([]);
      }
    };

    initializePlugins();
  }, []);

  // Пока плагины не готовы, не рендерим провайдер, чтобы избежать ошибок на сервере
  if (plugins === null) {
    return <>{children}</>;
  }

  // Как только плагин готов, рендерим полный провайдер
  return (
    <AptosWalletAdapterProvider
      plugins={plugins}
      autoConnect={true}
      onError={(error) => console.error("Wallet Provider Error:", error)}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
};


export function WalletProvider({ children }) {
  // ClientOnly гарантирует, что все это будет выполнено только в браузере
  return (
    <ClientOnly>
      <DynamicWalletProvider>
        {children}
      </DynamicWalletProvider>
    </ClientOnly>
  );
}