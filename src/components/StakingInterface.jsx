import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { motion } from 'framer-motion';

import ValidatorInfo from './ValidatorInfo';
const StakeUnstakeControls = lazy(() => import('./StakeUnstakeControls'));

const WidgetSkeleton = ({ height = 'h-48' }) => (
  <div className={`w-full bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)] animate-pulse ${height}`}>
    <div className="h-6 bg-gray-500/30 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-gray-500/30 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-gray-500/30 rounded w-5/6"></div>
  </div>
);

export default function StakingInterface({ serverFetchedPoolInfo, serverFetchedApy }) {
  const { account, connected } = useWallet();
  const userAccountAddress = account?.address ? account.address.toString() : null;

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [userStake, setUserStake] = useState({
    active: 0, inactive: 0, pendingInactive: 0, isFetching: true,
  });

  const fetchUserStake = useCallback(async () => {
    if (!userAccountAddress || !serverFetchedPoolInfo?.poolAddress) {
      setUserStake({ active: 0, inactive: 0, pendingInactive: 0, isFetching: false });
      return;
    }
    setUserStake(prev => ({ ...prev, isFetching: true }));
    try {
      const apiUrl = `/api/getUserStake?account=${userAccountAddress}&pool=${serverFetchedPoolInfo.poolAddress}`;
      
      console.log("DEBUG: Fetching user stake with URL:", apiUrl);
      
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
      const data = await response.json();
      setUserStake({ ...data, isFetching: false });
    } catch (error) {
      console.error("Error fetching user stake via API:", error);
      setUserStake({ active: 0, inactive: 0, pendingInactive: 0, isFetching: false });
    }
  }, [userAccountAddress, serverFetchedPoolInfo?.poolAddress]);

  useEffect(() => {
    if (connected && userAccountAddress && serverFetchedPoolInfo?.poolAddress) {
      fetchUserStake();
    } else {
      setUserStake({ active: 0, inactive: 0, pendingInactive: 0, isFetching: false });
    }
  }, [connected, userAccountAddress, fetchUserStake, serverFetchedPoolInfo]);

  const renderControls = () => {
    if (connected && userAccountAddress) {
      return (
        <Suspense key="connected-view" fallback={<WidgetSkeleton height="h-64" />}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="w-full">
            <StakeUnstakeControls 
              account={userAccountAddress} 
              onTransactionSuccess={fetchUserStake} 
              userStake={userStake} 
            />
          </motion.div>
        </Suspense>
      );
    } else {
      return (
        <motion.div key="unconnected-view" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="text-center w-full bg-white/5 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)]">
          <h2 className="text-2xl font-semibold mb-3 text-gray-100">Ready to Earn Aptos Staking Rewards?</h2>
          <p className="text-base text-zinc-300 mb-4">Connect your Aptos wallet to aptcore.one to get started.</p>
        </motion.div>
      );
    }
  };

  return (
    <>
      <Suspense fallback={<WidgetSkeleton height="h-48" />}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="w-full">
              <ValidatorInfo 
                poolInfo={serverFetchedPoolInfo} 
                apy={serverFetchedApy} 
                account={userAccountAddress} 
                userStake={userStake}
                isMounted={isMounted}
                connected={connected}
              />
          </motion.div>
      </Suspense>
      {renderControls()}
    </>
  );
}