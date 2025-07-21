//src/walletProvider.jsx
import React, { useState, useEffect } from 'react';
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import ClientOnly from './components/ClientOnly';

const DynamicWalletProvider = ({ children }) => {
  const [plugins, setPlugins] = useState(null);

  useEffect(() => {
    const initializePlugins = async () => {
      try {
        const pluginModule = await import('@aptos-connect/wallet-adapter-plugin');
        
       
        const AptosConnectWallet = pluginModule.AptosConnectWallet;
        
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

  if (plugins === null) {
    return <>{children}</>;
  }

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
  return (
    <ClientOnly>
      <DynamicWalletProvider>
        {children}
      </DynamicWalletProvider>
    </ClientOnly>
  );
}