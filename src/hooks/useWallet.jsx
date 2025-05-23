// src/hooks/useWallet.js
import { useWallet as useAptosWallet } from "@aptos-labs/wallet-adapter-react";

export function useWallet() {
  const {
    account,
    connected,
    connect,
    disconnect,
    wallets,
    wallet,
    signAndSubmitTransaction,
  } = useAptosWallet();

  return {
    account,
    connected,
    connect,
    disconnect,
    wallets,
    wallet,
    signAndSubmitTransaction,
  };
}
