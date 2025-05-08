import React, { useState, useCallback } from 'react';
import ValidatorInfo from './components/ValidatorInfo.jsx';
import StakeUnstakeControls from './components/StakeUnstakeControls.jsx';
import './index.css';
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { motion } from 'framer-motion';
import aptcoreLogoUrl from './assets/aptcore-logo.svg';

function App() {
  const { account, connected } = useWallet();
  const userAccountAddress = account?.address ? account.address.toString() : null;
  const [refreshCounter, setRefreshCounter] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshCounter(prev => prev + 1);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans">
      <header className="w-full backdrop-blur-xl bg-white/5 border-b border-white/10 shadow-md px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center sticky top-0 z-50">
      <a
          href="/"
          className="flex items-baseline focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-md p-1 -ml-1"
        >
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight inline-flex items-baseline text-purple-400">
            <span>aptcore</span>
            <img
              src={aptcoreLogoUrl}
              alt="separator icon"
              className="h-4 w-4 sm:h-5 sm:w-5 mx-1 relative top-px" 
            />
            <span>one</span>
          </h1>
        </a>
        <WalletSelector />
      </header>

      <main className="flex flex-col items-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-3xl text-center mb-12 px-4"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight text-gray-100">
            <span className="text-purple-400">aptcore.one:</span> Smart & Simple Aptos Staking
          </h2>
          <p className="text-lg md:text-xl text-zinc-300 leading-relaxed">
            Stake your Aptos (APT) with any compatible wallet. Maximize rewards, minimize complexity. Secure, transparent, and user-centric.
          </p>
        </motion.div>

        <div className="w-full max-w-2xl flex flex-col items-center gap-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full bg-white/5 backdrop-blur-lg border border-white/20 p-6 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            <ValidatorInfo account={userAccountAddress} refreshTrigger={refreshCounter} />
          </motion.div>

          {connected && userAccountAddress ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="w-full bg-white/5 backdrop-blur-lg border border-white/20 p-6 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              <StakeUnstakeControls account={userAccountAddress} onTransactionSuccess={triggerRefresh} />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center w-full bg-white/5 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              <h2 className="text-2xl font-semibold mb-3 text-gray-100">Ready to Earn Aptos Staking Rewards?</h2>
              <p className="text-base text-zinc-300 mb-4">
                Connect your Aptos wallet to aptcore.one. It's the first step to stake your APT, manage your delegation with our validator pool, and start accumulating Aptos staking rewards. We support a variety of Aptos wallets.
              </p>
              {/*
              <p className="text-sm text-zinc-400">
                New to this? Our <a href="/blog/aptos-staking-guide" className="text-purple-400 hover:underline" target="_blank" rel="noopener noreferrer">Aptos Staking Guide</a> will help you get started with any compatible wallet.
              </p>
              */}
            </motion.div>
          )}
        </div>
      </main>

      <footer className="text-center py-8 text-zinc-400 text-sm">
        <p>&copy; {new Date().getFullYear()} aptcore.one — Secure Aptos (APT) Staking. Stake with confidence.</p>
      </footer>
    </div>
  );
}

export default App;