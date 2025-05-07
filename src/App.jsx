import React, { useState, useCallback } from 'react';
import ValidatorInfo from './components/ValidatorInfo';
import StakeUnstakeControls from './components/StakeUnstakeControls';
import './index.css';
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { motion } from 'framer-motion';

function App() {
  const { account, connected } = useWallet();
  const userAccountAddress = account?.address ? account.address.toString() : null;
  const [refreshCounter, setRefreshCounter] = useState(0);

  const triggerRefresh = useCallback(() => {
    console.log("App: Triggering data refresh for child components.");
    setRefreshCounter(prev => prev + 1);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans">
      <header className="w-full backdrop-blur-xl bg-white/5 border-b border-white/10 shadow-md px-6 py-4 flex justify-between items-center">
        <h1 className="text-4xl font-bold tracking-tight">
          aptcore.<span className="text-purple-400">one</span>
        </h1>
        <WalletSelector />
      </header>

      <main className="flex flex-col items-center px-4 py-10">
        <div className="w-full max-w-2xl flex flex-col items-center gap-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full bg-white/5 backdrop-blur-lg border border-white/20 p-6 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            <ValidatorInfo account={userAccountAddress} refreshTrigger={refreshCounter} />
          </motion.div>

          {connected && userAccountAddress ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="w-full bg-white/5 backdrop-blur-lg border border-white/20 p-6 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              <StakeUnstakeControls account={userAccountAddress} onTransactionSuccess={triggerRefresh} />
            </motion.div>
          ) : (
            <div className="text-center w-full bg-white/5 backdrop-blur-lg border border-white/20 p-6 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <h2 className="text-2xl font-semibold mb-2">Ready to Stake?</h2>
              <p className="text-base text-zinc-300">
                Connect your wallet to manage your stake and interact with the pool.
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="text-center py-8 text-zinc-400 text-sm">
        <p>&copy; {new Date().getFullYear()} aptcore.one — Stake with confidence.</p>
      </footer>
    </div>
  );
}

export default App;
