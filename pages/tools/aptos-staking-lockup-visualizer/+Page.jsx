// pages/tools/aptos-staking-lockup-visualizer/+Page.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { AlertTriangle, Info, Loader2, Settings, BarChart2, CalendarDays } from 'lucide-react';

import LockupInputControls from './components/LockupInputControls';
import LockupTimelineDisplay from './components/LockupTimelineDisplay';
import NetworkInfoDisplay from './components/NetworkInfoDisplay';
import LockupDisclaimer from './components/LockupDisclaimer';
import LockupFAQ from './components/LockupFAQ';

// Кастомный компонент для загрузки
const Loader = ({ text }) => (
  <div className="flex flex-col items-center justify-center py-10 text-center">
    <Loader2 size={32} className="animate-spin text-purple-400" />
    <p className="text-zinc-300 mt-4 text-base">{text}</p>
  </div>
);

// Кастомный компонент для заголовка секции ВНУТРИ карточки
const SectionHeader = ({ icon: Icon, title }) => (
    <div className="flex items-center justify-center text-center mb-6">
        <Icon size={20} className="text-zinc-400 mr-3" />
        <h3 className="text-xl font-semibold text-zinc-200 tracking-tight">{title}</h3>
    </div>
);

const TARGET_VALIDATOR_POOL_ADDRESS = '0xf747e3a6282cc0dee1c89239c529b039c64fe48e88b50e5cedd40e9c094800bb';

const hardcodedFaqData = [
    { question: "How does the Aptos staking lock-up period work?", answer: "When you stake Aptos, your tokens are typically locked for a recurring period (currently around 14 days). If you decide to unstake, your APT becomes available after the current lock-up cycle of your chosen validator pool ends, and then fully withdrawable after the network processes it at an epoch boundary." },
    { question: "What does this visualizer show?", answer: `This tool helps you estimate the unstaking timeline for Aptos (APT) tokens. It considers the specific lock-up cycle of the validator at ${TARGET_VALIDATOR_POOL_ADDRESS.substring(0,6)}...${TARGET_VALIDATOR_POOL_ADDRESS.substring(TARGET_VALIDATOR_POOL_ADDRESS.length - 4)} and Aptos network epoch timings.` },
    { question: "Why are 'Pool Cycle Ends' and 'Funds Available' different times?", answer: "Your funds are tied to the validator's lockup cycle. They become inactive (ready for withdrawal processing) when this cycle ends. The final 'Funds Available' time is when this withdrawal is processed by the Aptos network, which is aligned to the end of a network epoch." }
];

