// File: src/components/StakeUnstakeControls/StakingInterface.jsx

import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { motion } from 'framer-motion';

// ✅ ИСПРАВЛЕНИЕ: Используем правильный относительный путь с двумя точками.
import { EpochInfoProvider } from '../../context/EpochInfoContext.jsx'; 

import ValidatorInfo from '../ValidatorInfo.jsx'; 
const StakeUnstakeControls = lazy(() => import('./StakeUnstakeControls'));

const WidgetSkeleton = ({ height = 'h-80' }) => (
  <div className={`w-full bg-zinc-900/50 border border-zinc-800 rounded-3xl animate-pulse ${height}`} />
);

export default function StakingInterface({ serverFetchedPoolInfo, serverFetchedApy }) {
  const { account, connected } = useWallet();
  const userAccountAddress = account?.address ? account.address.toString() : null;

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  const [userStake, setUserStake] = useState({
    active: 0,
    inactive: 0,
    pendingInactive: null,
    isFetching: true,
  });
  const [walletBalance, setWalletBalance] = useState(0);

  const fetchUserStake = useCallback(async () => {
    if (!userAccountAddress || !serverFetchedPoolInfo?.poolAddress) {
      setUserStake({ active: 0, inactive: 0, pendingInactive: null, isFetching: false });
      return;
    }
    setUserStake(prev => ({ ...prev, isFetching: true }));
    try {
      const apiUrl = `/api/getUserStake?account=${userAccountAddress}&pool=${serverFetchedPoolInfo.poolAddress}`;
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
      const data = await response.json();

      setUserStake({
        active: data.active || 0,
        inactive: data.inactive || 0,
        pendingInactive: data.pendingInactive,
        isFetching: false,
      });

    } catch (error) {
      console.error("Error fetching user stake via API:", error);
      setUserStake({ active: 0, inactive: 0, pendingInactive: null, isFetching: false });
    }
  }, [userAccountAddress, serverFetchedPoolInfo?.poolAddress]);

  const fetchWalletBalance = useCallback(async () => {
    if (!userAccountAddress) return;
    try {
      const response = await fetch(`/api/getWalletBalance?account=${userAccountAddress}`);
      if (!response.ok) throw new Error('Balance fetch failed');
      const data = await response.json();
      setWalletBalance(data.balance || 0);
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      setWalletBalance(0);
    }
  }, [userAccountAddress]);

  useEffect(() => {
    if (connected && userAccountAddress && serverFetchedPoolInfo?.poolAddress) {
      fetchUserStake();
      fetchWalletBalance();
    } else {
      setUserStake({ active: 0, inactive: 0, pendingInactive: null, isFetching: false });
      setWalletBalance(0);
    }
  }, [connected, userAccountAddress, fetchUserStake, fetchWalletBalance, serverFetchedPoolInfo]);

  const handleTransactionSuccess = () => {
    fetchUserStake();
    fetchWalletBalance();
  };

  return (
    <EpochInfoProvider>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="w-full"
      >
          <ValidatorInfo 
            poolInfo={serverFetchedPoolInfo} 
            apy={serverFetchedApy} 
            isMounted={isMounted}
          />
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5, delay: 0.1 }} 
        className="w-full"
      >
        <Suspense fallback={<WidgetSkeleton />}>
          <StakeUnstakeControls 
            account={userAccountAddress} 
            onTransactionSuccess={handleTransactionSuccess} 
            userStake={userStake}
            connected={connected}
            walletBalance={walletBalance}
            poolInfo={serverFetchedPoolInfo}
          />
        </Suspense>
      </motion.div>
    </EpochInfoProvider>
  );
}