// src/components/StakingInterface.jsx
import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Wallet } from 'lucide-react';
import ValidatorInfo from '@/components/ValidatorInfo';
import ClientOnly from '@/components/ClientOnly';

const WidgetSkeleton = ({ height = 'h-48' }) => ( <div className={`w-full ... animate-pulse ${height}`}>...</div> );
const StakeUnstakeControls = lazy(() => import('@/components/StakeUnstakeControls'));

// This component ONLY runs on the client, so using useWallet() here is safe.
export default function StakingInterface({ serverFetchedPoolInfo, serverFetchedApy }) {
  const { account, connected } = useWallet();
  const userAccountAddress = account?.address ? account.address.toString() : null;
  const [userStake, setUserStake] = useState({ active: 0, inactive: 0, pendingInactive: 0, isFetching: true });

  const fetchUserStake = useCallback(async () => {
    if (!userAccountAddress || !serverFetchedPoolInfo?.poolAddress) {
      setUserStake({ active: 0, inactive: 0, pendingInactive: 0, isFetching: false });
      return;
    }
    setUserStake(prev => ({ ...prev, isFetching: true }));
    try {
      const poolAddress = serverFetchedPoolInfo.poolAddress;
      const response = await fetch(`/api/getUserStake?account=${userAccountAddress}&pool=${poolAddress}`);
      if (!response.ok) throw new Error(`API request failed`);
      const data = await response.json();
      setUserStake({ ...data, isFetching: false });
    } catch (err) {
      console.error("Error calling getUserStake API:", err);
      setUserStake({ active: 0, inactive: 0, pendingInactive: 0, isFetching: false });
    }
  }, [userAccountAddress, serverFetchedPoolInfo?.poolAddress]);

  useEffect(() => {
    if (connected && userAccountAddress) fetchUserStake();
  }, [connected, userAccountAddress, fetchUserStake]);

  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-10" id="stake-section">
      <Suspense fallback={<WidgetSkeleton height="h-48" />}>
        <div className="w-full">
          <ValidatorInfo 
            poolInfo={serverFetchedPoolInfo} 
            apy={serverFetchedApy} 
            userStake={userStake}
          />
        </div>
      </Suspense>
      
      {connected && userAccountAddress ? (
        <Suspense fallback={<WidgetSkeleton height="h-64" />}>
          <StakeUnstakeControls 
            account={userAccountAddress} 
            onTransactionSuccess={fetchUserStake} 
            userStake={userStake} 
          />
        </Suspense>
      ) : (
        <div className="text-center w-full bg-white/5 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)]">
          <div className="flex justify-center mb-4">
            <Wallet size={32} className="text-purple-400" />
          </div>
          <h2 className="text-2xl font-semibold mb-3 text-gray-100">Ready to Earn Aptos Staking Rewards?</h2>
          <p className="text-base text-zinc-300 mb-4">Connect your Aptos wallet to get started. It's the first step to stake your APT, manage your delegation, and start accumulating rewards.</p>
        </div>
      )}
    </div>
  );
}