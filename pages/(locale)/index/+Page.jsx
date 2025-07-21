import React, { Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import StructuredData from '@/components/StructuredData';
import FaqSection from '@/components/FaqSection';
import ClientOnly from '@/components/ClientOnly';
import { AlertTriangle } from 'lucide-react';
import StakingInterface from '@/components/StakeUnstakeControls/StakingInterface';
import { usePageContext } from '../../../renderer/usePageContext.jsx';

const StakingInterfaceSkeleton = () => (
    <div className="w-full max-w-7xl grid grid-cols-1 gap-8">
        <div className="w-full min-h-[700px] bg-black/20 border border-white/10 rounded-3xl animate-pulse" />
        <div className="w-full min-h-[700px] bg-black/20 border border-white/10 rounded-3xl animate-pulse" />
    </div>
);

export default function Page() {
  const { t } = useTranslation();
  const pageContext = usePageContext();
  const { serverFetchedPoolInfo, serverFetchedApy, error } = pageContext.data || {};

  const pageUrl = "https://aptcore.one/";
  const ogImageUrl = "https://aptcore.one/og-image.png";

  const pageTitle = t('homePage.meta.title');
  const pageDescription = t('homePage.meta.description');

  const commissionBps = Number(serverFetchedPoolInfo?.operator_commission_percentage ?? 0);
  const netApy = (serverFetchedApy && serverFetchedPoolInfo) ? (serverFetchedApy * (1 - (commissionBps / 10000))) : 0;
  
  const mainPageSchema = {
    "@context": "https://schema.org",
    "@type": "InvestmentOrDeposit",
    "name": t('homePage.schema.name'),
    "description": pageDescription,
    "currency": "APT",
    "url": pageUrl,
    "amount": { "@type": "MonetaryAmount", "minValue": 11 },
    "annualPercentageRate": {
      "@type": "QuantitativeValue",
      "value": netApy ? netApy.toFixed(2) : "7.0",
      "unitText": "%"
    }
  };

   if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <div className="w-full max-w-md mx-auto text-center p-8 bg-red-900/40 border border-red-700/60 rounded-lg">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
            <h2 className="mt-4 text-xl font-semibold text-white">{t('homePage.error.title')}</h2>
            <p className="mt-2 text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!serverFetchedPoolInfo) {
    return <StakingInterfaceSkeleton />;
  }

  return (
    <>
        <Helmet>
            <title>{pageTitle}</title>
            <meta name="description" content={pageDescription} />
            <link rel="canonical" href={pageUrl} />
            <meta property="og:title" content={pageTitle} />
            <meta property="og:description" content={pageDescription} />
            <meta property="og:image" content={ogImageUrl} />
            <meta property="og:type" content="website" />
            <meta name="twitter:card" content="summary_large_image" />
        </Helmet>
        
        <StructuredData data={mainPageSchema} />
        
        <div className="flex flex-col items-center px-4 py-10">
            <motion.div 
                initial={{ opacity: 0, y: -20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.7 }}
                className="w-full max-w-4xl text-center my-16 md:my-24"
            >
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#2196f3] via-[#7b61ff] to-[#b44aff] py-2">
                    {t('homePage.hero.mainHeading')}
                </h1>
                <h2 className="text-4xl md:text-6xl font-semibold tracking-tighter text-zinc-200 leading-normal mb-6">
                    {t('homePage.hero.subHeading')}
                </h2>
                <p className="text-lg text-zinc-400">
                    {t('homePage.hero.details', { apy: netApy.toFixed(2) })}
                </p>
            </motion.div>
            
            <div className="w-full max-w-4xl flex flex-col gap-8" id="stake-section">
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