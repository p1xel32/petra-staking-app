// src/pages/MainStakingPage/MainStakingPage.jsx
import React, { useState, useCallback, Suspense, lazy } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async'; // For page-specific titles/meta

// Adjust paths if these components are elsewhere
import StructuredData from '../../components/StructuredData'; 
import FaqSection from '../../components/FaqSection';

const ValidatorInfo = lazy(() => import('../../components/ValidatorInfo'));
const StakeUnstakeControls = lazy(() => import('../../components/StakeUnstakeControls'));

const WidgetSkeleton = ({ height = 'h-48' }) => (
  <div className={`w-full bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)] animate-pulse ${height}`}>
    <div className="h-6 bg-gray-500/30 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-gray-500/30 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-gray-500/30 rounded w-5/6"></div>
  </div>
);

const MainStakingPage = () => {
  const { account, connected } = useWallet();
  const userAccountAddress = account?.address ? account.address.toString() : null;
  const [refreshCounter, setRefreshCounter] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshCounter(prev => prev + 1);
  }, []);

  return (
    <>
      <Helmet>
        <title>aptcore.one | Smart & Simple Aptos Staking</title>
        <meta name="description" content="Stake your Aptos (APT) with aptcore.one. Maximize rewards, minimize complexity. Secure, transparent, and user-centric." />
        {/* Add other relevant meta tags for your main staking page */}
      </Helmet>
      <StructuredData /> {/* If this is specific to the main page */}
      
      {/* Main content section of your staking page */}
      <div className="flex flex-col items-center px-4 py-10">
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

        <div className="w-full max-w-2xl flex flex-col items-center gap-10" id="stake-section">
          <Suspense fallback={<WidgetSkeleton height="h-48" />}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="w-full"
            >
              <ValidatorInfo account={userAccountAddress} refreshTrigger={refreshCounter} />
            </motion.div>
          </Suspense>

          {connected && userAccountAddress ? (
            <Suspense fallback={<WidgetSkeleton height="h-64" />}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="w-full"
              >
                <StakeUnstakeControls account={userAccountAddress} onTransactionSuccess={triggerRefresh} />
              </motion.div>
            </Suspense>
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
              </p>
              {/* The WalletSelector is in AppHeader, so users can connect from there */}
            </motion.div>
          )}
        </div>
      </div>
      <FaqSection /> {/* If this is specific to the main page */}
    </>
  );
};

export default MainStakingPage;