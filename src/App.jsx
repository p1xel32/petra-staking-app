// Main React Application File (e.g., src/App.jsx)
// Version with the "STAKE APT NOW" button removed for a simpler wallet connection flow.

import React, { useState, useCallback } from 'react';
// Ensure paths to your components are correct
import ValidatorInfo from './components/ValidatorInfo';
import StakeUnstakeControls from './components/StakeUnstakeControls';
import './index.css'; // Your main app's global styles
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design'; // UI component for wallet selection
import { useWallet } from '@aptos-labs/wallet-adapter-react'; // Core wallet adapter hook
import { motion } from 'framer-motion'; // For animations
import aptcoreLogoUrl from './assets/aptcore-logo.svg'; // Path to your logo

// --- Header Component ---
const AppHeader = () => {
  const BLOG_URL = "/blog"; // Example external link

  return (
    <header className="w-full backdrop-blur-xl bg-white/5 border-b border-white/10 shadow-md px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center sticky top-0 z-50">
      <a
        href="/"
        className="flex items-baseline focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-md p-1 -ml-1"
        aria-label="aptcore.one homepage"
      >
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight inline-flex items-baseline text-purple-400">
          <span>aptcore</span>
          <img
            src={aptcoreLogoUrl}
            alt="aptcore.one logo separator"
            className="h-4 w-4 sm:h-5 sm:w-5 mx-1 relative top-px"
            aria-hidden="true"
            width="20" height="20"
          />
          <span>one</span>
        </h1>
      </a>
      <div className="flex items-center space-x-4">
        <a
          href={BLOG_URL}
          className="text-sm sm:text-base font-medium text-zinc-300 hover:text-purple-400 transition-colors duration-150 px-1.5 py-1 rounded-md"
          target="_blank"
          rel="noopener noreferrer" // Important for security when using target="_blank"
        >
          Blog
        </a>
        <WalletSelector /> {/* Wallet connection button / selector */}
      </div>
    </header>
  );
};

// --- Footer Component ---
const AppFooter = () => {
  const currentYear = new Date().getFullYear();
  const BLOG_BASE_URL = "/blog";

  return (
    <footer className="text-center py-8 text-zinc-400 text-sm border-t border-white/10 mt-16">
      <div className="container mx-auto px-4">
        <nav className="mb-3 space-x-2 sm:space-x-4" aria-label="Footer navigation">
          <a href="/" className="hover:text-purple-400 transition-colors">Main App</a>
          <span className="text-zinc-600" aria-hidden="true">|</span>
          <a href={BLOG_BASE_URL} className="hover:text-purple-400 transition-colors" target="_blank" rel="noopener noreferrer">Blog</a>
          <span className="text-zinc-600" aria-hidden="true">|</span>
          <a href={`${BLOG_BASE_URL}/about`} className="hover:text-purple-400 transition-colors" target="_blank" rel="noopener noreferrer">About</a>
        </nav>
        <div className="mb-3 text-xs space-x-2 sm:space-x-4">
          <a href={`${BLOG_BASE_URL}/legal/disclaimer`} className="hover:text-purple-400 transition-colors" target="_blank" rel="noopener noreferrer">Disclaimer</a>
          <span className="text-zinc-600" aria-hidden="true">|</span>
          <a href={`${BLOG_BASE_URL}/legal/terms`} className="hover:text-purple-400 transition-colors" target="_blank" rel="noopener noreferrer">Terms of Use</a>
        </div>
        <p>&copy; {currentYear} aptcore.one — Secure Aptos (APT) Staking. Stake with confidence.</p>
      </div>
    </footer>
  );
};

// --- Main App Component ---
function App() {
  const {
    account,    // Information about the connected account
    connected,  // Boolean status of connection
    wallet,     // Information about the connected wallet adapter
  } = useWallet();

  // Diagnostic logs - can be removed or commented out for production
  console.log('--- Wallet Adapter Status (App Component Body) ---');
  console.log('Wallet object:', wallet);
  console.log('Connected status:', connected);
  console.log('Account:', account);
  console.log('-------------------------------------------------');

  const userAccountAddress = account?.address ? account.address.toString() : null;
  const [refreshCounter, setRefreshCounter] = useState(0); // Used to trigger data refresh in child components

  // Callback to trigger refresh, passed to StakeUnstakeControls
  const triggerRefresh = useCallback(() => {
    setRefreshCounter(prev => prev + 1);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans">
      <AppHeader />

      <main className="flex flex-col items-center px-4 py-10">
        {/* Introductory text section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-3xl text-center mb-8"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight text-purple-400">
            aptcore.one: <span className="text-gray-100">Smart & Simple Aptos Staking</span>
          </h2>
          <p className="text-lg md:text-xl text-zinc-300 leading-relaxed">
            Stake your Aptos (APT) with any compatible wallet. Maximize rewards, minimize complexity. Secure, transparent, and user-centric.
          </p>
        </motion.div>

        {/* Main content area for staking info and controls */}
        <div className="w-full max-w-2xl flex flex-col items-center gap-10" id="stake-section"> {/* ID for potential scrolling targets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full bg-white/5 backdrop-blur-lg border border-white/20 p-6 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            <ValidatorInfo account={userAccountAddress} refreshTrigger={refreshCounter} />
          </motion.div>

          {/* Conditional rendering based on wallet connection status */}
          {connected && userAccountAddress ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="w-full bg-white/5 backdrop-blur-lg border border-white/20 p-6 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              <StakeUnstakeControls account={userAccountAddress} onTransactionSuccess={triggerRefresh} />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-center w-full bg-white/5 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              <h2 className="text-2xl font-semibold mb-3 text-gray-100">Ready to Earn Aptos Staking Rewards?</h2>
              <p className="text-base text-zinc-300 mb-4">
                Connect your Aptos wallet to aptcore.one. It's the first step to stake your APT, manage your delegation with our validator pool, and start accumulating Aptos staking rewards. We support a variety of Aptos wallets.
                {/* User will use the "Connect Wallet" button in the header to connect. */}
              </p>
            </motion.div>
          )}
        </div>
      </main>

      <AppFooter />
    </div>
  );
}

export default App;