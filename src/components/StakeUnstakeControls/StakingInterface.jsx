import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { motion } from 'framer-motion';

// ▼▼▼ ИЗМЕНЕНИЕ ЗДЕСЬ ▼▼▼
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
    active: 0, inactive: 0, pendingInactive: 0, isFetching: true,
  });
  const [walletBalance, setWalletBalance] = useState(0);

  const fetchUserStake = useCallback(async () => {
    if (!userAccountAddress || !serverFetchedPoolInfo?.poolAddress) {
      setUserStake({ active: 0, inactive: 0, pendingInactive: 0, isFetching: false });
      return;
    }
    setUserStake(prev => ({ ...prev, isFetching: true }));
    try {
      const apiUrl = `/api/getUserStake?account=${userAccountAddress}&pool=${serverFetchedPoolInfo.poolAddress}`;
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
      const data = await response.json();
      setUserStake({ ...data, isFetching: false });
    } catch (error) {
      console.error("Error fetching user stake via API:", error);
      setUserStake({ active: 0, inactive: 0, pendingInactive: 0, isFetching: false });
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
      setUserStake({ active: 0, inactive: 0, pendingInactive: 0, isFetching: false });
      setWalletBalance(0);
    }
  }, [connected, userAccountAddress, fetchUserStake, fetchWalletBalance, serverFetchedPoolInfo]);

  const handleTransactionSuccess = () => {
    fetchUserStake();
    fetchWalletBalance();
  };

  return (
    <>
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
          />
        </Suspense>
      </motion.div>
    </>
  );
}