export default function Page({ stakingConfig, epochTiming, validatorPoolInfo, error }) {
  const [initiationTime, setInitiationTime] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [calculationError, setCalculationError] = useState(null);

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
      let remainingTimeStr = "Available now";
      if (remainingSecondsToFinalUnlock > 0) {
        const d = Math.floor(remainingSecondsToFinalUnlock / (3600 * 24));
        const h = Math.floor(remainingSecondsToFinalUnlock % (3600 * 24) / 3600);
        const m = Math.floor(remainingSecondsToFinalUnlock % 3600 / 60);
        let parts = [];
        if (d > 0) parts.push(`${d}d`);
        if (h > 0) parts.push(`${h}h`);
        if (m > 0 || parts.length === 0) parts.push(`${m}m`);
        remainingTimeStr = parts.join(' ');
        if (!remainingTimeStr || remainingTimeStr === "0m") remainingTimeStr = "<1m";
      }
      setTimelineData({ initiationTime: userInitiationTimeMs, poolCycleEndTime: T_funds_become_inactive_secs * 1000, actualUnlockTime: T_actual_unlock_secs * 1000, remainingTime: remainingSecondsToFinalUnlock > 0 ? `in ~${remainingTimeStr}` : "Available now" });
    } catch (e) {
      setCalculationError(`Calculation error: ${e.message}`);
      setTimelineData(null);
    }
  }, [stakingConfig, epochTiming, validatorPoolInfo]);

  useEffect(() => {
    if (initiationTime) {
      calculateLockupTimeline(initiationTime);
    }
  }, [initiationTime, calculateLockupTimeline]);

  const handleVisualize = (timeMs) => {
    setTimelineData(null); 
    setInitiationTime(timeMs);
  };
  
  const pageUrl = "https://aptcore.one/tools/aptos-staking-lockup-visualizer";
  const pageTitle = "Aptos Staking Lock-Up Visualizer: See Your APT Unstake Timeline | aptcore.one";
  const pageDescription = "Understand Aptos's staking lock-up (currently ~14 days). Use aptcore.one's visualizer to estimate when your staked APT will be available after unstaking.";
  const shortTwitterDescription = "Visualize Aptos (APT) staking lock-up periods and unstake timelines with aptcore.one's tool. See when your APT becomes available.";
  const ogImage = "https://aptcore.one/og-image-lockup-visualizer.jpg";
  const twitterImage = "https://aptcore.one/og-image-lockup-visualizer.jpg";
  const webPageSchema = {"@context": "https://schema.org", "@type": "WebPage", "name": pageTitle, "description": pageDescription, "url": pageUrl, "isPartOf": { "@type": "WebSite", "url": "https://aptcore.one", "name": "aptcore.one" }};
  const softwareAppSchema = {"@context": "https://schema.org", "@type": "SoftwareApplication", "name": "Aptos Staking Lock-Up Visualizer: See Your APT Unstake Timeline", "applicationCategory": "DataVisualizationApplication", "operatingSystem": "Web", "browserRequirements": "Requires a modern web browser with JavaScript enabled.", "description": "An interactive tool by aptcore.one to visualize Aptos (APT) staking lock-up periods and estimate when your funds will be available after unstaking. Understand the Aptos lock-up cycle (currently around 14 days) and plan your staking strategy.", "keywords": "Aptos staking lock up visualizer, APT unstaking period tool, Aptos 14 day lockup explained tool, visualize aptos unstake time, aptos staking release date calculator, when can I withdraw my staked aptos tool, aptos lockup calendar, aptcore.one", "author": { "@type": "Organization", "name": "aptcore.one", "url": "https://aptcore.one" }, "url": pageUrl, "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }};
  const howToSchema = {"@context": "https://schema.org", "@type": "HowTo", "name": "How to Use the Aptos Staking Lock-Up Visualizer to See Your APT Unstake Timeline", "description": "Visualize your Aptos (APT) unstaking timeline with aptcore.one. Enter your unstake initiation time to see the estimated unlock schedule based on validator and network data.", "step": [{"@type": "HowToStep", "name": "Select Unstake Initiation Time", "text": "Choose the date and time you plan to initiate (or did initiate) your unstake request. You can use the date/time picker or click 'Visualize Unstaking From Now' for the current time."}, {"@type": "HowToStep", "name": "Review Network & Validator Information", "text": "The tool displays current Aptos network staking configurations (like the ~14 day lockup cycle), epoch timing, and lock-up details specific to the validator pool at " + TARGET_VALIDATOR_POOL_ADDRESS.substring(0,6) + "..." + TARGET_VALIDATOR_POOL_ADDRESS.substring(TARGET_VALIDATOR_POOL_ADDRESS.length - 4) + "."}, {"@type": "HowToStep", "name": "Analyze Your Unstaking Timeline", "text": "The visualizer will generate and display a timeline. This shows when the validator's current pool lockup cycle is estimated to end and the final estimated time your Aptos (APT) funds will become available for withdrawal, aligned with Aptos network epochs."}], "tool": [{"@type": "HowToTool", "name": "Aptos Staking Lock-Up Visualizer on aptcore.one"}]};
  const faqPageSchemaObject = {"@context":"https://schema.org", "@type":"FAQPage", "mainEntity": hardcodedFaqData.map(faq => ({"@type": "Question", "name": String(faq.question || ""), "acceptedAnswer": {"@type": "Answer", "text": String(faq.answer || "")}}))};
  const shouldRenderFaqSchema = !!(hardcodedFaqData && hardcodedFaqData.length > 0 && faqPageSchemaObject.mainEntity && Array.isArray(faqPageSchemaObject.mainEntity) && faqPageSchemaObject.mainEntity.length > 0);

  const renderContent = () => {
    if (error) {
      return (
        <div className="p-4 bg-red-900/40 border border-red-700/60 text-red-300 rounded-lg text-sm flex items-center gap-x-3">
          <AlertTriangle size={20} className="flex-shrink-0" />
          <div><strong className="font-semibold block text-red-200">Error</strong><span>{error}</span></div>
        </div>
      );
    }
    if (!stakingConfig || !epochTiming || !validatorPoolInfo) {
      return (<Loader text="Loading Network & Validator Data..." />);
    }
    return (
      <>
        <SectionHeader icon={Settings} title="Set Unstake Initiation Time" />
        <LockupInputControls onVisualize={handleVisualize} />
        
        <hr className="my-8 border-zinc-800" />
        
        <SectionHeader icon={BarChart2} title="Network & Staking Parameters" />
        <NetworkInfoDisplay 
            stakingConfig={stakingConfig} 
            epochTiming={epochTiming} 
            validatorPoolInfo={validatorPoolInfo}
        />

        {calculationError && (
          <div className="my-4 p-3 bg-red-900/40 border-red-700/60 text-red-300 rounded-lg">
            {calculationError}
          </div>
        )}
        
        {timelineData && !calculationError && ( 
          <>
            <hr className="my-8 border-zinc-800" />
            <SectionHeader icon={CalendarDays} title="Your Estimated Timeline" />
            <LockupTimelineDisplay timelineData={timelineData} />
          </>
        )}

        {/* ✅ ИСПРАВЛЕННЫЙ БЛОК */}
        {!timelineData && !calculationError && !initiationTime && (
           <>
             <hr className="my-8 border-zinc-800" />
             <div className="text-center text-zinc-400 text-sm px-4">
                <Info size={24} className="mx-auto mb-3 text-purple-400"/>
                <p>Select an unstake initiation time or click "Visualize From Now" to see the estimated timeline.</p>
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
            <h1 className="text-4xl md:text-5xl font-bold text-zinc-100 tracking-tight mb-4">{pageTitle.split(' | ')[0]}</h1>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">{pageDescription}</p>
            <p className="mt-4 text-sm text-zinc-500">
              This tool visualizes unstaking timelines for the validator pool at: 
              <strong className="text-purple-400 block break-all mt-1 font-mono">{TARGET_VALIDATOR_POOL_ADDRESS}</strong>
            </p>
        </div>

        <div className="w-full rounded-3xl bg-[#0d0d1f]/70 backdrop-blur-xl border border-purple-600 p-8 sm:p-10 shadow-[0_0_20px_rgba(168,85,247,0.25)]">
          {renderContent()}
        </div>

        <div className="mt-16 sm:mt-24">
          <LockupFAQ faqData={hardcodedFaqData} />
          <hr className="my-12 border-zinc-800" />
          <LockupDisclaimer />
        </div>
      </div>
    </>
  );
}