// src/walletProvider.jsx
import React from "react";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";

// 1. REMOVE the import for the old Petra plugin package
// import { PetraWallet } from "petra-plugin-wallet-adapter"; // <-- DELETE or COMMENT OUT

// Define other wallets ONLY IF they are non-AIP-62 (legacy) AND needed.
// If Google/Apple/DevT are also AIP-62 compatible, they might also be auto-detected
// or need to be added to optInWallets if you want them. If they are legacy, keep them here.
// For now, let's assume we only want Petra available via optInWallets.
const legacyPlugins = [
  // Add instances of any required LEGACY (non-AIP-62) wallet plugins here, if any.
  // Example: new SomeLegacyWallet()
];

export function WalletProvider({ children }) {

  return (
    <AptosWalletAdapterProvider
      // 2. Pass any necessary LEGACY plugins here (if applicable, otherwise remove/empty array)
      plugins={legacyPlugins}

      // 3. ADD the optInWallets prop for modern AIP-62 wallets like Petra
      //    This tells the adapter to look for and include Petra if available.
      optInWallets={['Petra']} // Use the standard name 'Petra'

      autoConnect={false} // Keep autoConnect settings as desired
      // Optional: Add onError handler
      onError={(error) => {
        console.error("Wallet Provider Error:", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}