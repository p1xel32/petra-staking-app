// src/pages/MainStakingPage/MainStakingPage.jsx
import React, { useState, useCallback, Suspense, lazy } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { motion } from 'framer-motion';
import { Helmet } from '@/lib/helmet';

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

  // --- SEO Meta Data & Schema Variables ---
  const pageUrl = "https://aptcore.one/";
  const pageTitle = "aptcore.one: Secure & Transparent Aptos (APT) Staking Platform";
  const pageDescription = "Stake your Aptos (APT) with aptcore.one. We offer transparent, secure Aptos staking with clear explanations of rewards, lock-ups (currently ~14 days), and the current 'no slashing' environment. Empower your Aptos journey.";
  const ogImageUrl = "https://aptcore.one/og-image.jpg";
  const twitterImageUrl = "https://aptcore.one/twitter-image.jpg";
  const organizationLogoUrl = "https://aptcore.one/aptcore-logo.svg";

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
      "value": "7.0", 
      "unitText": "%",
      "description": "Estimated Annual Percentage Yield (APY). This value is subject to change based on network conditions and aptcore.one terms. Rewards auto-compound. Please check current rates before staking."
    },
    "feesAndCommissionsSpecification": {
      "@type": "CompoundPriceSpecification",
      "name": "aptcore.one Staking Commission",
      "description": "Details of aptcore.one's commission on Aptos staking rewards can be found in our terms or a dedicated fees section.",
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

  return (
    <>
      <Helmet>
        <title>{String(pageTitle)}</title>
        <meta name="description" content={String(pageDescription)} />
        <link rel="canonical" href={String(pageUrl)} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={String(pageUrl)} />
        <meta property="og:title" content={String(pageTitle)} />
        <meta property="og:description" content={String(pageDescription)} />
        <meta property="og:image" content={String(ogImageUrl)} /> 
        <meta property="og:site_name" content="aptcore.one" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={String(pageUrl)} />
        <meta name="twitter:title" content={String(pageTitle)} />
        <meta name="twitter:description" content={String(pageDescription)} />
        <meta name="twitter:image" content={String(twitterImageUrl)} /> 
      </Helmet>
      <StructuredData data={mainPageSchema} />

      <div className="flex flex-col items-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-3xl text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight text-purple-400">
            aptcore.one: <span className="text-gray-100">Secure & Transparent Aptos (APT) Staking</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-300 leading-relaxed">
            {pageDescription}
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
            </motion.div>
          )}
        </div>
      </div>
      <FaqSection /> {/* Этот компонент рендерит свою FAQPage схему и FAQ контент */}
    </>
  );
};

export default MainStakingPage;