import React from "react";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";

// Array for any legacy (non-AIP-62) wallet plugins, if needed.
// For modern wallets like Petra, Martian, Pontem, etc., that follow AIP-62,
// auto-detection is preferred (by not specifying `optInWallets` or providing an empty array).
const legacyPlugins = [];

export function WalletProvider({ children }) {
  return (
    <AptosWalletAdapterProvider
      plugins={legacyPlugins} // Pass any legacy (non-AIP-62) plugins here
      // By omitting `optInWallets` or providing an empty array,
      // the adapter will attempt to auto-detect all installed AIP-62 compliant wallets.
      // If you wanted to strictly limit to specific wallets, e.g., only Petra:
      // optInWallets={['Petra']}
      autoConnect={false} // Set to true to attempt auto-reconnection on page load
      onError={(error) => {
        // Centralized error logging for adapter-level issues
        console.error("Wallet Provider Error:", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
