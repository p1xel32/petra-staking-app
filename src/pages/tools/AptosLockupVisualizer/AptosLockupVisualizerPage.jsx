// src/pages/tools/AptosLockupVisualizer/AptosLockupVisualizerPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Spin, Divider } from 'antd';
import { Helmet, HelmetProvider } from 'react-helmet-async'; 
import { getStakingConfig, getEpochTiming, getValidatorPoolInfo } from '../../../services/aptosService';
import LockupInputControls from './components/LockupInputControls';
import LockupTimelineDisplay from './components/LockupTimelineDisplay';
import NetworkInfoDisplay from './components/NetworkInfoDisplay';
import LockupDisclaimer from './components/LockupDisclaimer';
import LockupFAQ from './components/LockupFAQ';
import { AlertTriangle, Info } from 'lucide-react';

const { Title, Paragraph } = Typography;

const TARGET_VALIDATOR_POOL_ADDRESS = '0xf747e3a6282cc0dee1c89239c529b039c64fe48e88b50e5cedd40e9c094800bb';

const hardcodedFaqData = [
  {
    question: "How does the Aptos staking lock-up period work?",
    answer: "When you stake Aptos, your tokens are typically locked for a recurring period (currently around 14 days). If you decide to unstake, your APT becomes available after the current lock-up cycle of your chosen validator pool ends, and then fully withdrawable after the network processes it at an epoch boundary."
  },
  {
    question: "What does this visualizer show?",
    answer: `This tool helps you estimate the unstaking timeline for Aptos (APT) tokens. It considers the specific lock-up cycle of the validator at ${TARGET_VALIDATOR_POOL_ADDRESS.substring(0,6)}...${TARGET_VALIDATOR_POOL_ADDRESS.substring(TARGET_VALIDATOR_POOL_ADDRESS.length - 4)} and Aptos network epoch timings.`
  },
  {
    question: "Why are 'Pool Cycle Ends' and 'Funds Available' different times?",
    answer: "Your funds are tied to the validator's lockup cycle. They become inactive (ready for withdrawal processing) when this cycle ends. The final 'Funds Available' time is when this withdrawal is processed by the Aptos network, which is aligned to the end of a network epoch."
  }
];

