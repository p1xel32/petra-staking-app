import React from "react";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";

const legacyPlugins = [];
export function WalletProvider({ children }) {
  return (
    <AptosWalletAdapterProvider
      plugins={legacyPlugins}
      autoConnect={true} 
      onError={(error) => {
        console.error("Wallet Provider Error:", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
