import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Info, Loader2, Settings, BarChart2, CalendarDays } from 'lucide-react';
import LockupInputControls from './components/LockupInputControls';
import LockupTimelineDisplay from './components/LockupTimelineDisplay';
import NetworkInfoDisplay from './components/NetworkInfoDisplay';
import LockupDisclaimer from './components/LockupDisclaimer';
import LockupFAQ from './components/LockupFAQ';
import { usePageContext } from '../../../../renderer/usePageContext.jsx';

const Loader = ({ text }) => (
  <div className="flex flex-col items-center justify-center py-10 text-center">
    <Loader2 size={32} className="animate-spin text-purple-400" />
    <p className="text-zinc-300 mt-4 text-base">{text}</p>
  </div>
);

const SectionHeader = ({ icon: Icon, title }) => (
    <div className="flex items-center justify-center text-center mb-6">
        <Icon size={20} className="text-zinc-400 mr-3" />
        <h3 className="text-xl font-semibold text-zinc-200 tracking-tight">{title}</h3>
    </div>
);

const TARGET_VALIDATOR_POOL_ADDRESS = '0xf747e3a6282cc0dee1c89239c529b039c64fe48e88b50e5cedd40e9c094800bb';

export default function Page() {
  const { t } = useTranslation();
  const pageContext = usePageContext();
  const { stakingConfig, epochTiming, validatorPoolInfo, error } = pageContext.data || {};

  const [initiationTime, setInitiationTime] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [calculationError, setCalculationError] = useState(null);

  const faqData = t('lockupVisualizerPage.faq.items', { returnObjects: true }) || [];

  const calculateLockupTimeline = useCallback((userInitiationTimeMs) => {
    setCalculationError(null);
    if (!stakingConfig || !epochTiming || !validatorPoolInfo) return;
    try {
      const T_pool_cycle_end_secs = Number(validatorPoolInfo.locked_until_secs);
      const T_funds_become_inactive_secs = T_pool_cycle_end_secs;
      const epoch_interval_micros = BigInt(epochTiming.epochIntervalMicroseconds);
      const current_epoch_start_time_micros = BigInt(new Date(epochTiming.epochStartTime).getTime() * 1000);
      const epoch_interval_secs = Number(epoch_interval_micros / 1_000_000n);
      if (epoch_interval_secs === 0) throw new Error("Epoch interval is zero.");
      const current_epoch_start_secs_ref = Number(current_epoch_start_time_micros / 1_000_000n);
      let T_actual_unlock_secs;
      let relevant_epoch_start_for_unlock_calc = current_epoch_start_secs_ref;
      if (T_funds_become_inactive_secs < current_epoch_start_secs_ref) {
          while (relevant_epoch_start_for_unlock_calc > T_funds_become_inactive_secs) { relevant_epoch_start_for_unlock_calc -= epoch_interval_secs; }
      } else {
          const epochs_passed = Math.floor((T_funds_become_inactive_secs - current_epoch_start_secs_ref) / epoch_interval_secs);
          relevant_epoch_start_for_unlock_calc = current_epoch_start_secs_ref + (epochs_passed * epoch_interval_secs);
      }
      T_actual_unlock_secs = relevant_epoch_start_for_unlock_calc + epoch_interval_secs;
      if (T_actual_unlock_secs < T_funds_become_inactive_secs) { T_actual_unlock_secs += epoch_interval_secs; }
      const nowSecs = Math.floor(Date.now() / 1000);
      const remainingSecondsToFinalUnlock = T_actual_unlock_secs > nowSecs ? T_actual_unlock_secs - nowSecs : 0;
      let remainingTimeStr = t('lockupVisualizerPage.remainingTime.availableNow');
      if (remainingSecondsToFinalUnlock > 0) {
        const d = Math.floor(remainingSecondsToFinalUnlock / (3600 * 24));
        const h = Math.floor(remainingSecondsToFinalUnlock % (3600 * 24) / 3600);
        const m = Math.floor(remainingSecondsToFinalUnlock % 3600 / 60);
        let parts = [];
        if (d > 0) parts.push(`${d}${t('lockupVisualizerPage.remainingTime.daysShort')}`);
        if (h > 0) parts.push(`${h}${t('lockupVisualizerPage.remainingTime.hoursShort')}`);
        if (m > 0 || parts.length === 0) parts.push(`${m}${t('lockupVisualizerPage.remainingTime.minutesShort')}`);
        remainingTimeStr = parts.join(' ');
        if (!remainingTimeStr || remainingTimeStr === `0${t('lockupVisualizerPage.remainingTime.minutesShort')}`) remainingTimeStr = t('lockupVisualizerPage.remainingTime.lessThanAMinute');
      }
      const finalTimeStr = remainingSecondsToFinalUnlock > 0 ? t('lockupVisualizerPage.remainingTime.inFormat', { time: remainingTimeStr }) : t('lockupVisualizerPage.remainingTime.availableNow');
      setTimelineData({ initiationTime: userInitiationTimeMs, poolCycleEndTime: T_funds_become_inactive_secs * 1000, actualUnlockTime: T_actual_unlock_secs * 1000, remainingTime: finalTimeStr });
    } catch (e) {
      setCalculationError(t('lockupVisualizerPage.calculationError', { message: e.message }));
      setTimelineData(null);
    }
  }, [stakingConfig, epochTiming, validatorPoolInfo, t]);

  useEffect(() => { if (initiationTime) { calculateLockupTimeline(initiationTime); } }, [initiationTime, calculateLockupTimeline]);

  const handleVisualize = (timeMs) => { setTimelineData(null); setInitiationTime(timeMs); };
  
  const pageUrl = "https://aptcore.one/tools/aptos-staking-lockup-visualizer";
  const pageTitle = t('lockupVisualizerPage.meta.title');
  const pageDescription = t('lockupVisualizerPage.meta.description');
  const shortTwitterDescription = t('lockupVisualizerPage.meta.twitterDescription');
  const ogImage = "https://aptcore.one/og-image-lockup-visualizer.jpg";
  const twitterImage = "https://aptcore.one/og--image-lockup-visualizer.jpg";
  const webPageSchema = {"@context": "https://schema.org", "@type": "WebPage", "name": pageTitle, "description": pageDescription, "url": pageUrl, "isPartOf": { "@type": "WebSite", "url": "https://aptcore.one", "name": "aptcore.one" }};
  const softwareAppSchema = {"@context": "https://schema.org", "@type": "SoftwareApplication", "name": t('lockupVisualizerPage.schema.software.name'), "applicationCategory": "DataVisualizationApplication", "operatingSystem": "Web", "browserRequirements": "Requires a modern web browser with JavaScript enabled.", "description": t('lockupVisualizerPage.schema.software.description'), "keywords": t('lockupVisualizerPage.schema.software.keywords'), "author": { "@type": "Organization", "name": "aptcore.one", "url": "https://aptcore.one" }, "url": pageUrl, "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }};
  const howToSchema = {"@context": "https://schema.org", "@type": "HowTo", "name": t('lockupVisualizerPage.schema.howTo.name'), "description": t('lockupVisualizerPage.schema.howTo.description'), "step": [
      {"@type": "HowToStep", "name": t('lockupVisualizerPage.schema.howTo.s1.name'), "text": t('lockupVisualizerPage.schema.howTo.s1.text') }, 
      {"@type": "HowToStep", "name": t('lockupVisualizerPage.schema.howTo.s2.name'), "text": t('lockupVisualizerPage.schema.howTo.s2.text', { address: `${TARGET_VALIDATOR_POOL_ADDRESS.substring(0,6)}...${TARGET_VALIDATOR_POOL_ADDRESS.substring(TARGET_VALIDATOR_POOL_ADDRESS.length - 4)}` }) },
      {"@type": "HowToStep", "name": t('lockupVisualizerPage.schema.howTo.s3.name'), "text": t('lockupVisualizerPage.schema.howTo.s3.text') }
  ], "tool": [{"@type": "HowToTool", "name": t('lockupVisualizerPage.schema.howTo.toolName')}]};
  const faqPageSchemaObject = {"@context":"https://schema.org", "@type":"FAQPage", "mainEntity": faqData.map(faq => ({"@type": "Question", "name": String(faq.question || ""), "acceptedAnswer": {"@type": "Answer", "text": String(faq.answer || "")}}))};
  const shouldRenderFaqSchema = !!(faqData && faqData.length > 0 && faqPageSchemaObject.mainEntity && Array.isArray(faqPageSchemaObject.mainEntity) && faqPageSchemaObject.mainEntity.length > 0);

  const renderContent = () => {
    if (error) {
      return (
        <div className="p-4 bg-red-900/40 border border-red-700/60 text-red-300 rounded-lg text-sm flex items-center gap-x-3">
          <AlertTriangle size={20} className="flex-shrink-0" />
          <div><strong className="font-semibold block text-red-200">{t('lockupVisualizerPage.error.title')}</strong><span>{t('lockupVisualizerPage.error.prefix')}{error}</span></div>
        </div>
      );
    }
    if (!stakingConfig || !epochTiming || !validatorPoolInfo) {
      return (<Loader text={t('lockupVisualizerPage.loader.loadingData')} />);
    }
    return (
      <>
        <SectionHeader icon={Settings} title={t('lockupVisualizerPage.sections.initiationTime')} />
        <LockupInputControls onVisualize={handleVisualize} />
        
        <hr className="my-8 border-zinc-800" />
        
        <SectionHeader icon={BarChart2} title={t('lockupVisualizerPage.sections.parameters')} />
        <NetworkInfoDisplay 
            stakingConfig={stakingConfig} 
            epochTiming={epochTiming} 
            validatorPoolInfo={validatorPoolInfo}
        />

        {calculationError && ( <div className="my-4 p-3 bg-red-900/40 border-red-700/60 text-red-300 rounded-lg"> {calculationError} </div> )}
        
        {timelineData && !calculationError && ( 
          <>
            <hr className="my-8 border-zinc-800" />
            <SectionHeader icon={CalendarDays} title={t('lockupVisualizerPage.sections.timeline')} />
            <LockupTimelineDisplay timelineData={timelineData} />
          </>
        )}

        {!timelineData && !calculationError && !initiationTime && (
           <>
             <hr className="my-8 border-zinc-800" />
             <div className="text-center text-zinc-400 text-sm px-4">
                <Info size={24} className="mx-auto mb-3 text-purple-400"/>
                <p>{t('lockupVisualizerPage.prompt.description')}</p>
             </div>
           </>
        )}
      </>
    );
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:site_name" content="aptcore.one" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={pageUrl} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={shortTwitterDescription} />
        <meta name="twitter:image" content={twitterImage} />
        <script type="application/ld+json">{JSON.stringify(webPageSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(softwareAppSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(howToSchema)}</script>
        {shouldRenderFaqSchema && (<script type="application/ld+json">{JSON.stringify(faqPageSchemaObject)}</script>)}
      </Helmet>
      
      <div className="w-full max-w-4xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-zinc-100 tracking-tight mb-4">{t('lockupVisualizerPage.hero.title')}</h1>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">{t('lockupVisualizerPage.hero.description')}</p>
            <p className="mt-4 text-sm text-zinc-500">
              {t('lockupVisualizerPage.hero.validatorInfo')} 
              <strong className="text-purple-400 block break-all mt-1 font-mono">{TARGET_VALIDATOR_POOL_ADDRESS}</strong>
            </p>
        </div>

        <div className="w-full rounded-3xl bg-[#0d0d1f]/70 backdrop-blur-xl border border-purple-600 p-8 sm:p-10 shadow-[0_0_20px_rgba(168,85,247,0.25)]">
          {renderContent()}
        </div>

        <div className="mt-16 sm:mt-24">
          <LockupFAQ faqData={faqData} />
          <hr className="my-12 border-zinc-800" />
          <LockupDisclaimer />
        </div>
      </div>
    </>
  );
}