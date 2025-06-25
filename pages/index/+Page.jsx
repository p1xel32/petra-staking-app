// File: pages/index/+Page.jsx

import React, { useState, useCallback, Suspense, useEffect, lazy } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

import StructuredData from '../../src/components/StructuredData';
import FaqSection from '../../src/components/FaqSection';
import ValidatorInfo from '../../src/components/ValidatorInfo';
import { AlertTriangle } from 'lucide-react';

const WidgetSkeleton = ({ height = 'h-48' }) => (
  <div className={`w-full bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)] animate-pulse ${height}`}>
    <div className="h-6 bg-gray-500/30 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-gray-500/30 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-gray-500/30 rounded w-5/6"></div>
  </div>
);

const StakeUnstakeControls = lazy(() => import('../../src/components/StakeUnstakeControls'));

export default function Page({ serverFetchedPoolInfo, serverFetchedApy, error }) {
   console.log("4. [Page.jsx] Пропсы, полученные компонентом страницы:", {
    serverFetchedPoolInfo,
    serverFetchedApy,
    error,
    });

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
      const response = await fetch(`/api/getUserStake?account=${userAccountAddress}&pool=${serverFetchedPoolInfo.poolAddress}`);
      if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
      const data = await response.json();
      setUserStake({ ...data, isFetching: false });
    } catch (error) {
      console.error("Error fetching user stake via API:", error);
      setUserStake({ active: 0, inactive: 0, pendingInactive: 0, isFetching: false });
    }
  }, [userAccountAddress, serverFetchedPoolInfo?.poolAddress]);

  useEffect(() => {
    if (connected && userAccountAddress) {
      fetchUserStake();
    } else {
      setUserStake({ active: 0, inactive: 0, pendingInactive: 0, isFetching: false });
    }
  }, [connected, userAccountAddress, fetchUserStake]);


  const pageUrl = "https://aptcore.one/";
  const pageTitle = "aptcore.one: Secure & Transparent Aptos (APT) Staking Platform";
  const pageDescription = "Stake your Aptos (APT) with aptcore.one. We offer transparent, secure Aptos staking with clear explanations of rewards, lock-ups (currently ~14 days), and the current 'no slashing' environment. Empower your Aptos journey.";
  const ogImageUrl = "https://aptcore.one/og-image.png";
  const twitterImageUrl = "https://aptcore.one/twitter-image.png";
  const organizationLogoUrl = "https://aptcore.one/aptcore-logo.svg";

  const commissionBps = serverFetchedPoolInfo?.operator_commission_percentage ?? 0;
  const netApy = (serverFetchedApy && serverFetchedPoolInfo) ? (serverFetchedApy * (1 - (commissionBps / 10000))) : null;
  const commissionDisplay = commissionBps / 100;

  const mainPageSchema = {
    "@context": "https://schema.org",
    "@type": "InvestmentOrDeposit",
    "name": "Aptos (APT) Staking on aptcore.one",
    "description": "Stake your Aptos (APT) tokens with aptcore.one to earn rewards. Aptos staking features auto-compounding rewards, a lock-up period (currently ~14 days, check terms), and currently has no slashing penalties implemented on the network. Secure your APT and participate in the Aptos network with a platform committed to transparency and user education.",
    "currency": "APT",
    "url": pageUrl,
    "amount": {
      "@type": "MonetaryAmount",
      "minValue": 11
    },
    "annualPercentageRate": {
      "@type": "QuantitativeValue",
      "value": netApy ? netApy.toFixed(2) : "7.0",
      "unitText": "%",
      "description": "Estimated Annual Percentage Yield (APY). This value is subject to change based on network conditions and aptcore.one terms. Rewards auto-compound. Please check current rates before staking."
    },
    "feesAndCommissionsSpecification": {
      "@type": "CompoundPriceSpecification",
      "name": "aptcore.one Staking Commission",
      "description": `A commission of ${commissionDisplay}% is taken from staking rewards.`,
      "priceType": "CommissionFee"
    },
    "provider": {
      "@type": "Organization",
      "name": "aptcore.one",
      "url": "https://aptcore.one",
      "logo": organizationLogoUrl
    },
    "investmentType": "Staking",
    "termsAndConditions": "https://aptcore.one/blog/legal/terms",
    "riskDisclosure": "https://aptcore.one/blog/legal/disclaimer"
  };

  const renderControls = () => {
    if (!isMounted) {
      return (
        <motion.div key="unconnected-placeholder" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="text-center w-full bg-white/5 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)]">
          <h2 className="text-2xl font-semibold mb-3 text-gray-100">Ready to Earn Aptos Staking Rewards?</h2>
          <p className="text-base text-zinc-300 mb-4">Connect your Aptos wallet to aptcore.one. It's the first step to stake your APT, manage your delegation with our validator pool, and start accumulating Aptos staking rewards. We support a variety of Aptos wallets.</p>
        </motion.div>
      );
    }
    if (connected && userAccountAddress) {
      return (
        <Suspense key="connected-view" fallback={<WidgetSkeleton height="h-64" />}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="w-full">
            <StakeUnstakeControls account={userAccountAddress} onTransactionSuccess={fetchUserStake} />
          </motion.div>
        </Suspense>
      );
    } else {
      return (
        <motion.div key="unconnected-view" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="text-center w-full bg-white/5 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)]">
          <h2 className="text-2xl font-semibold mb-3 text-gray-100">Ready to Earn Aptos Staking Rewards?</h2>
          <p className="text-base text-zinc-300 mb-4">Connect your Aptos wallet to aptcore.one. It's the first step to stake your APT, manage your delegation with our validator pool, and start accumulating Aptos staking rewards. We support a variety of Aptos wallets.</p>
        </motion.div>
      );
    }
  };

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <div className="w-full max-w-md mx-auto text-center p-8 bg-red-900/40 border border-red-700/60 rounded-lg">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
            <h2 className="mt-4 text-xl font-semibold text-white">Failed to Load Data</h2>
            <p className="mt-2 text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={twitterImageUrl} />
      </Helmet>
      <StructuredData data={mainPageSchema} />
      <div className="flex flex-col items-center px-4 py-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="w-full max-w-3xl text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight text-purple-400">
                aptcore.one: <span className="text-gray-100">Secure & Transparent Aptos (APT) Staking</span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-300 leading-relaxed">{pageDescription}</p>
        </motion.div>
        <div className="w-full max-w-2xl flex flex-col items-center gap-10" id="stake-section">
            <Suspense fallback={<WidgetSkeleton height="h-48" />}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="w-full">
                    <ValidatorInfo poolInfo={serverFetchedPoolInfo} apy={serverFetchedApy} account={userAccountAddress} userStake={userStake} />
                </motion.div>
            </Suspense>
            
            {renderControls()}
        </div>
      </div>
      <FaqSection />
    </>
  );
}