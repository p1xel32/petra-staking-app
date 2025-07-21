import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useTranslation } from 'react-i18next'; 
import { Wallet } from 'lucide-react';
import ValidatorInfo from '@/components/ValidatorInfo';
import { EpochInfoProvider } from '@/context/EpochInfoContext.jsx';

const WidgetSkeleton = ({ height = 'h-48' }) => ( <div className={`w-full bg-zinc-900/50 border-zinc-800 rounded-2xl animate-pulse ${height}`}>...</div> );

const StakeUnstakeControls = lazy(() => import('@/components/StakeUnstakeControls'));


export default function IndexPageContent({ serverFetchedPoolInfo, serverFetchedApy }) {
  const { t } = useTranslation(); 
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
    if (connected && userAccountAddress) {
        fetchUserStake();
    }
  }, [connected, userAccountAddress, fetchUserStake]);

  return (
    <EpochInfoProvider>
      <div className="w-full max-w-2xl flex flex-col items-center gap-10" id="stake-section">
        <Suspense fallback={<WidgetSkeleton height="h-48" />}>
          <div className="w-full">
            <ValidatorInfo
              poolInfo={serverFetchedPoolInfo}
              apy={serverFetchedApy}
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
            {/* Translated Strings */}
            <h2 className="text-2xl font-semibold mb-3 text-gray-100">{t('indexPage.connectPrompt.title')}</h2>
            <p className="text-base text-zinc-300 mb-4">{t('indexPage.connectPrompt.description')}</p>
          </div>
        )}
      </div>
    </EpochInfoProvider>
  );
}