const AptosLockupVisualizerPage = () => {
  const [initiationTime, setInitiationTime] = useState(null);
  const [stakingConfig, setStakingConfig] = useState(null);
  const [epochTiming, setEpochTiming] = useState(null);
  const [validatorPoolInfo, setValidatorPoolInfo] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [calculationError, setCalculationError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setFetchError(null);
      setCalculationError(null);
      try {
        const [config, timingInfo, poolInfo] = await Promise.all([
          getStakingConfig(),
          getEpochTiming(),
          getValidatorPoolInfo(TARGET_VALIDATOR_POOL_ADDRESS)
        ]);

        if (!config || config.recurring_lockup_duration_secs === undefined) {
          throw new Error("StakingConfig data is incomplete.");
        }
        if (!timingInfo || !timingInfo.epochIntervalMicroseconds || !timingInfo.epochStartTime || timingInfo.currentEpoch === undefined || !timingInfo.dataAsOfTimestamp) {
          throw new Error("Epoch timing data is incomplete.");
        }
        if (!poolInfo || poolInfo.locked_until_secs === undefined) {
          throw new Error(`Validator pool info for ${TARGET_VALIDATOR_POOL_ADDRESS} is incomplete.`);
        }
        
        setStakingConfig(config);
        setEpochTiming(timingInfo);
        setValidatorPoolInfo(poolInfo);
      } catch (error) {
        // console.error("LockupVisualizer: Failed to fetch initial data:", error); // Оставляем console.error для ошибок
        setFetchError(`Could not load essential data: ${error.message}. Please try again later.`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const calculateLockupTimeline = useCallback((userInitiationTimeMs) => {
    setCalculationError(null);
    if (!stakingConfig || !epochTiming || !validatorPoolInfo || !userInitiationTimeMs) {
      setCalculationError("Required data is missing for calculation.");
      setTimelineData(null);
      return;
    }
    try {
      const T_init_secs = Math.floor(userInitiationTimeMs / 1000);
      const general_network_lockup_duration_secs = Number(stakingConfig.recurring_lockup_duration_secs);
      let T_pool_cycle_end_secs = Number(validatorPoolInfo.locked_until_secs);
      const T_funds_become_inactive_secs = T_pool_cycle_end_secs;
      const epoch_interval_micros = BigInt(epochTiming.epochIntervalMicroseconds);
      const current_epoch_start_time_micros = BigInt(new Date(epochTiming.epochStartTime).getTime() * 1000);
      const epoch_interval_secs = Number(epoch_interval_micros / 1_000_000n);

      if (epoch_interval_secs === 0) throw new Error("Epoch interval is zero.");
      
      const current_epoch_start_secs_ref = Number(current_epoch_start_time_micros / 1_000_000n);
      let T_actual_unlock_secs;
      let relevant_epoch_start_for_unlock_calc = current_epoch_start_secs_ref;
      if (T_funds_become_inactive_secs < current_epoch_start_secs_ref) {
          while (relevant_epoch_start_for_unlock_calc > T_funds_become_inactive_secs) {
              relevant_epoch_start_for_unlock_calc -= epoch_interval_secs;
          }
      } else {
          const epochs_passed = Math.floor((T_funds_become_inactive_secs - current_epoch_start_secs_ref) / epoch_interval_secs);
          relevant_epoch_start_for_unlock_calc = current_epoch_start_secs_ref + (epochs_passed * epoch_interval_secs);
      }
      T_actual_unlock_secs = relevant_epoch_start_for_unlock_calc + epoch_interval_secs;
      if (T_actual_unlock_secs < T_funds_become_inactive_secs) {
          T_actual_unlock_secs += epoch_interval_secs;
      }

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
      
      setTimelineData({
        initiationTime: userInitiationTimeMs,
        poolCycleEndTime: T_funds_become_inactive_secs * 1000, 
        actualUnlockTime: T_actual_unlock_secs * 1000,
        remainingTime: remainingSecondsToFinalUnlock > 0 ? `in ~${remainingTimeStr}` : "Available now",
        networkRecurringLockupDurationSecs: general_network_lockup_duration_secs,
        calculationEpochParams: {
            epochStartTimeISO: new Date(epochTiming.epochStartTime).toISOString(),
            epochIntervalSeconds: epoch_interval_secs.toString(),
            dataAsOfTimestampISO: new Date(epochTiming.dataAsOfTimestamp).toISOString(),
            currentEpochAtCalc: epochTiming.currentEpoch.toString(),
            validatorPoolAddress: TARGET_VALIDATOR_POOL_ADDRESS,
            poolLockedUntilSecs: T_pool_cycle_end_secs.toString(),
        },
      });
    } catch (error) {
      // console.error("LockupVisualizer: Error during timeline calculation logic:", error); // Оставляем console.error для ошибок
      setCalculationError(`Calculation error: ${error.message}`);
      setTimelineData(null);
    }
  }, [stakingConfig, epochTiming, validatorPoolInfo]);

  useEffect(() => {
    if (initiationTime && stakingConfig && epochTiming && validatorPoolInfo) {
      calculateLockupTimeline(initiationTime);
    }
  }, [initiationTime, stakingConfig, epochTiming, validatorPoolInfo, calculateLockupTimeline]);

  const handleVisualize = async (timeMs) => {
    setIsLoading(true); 
    setFetchError(null); 
    setCalculationError(null);
    setTimelineData(null); 
    setInitiationTime(timeMs); 
    try {
      const freshEpochTiming = await getEpochTiming(); 
      if (!freshEpochTiming || !freshEpochTiming.epochIntervalMicroseconds || 
          !freshEpochTiming.epochStartTime || freshEpochTiming.currentEpoch === undefined ||
          !freshEpochTiming.dataAsOfTimestamp) {
        throw new Error("Failed to load complete up-to-date network epoch timing. Please try again.");
      }
      setEpochTiming(freshEpochTiming); 
    } catch (error) {
      // console.error("LockupVisualizer: Failed to fetch fresh data for visualization:", error); // Оставляем console.error для ошибок
      setFetchError(`Could not get latest data: ${error.message}. Calculation may use older data or fail.`);
    } finally {
      setIsLoading(false); 
    }
  };
  
  const pageUrl = "https://aptcore.one/tools/aptos-staking-lockup-visualizer";
  const pageTitle = "Aptos Staking Lock-Up Visualizer: See Your APT Unstake Timeline | Aptcore.one";
  const pageDescription = "Understand Aptos's staking lock-up (currently ~14 days). Use aptcore.one's visualizer to estimate when your staked APT will be available after unstaking.";
  const shortTwitterDescription = "Visualize Aptos (APT) staking lock-up periods and unstake timelines with Aptcore.one's tool. See when your APT becomes available.";
  const ogImage = "https://aptcore.one/og-image-lockup-visualizer.jpg"; // ОБЯЗАТЕЛЬНО ЗАМЕНИТЕ ЭТОТ URL!
  const twitterImage = "https://aptcore.one/og-image-lockup-visualizer.jpg"; // ОБЯЗАТЕЛЬНО ЗАМЕНИТЕ ЭТОТ URL!

  const webPageSchema = {"@context": "https://schema.org", "@type": "WebPage", "name": pageTitle, "description": pageDescription, "url": pageUrl, "isPartOf": { "@type": "WebSite", "url": "https://aptcore.one", "name": "Aptcore.one" }};
  const softwareAppSchema = {"@context": "https://schema.org", "@type": "SoftwareApplication", "name": "Aptos Staking Lock-Up Visualizer: See Your APT Unstake Timeline", "applicationCategory": "DataVisualizationApplication", "operatingSystem": "Web", "browserRequirements": "Requires a modern web browser with JavaScript enabled.", "description": "An interactive tool by Aptcore.one to visualize Aptos (APT) staking lock-up periods and estimate when your funds will be available after unstaking. Understand the Aptos lock-up cycle (currently around 14 days) and plan your staking strategy.", "keywords": "Aptos staking lock up visualizer, APT unstaking period tool, Aptos 14 day lockup explained tool, visualize aptos unstake time, aptos staking release date calculator, when can I withdraw my staked aptos tool, aptos lockup calendar, aptcore.one", "author": { "@type": "Organization", "name": "Aptcore.one", "url": "https://aptcore.one" }, "url": pageUrl, "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }};
  const howToSchema = {"@context": "https://schema.org", "@type": "HowTo", "name": "How to Use the Aptos Staking Lock-Up Visualizer to See Your APT Unstake Timeline", "description": "Visualize your Aptos (APT) unstaking timeline with Aptcore.one. Enter your unstake initiation time to see the estimated unlock schedule based on validator and network data.", "step": [{"@type": "HowToStep", "name": "Select Unstake Initiation Time", "text": "Choose the date and time you plan to initiate (or did initiate) your unstake request. You can use the date/time picker or click 'Visualize Unstaking From Now' for the current time."}, {"@type": "HowToStep", "name": "Review Network & Validator Information", "text": "The tool displays current Aptos network staking configurations (like the ~14 day lockup cycle), epoch timing, and lock-up details specific to the validator pool at " + TARGET_VALIDATOR_POOL_ADDRESS.substring(0,6) + "..." + TARGET_VALIDATOR_POOL_ADDRESS.substring(TARGET_VALIDATOR_POOL_ADDRESS.length - 4) + "."}, {"@type": "HowToStep", "name": "Analyze Your Unstaking Timeline", "text": "The visualizer will generate and display a timeline. This shows when the validator's current pool lockup cycle is estimated to end and the final estimated time your Aptos (APT) funds will become available for withdrawal, aligned with Aptos network epochs."}], "tool": [{"@type": "HowToTool", "name": "Aptos Staking Lock-Up Visualizer on Aptcore.one"}]};
  
  const faqPageSchemaObject = {
    "@context":"https://schema.org",
    "@type":"FAQPage",
    "mainEntity": (Array.isArray(hardcodedFaqData) && hardcodedFaqData.length > 0) ? hardcodedFaqData.map(faq => ({
        "@type": "Question",
        "name": String(faq.question || ""),
        "acceptedAnswer": {
            "@type": "Answer",
            "text": String(faq.answer || "")
        }
    })) : []
  };

  const shouldRenderFaqSchema = !!(
    !isLoading &&
    !fetchError &&
    hardcodedFaqData && 
    Array.isArray(hardcodedFaqData) && 
    hardcodedFaqData.length > 0 &&
    faqPageSchemaObject.mainEntity &&
    Array.isArray(faqPageSchemaObject.mainEntity) &&
    faqPageSchemaObject.mainEntity.length > 0
  );

  return (
    <>
      <Helmet>
        <title>{String(pageTitle || 'Aptos Lockup Visualizer | Aptcore.one')}</title>
        <meta name="description" content={String(pageDescription || 'Visualize Aptos staking lockups.')} />
        <link rel="canonical" href={String(pageUrl || 'https://aptcore.one/tools/aptos-staking-lockup-visualizer')} />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content={String(pageUrl || '')} />
        <meta property="og:title" content={String(pageTitle || '')} />
        <meta property="og:description" content={String(pageDescription || '')} />
        <meta property="og:image" content={String(ogImage || '')} />
        <meta property="og:site_name" content="Aptcore.one" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={String(pageUrl || '')} />
        <meta name="twitter:title" content={String(pageTitle || '')} />
        <meta name="twitter:description" content={String(shortTwitterDescription || '')} />
        <meta name="twitter:image" content={String(twitterImage || '')} />

        <script type="application/ld+json">{JSON.stringify(webPageSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(softwareAppSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(howToSchema)}</script>
        
        {shouldRenderFaqSchema && (
          <script type="application/ld+json">
            {JSON.stringify(faqPageSchemaObject)}
          </script>
        )}
      </Helmet>

      <div className="w-full max-w-3xl mx-auto py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
        <div className="bg-slate-800/70 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl shadow-purple-500/20 p-6 sm:p-10">
          <div className="text-center mb-8 sm:mb-10">
            <Title level={1} className="!text-3xl sm:!text-4xl !font-bold !mb-4 tracking-tight !text-white">
              {pageTitle ? pageTitle.split(' | ')[0] : 'Aptos Staking Lock-Up Visualizer'}
            </Title>
            <Paragraph className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto">
              {pageDescription || 'Visualize your Aptos staking lock-up.'} This tool currently visualizes unstaking timelines for the validator pool at: <strong className="text-purple-300 block break-all mt-1">{TARGET_VALIDATOR_POOL_ADDRESS}</strong>
            </Paragraph>
          </div>

          {isLoading && (<div className="py-10 text-center"><Spin size="large" /><p className="text-slate-300 mt-4 text-base">Loading Network & Validator Data...</p></div>)}
          
          {!isLoading && (fetchError || calculationError) && (
            <div className="mb-6 p-4 bg-red-900/40 border border-red-700/60 text-red-300 rounded-lg text-sm flex items-center gap-x-3">
              <AlertTriangle size={20} className="flex-shrink-0" />
              <div>
                <strong className="font-semibold block text-red-200">Error</strong>
                <span>{fetchError || calculationError}</span>
              </div>
            </div>
          )}

          {!isLoading && !fetchError && ( 
            <>
              <LockupInputControls onVisualize={handleVisualize} />
              <Divider className="!my-6 sm:!my-8 !bg-slate-700/60" />
              {(stakingConfig && epochTiming && validatorPoolInfo) && 
                <NetworkInfoDisplay 
                    stakingConfig={stakingConfig} 
                    epochTiming={epochTiming} 
                    validatorPoolInfo={validatorPoolInfo}
                />
              }

              {timelineData && !calculationError && ( 
                <>
                  <Divider className="!my-6 sm:!my-8 !bg-slate-700/60" />
                  <LockupTimelineDisplay timelineData={timelineData} />
                </>
              )}
              
              {!timelineData && !calculationError && !initiationTime && stakingConfig && epochTiming && validatorPoolInfo && ( 
                 <div className="mt-6 text-center text-slate-400 text-sm p-6 bg-slate-800/40 rounded-xl border border-slate-700/60">
                    <Info size={24} className="mx-auto mb-2 text-blue-400"/>
                    <p>Select an unstake initiation time or click "Visualize Unstaking From Now" to see the estimated timeline for the specified validator.</p>
                 </div>
              )}

              <Divider className="!my-10 sm:!my-12 !bg-slate-700/60" />
              {hardcodedFaqData && hardcodedFaqData.length > 0 && <LockupFAQ faqData={hardcodedFaqData} />}

              <div className="mt-10 sm:mt-12 pt-6 border-t border-slate-700/50">
                <LockupDisclaimer />
              </div>
            </>
          )}
           {!isLoading && fetchError && (
             <div className="text-center text-slate-400 mt-6">
                There was an issue loading data. Please try refreshing the page.
             </div>
           )}
        </div>
      </div>
    </>
  );
};

export default AptosLockupVisualizerPage;