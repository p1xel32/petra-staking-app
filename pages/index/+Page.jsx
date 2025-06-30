// Файл: pages/index/+Page.jsx

import React, { Suspense } from 'react'; // Убрали все хуки, добавили Suspense
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

import StructuredData from '../../src/components/StructuredData';
import FaqSection from '../../src/components/FaqSection';
import ClientOnly from '../../src/components/ClientOnly';
import { AlertTriangle } from 'lucide-react';

// ✅ КЛЮЧЕВОЕ ИЗМЕНЕНИЕ №1: Динамический импорт
// Мы говорим React: "Загрузи этот компонент только тогда, когда я попрошу".
// Серверный рендерер никогда не попросит, поэтому он не попадет в серверную сборку.
const StakingInterface = React.lazy(() => import('../../src/components/StakingInterface'));

// Это наша заглушка на время загрузки StakingInterface на клиенте
const StakingInterfaceSkeleton = () => (
    <div className="w-full max-w-2xl flex flex-col items-center gap-10">
        <div className="w-full h-96 bg-white/5 backdrop-blur-lg border border-white/20 p-6 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)] animate-pulse" />
        <div className="w-full h-64 bg-white/5 backdrop-blur-lg border border-white/20 p-6 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)] animate-pulse" />
    </div>
);


export default function Page({ serverFetchedPoolInfo, serverFetchedApy, error }) {

  const pageUrl = "https://aptcore.one/";
  const pageTitle = "aptcore.one: Secure & Transparent Aptos (APT) Staking Platform";
  const pageDescription = "Stake your Aptos (APT) with aptcore.one. We offer transparent, secure Aptos staking with clear explanations of rewards, lock-ups (currently ~14 days), and the current 'no slashing' environment. Empower your Aptos journey.";
  const ogImageUrl = "https://aptcore.one/og-image.png";
  const twitterImageUrl = "https://aptcore.one/twitter-image.png";
  const organizationLogoUrl = "https://aptcore.one/aptcore-logo.svg";

  const commissionBps = Number(serverFetchedPoolInfo?.operator_commission_percentage ?? 0);
  const netApy = (serverFetchedApy && serverFetchedPoolInfo) ? (serverFetchedApy * (1 - (commissionBps / 10000))) : null;
  const commissionDisplay = commissionBps / 100;

  const mainPageSchema = {
    "@context": "https://schema.org", "@type": "InvestmentOrDeposit", "name": "Aptos (APT) Staking on aptcore.one",
    "description": "Stake your Aptos (APT) tokens with aptcore.one to earn rewards. Aptos staking features auto-compounding rewards, a lock-up period (currently ~14 days, check terms), and currently has no slashing penalties implemented on the network. Secure your APT and participate in the Aptos network with a platform committed to transparency and user education.",
    "currency": "APT", "url": pageUrl, "amount": { "@type": "MonetaryAmount", "minValue": 11 },
    "annualPercentageRate": { "@type": "QuantitativeValue", "value": netApy ? netApy.toFixed(2) : "7.0", "unitText": "%", "description": "Estimated Annual Percentage Yield (APY). This value is subject to change based on network conditions and aptcore.one terms. Rewards auto-compound. Please check current rates before staking." },
    "feesAndCommissionsSpecification": { "@type": "CompoundPriceSpecification", "name": "aptcore.one Staking Commission", "description": `A commission of ${commissionDisplay}% is taken from staking rewards.`, "priceType": "CommissionFee" },
    "provider": { "@type": "Organization", "name": "aptcore.one", "url": "https://aptcore.one", "logo": organizationLogoUrl },
    "investmentType": "Staking", "termsAndConditions": "https://aptcore.one/blog/legal/terms", "riskDisclosure": "https://aptcore.one/blog/legal/disclaimer"
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
          {/* ✅ КЛЮЧЕВОЕ ИЗМЕНЕНИЕ №2: Оборачиваем ClientOnly в Suspense */}
          {/* Suspense нужен для React.lazy. Он покажет заглушку, пока компонент грузится. */}
          <Suspense fallback={<StakingInterfaceSkeleton />}>
            <ClientOnly>
              <StakingInterface 
                serverFetchedPoolInfo={serverFetchedPoolInfo} 
                serverFetchedApy={serverFetchedApy}
              />
            </ClientOnly>
          </Suspense>
        </div>
      </div>
      
      <FaqSection />
    </>
  );
}