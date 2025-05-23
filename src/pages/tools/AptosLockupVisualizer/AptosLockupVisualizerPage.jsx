// src/pages/tools/AptosLockupVisualizer/AptosLockupVisualizerPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Spin, Divider } from 'antd';
import { Helmet } from 'react-helmet-async';
import { getStakingConfig, getEpochTiming } from '../../../services/aptosService';
import LockupInputControls from './components/LockupInputControls';
import LockupTimelineDisplay from './components/LockupTimelineDisplay';
import NetworkInfoDisplay from './components/NetworkInfoDisplay';
import LockupDisclaimer from './components/LockupDisclaimer';
import LockupFAQ from './components/LockupFAQ';
import { AlertTriangle } from 'lucide-react';

const { Title, Paragraph } = Typography;

const AptosLockupVisualizerPage = () => {
  const [initiationTime, setInitiationTime] = useState(null);
  const [stakingConfig, setStakingConfig] = useState(null);
  const [epochTiming, setEpochTiming] = useState(null); 
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
        const [config, timingInfo] = await Promise.all([
          getStakingConfig(),
          getEpochTiming() 
        ]);
        
        if (!config || config.recurring_lockup_duration_secs === undefined) {
            console.error("LockupVisualizer: StakingConfig data is incomplete. Received:", config);
            throw new Error("StakingConfig data is incomplete.");
        }
        if (!timingInfo || !timingInfo.epochIntervalMicroseconds || !timingInfo.epochStartTime || timingInfo.currentEpoch === undefined) {
            console.error("LockupVisualizer: Epoch timing data is incomplete. Received:", timingInfo);
            throw new Error("Epoch timing data is incomplete.");
        }
        setStakingConfig(config);
        setEpochTiming(timingInfo);
      } catch (error) {
        console.error("LockupVisualizer: Failed to fetch initial network data:", error);
        setFetchError("Could not load essential network parameters. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const calculateLockupTimeline = useCallback((userInitiationTimeMs) => {
    setCalculationError(null); 
    setTimelineData(null); 

    if (!stakingConfig || !epochTiming || !userInitiationTimeMs) {
      setCalculationError("Network data or initiation time is missing for calculation.");
      return;
    }

    if (stakingConfig.recurring_lockup_duration_secs === undefined) {
        setCalculationError("Staking configuration data is incomplete (missing lockup duration).");
        return;
    }
    if (epochTiming.epochIntervalMicroseconds === undefined || epochTiming.epochStartTime === undefined) {
        setCalculationError("Epoch timing data is incomplete.");
        return;
    }

    try {
      const T_init_secs = Math.floor(userInitiationTimeMs / 1000);
      
      const epoch_interval_micros = BigInt(epochTiming.epochIntervalMicroseconds);
      const current_epoch_start_time_micros = BigInt(new Date(epochTiming.epochStartTime).getTime() * 1000);

      const epoch_interval_secs = Number(epoch_interval_micros / 1_000_000n);
      
      if (epoch_interval_secs === 0) {
        setCalculationError("Epoch interval is zero, cannot calculate timeline.");
        return;
      }

      const min_lockup_duration_in_seconds = Number(stakingConfig.recurring_lockup_duration_secs); 
      const T_min_unlock_secs = T_init_secs + min_lockup_duration_in_seconds;
      const current_epoch_start_secs = Number(current_epoch_start_time_micros / 1_000_000n);
      
      let T_actual_unlock_secs;
      
      let relevant_epoch_start_for_init_calc = current_epoch_start_secs;
      if (T_init_secs < current_epoch_start_secs) {
          while (relevant_epoch_start_for_init_calc > T_init_secs) {
              relevant_epoch_start_for_init_calc -= epoch_interval_secs;
          }
      } else {
          const epochs_passed_within_current_chain_epoch = Math.floor((T_init_secs - current_epoch_start_secs) / epoch_interval_secs);
          relevant_epoch_start_for_init_calc = current_epoch_start_secs + (epochs_passed_within_current_chain_epoch * epoch_interval_secs);
      }
      
      let candidateUnlockEpochEnd = relevant_epoch_start_for_init_calc + epoch_interval_secs;
      
      if(candidateUnlockEpochEnd <= T_init_secs) {
          candidateUnlockEpochEnd += epoch_interval_secs;
      }
      
      while(candidateUnlockEpochEnd < T_min_unlock_secs) {
          candidateUnlockEpochEnd += epoch_interval_secs;
      }
      T_actual_unlock_secs = candidateUnlockEpochEnd;
      
      const nowSecs = Math.floor(Date.now() / 1000);
      const remainingSeconds = T_actual_unlock_secs > nowSecs ? T_actual_unlock_secs - nowSecs : 0;
      let remainingTimeStr = "Available now";
      if (remainingSeconds > 0) {
        const d = Math.floor(remainingSeconds / (3600*24));
        const h = Math.floor(remainingSeconds % (3600*24) / 3600);
        const m = Math.floor(remainingSeconds % 3600 / 60);
        let parts = [];
        if (d > 0) parts.push(`${d}d`);
        if (h > 0) parts.push(`${h}h`);
        if (m > 0 || parts.length === 0) parts.push(`${m}m`);
        remainingTimeStr = parts.join(' ');
        if (!remainingTimeStr || remainingTimeStr === "0m") remainingTimeStr = "<1m";
      }

      setTimelineData({
        initiationTime: userInitiationTimeMs,
        minLockupEndTime: T_min_unlock_secs * 1000,
        actualUnlockTime: T_actual_unlock_secs * 1000,
        remainingTime: remainingSeconds > 0 ? `in ~${remainingTimeStr}` : "Available now",
        minLockupDurationInSeconds: min_lockup_duration_in_seconds 
      });
    } catch (error) {
      console.error("LockupVisualizer: Error during timeline calculation logic:", error);
      setCalculationError("An unexpected error occurred while calculating the timeline.");
      setTimelineData(null);
    }
  }, [stakingConfig, epochTiming]);

  const handleVisualize = (timeMs) => {
    setInitiationTime(timeMs);
    if (stakingConfig && epochTiming) {
        calculateLockupTimeline(timeMs);
    } else {
        setFetchError("Network data is not yet available. Please wait or refresh.");
    }
  };

  const pageUrl = "https://aptcore.one/tools/aptos-staking-lockup-visualizer";
  const pageTitle = "Aptos Staking Lockup Visualizer | Unstake Period Tool | Aptcore.one";
  const pageDescription = "Estimate when your staked Aptos (APT) will be available for withdrawal with the Aptcore.one Lockup Visualizer. Understand Aptos unstaking periods, cooldowns, and epoch-based unlocks.";

  const getFaqData = () => {
    // ... (getFaqData logic remains the same)
    let minLockupDisplay = 'X';
    if (stakingConfig && stakingConfig.recurring_lockup_duration_secs) { 
        const minLockupSecs = Number(stakingConfig.recurring_lockup_duration_secs);
        minLockupDisplay = (minLockupSecs / (60*60*24)).toFixed(1);
    }
    let epochIntervalHoursDisplay = 'Y';
    if (epochTiming && epochTiming.epochIntervalMicroseconds) {
        const epochIntervalBigInt = BigInt(epochTiming.epochIntervalMicroseconds);
        if (epochIntervalBigInt > 0) {
            epochIntervalHoursDisplay = (Number(epochIntervalBigInt / (1_000_000n * 3600n))).toFixed(1);
        }
    }
    return [
      { question: "How long is the Aptos unstaking lockup period?", answer: `The typical lockup period on Aptos after initiating an unstake is defined by the network's StakingConfig (currently around ${minLockupDisplay} days). Funds become available at the end of an epoch that occurs after this period is met.` },
      { question: "What is an epoch on Aptos?", answer: `An epoch on Aptos is a set duration (currently around ${epochIntervalHoursDisplay} hours) during which a consistent set of validators participate. Staking operations like rewards distribution and unstake finalization typically align with epoch boundaries.`},
      { question: "Why is there a 'minimum lockup' and an 'actual unlock' time?", answer: "Aptos requires a minimum duration for stake to be locked after an unstake request (derived from recurring_lockup_duration_secs). However, the stake only becomes truly withdrawable at the end of the specific blockchain epoch that fulfills this minimum lockup duration. This tool visualizes both points."}
    ];
  };
  
  const faqDataForSchema = getFaqData();

  return (
    <>
      <Helmet>
        {/* ... Helmet content ... */}
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Aptcore.one" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <script type="application/ld+json">{JSON.stringify({"@context": "https://schema.org", "@type": "WebPage", "name": pageTitle, "description": pageDescription, "url": pageUrl, "isPartOf": { "@type": "WebSite", "url": "https://aptcore.one", "name": "Aptcore.one" }})}</script>
        <script type="application/ld+json">{JSON.stringify({"@context": "https://schema.org", "@type": "HowTo", "name": "How to Use the Aptos Staking Lockup Visualizer", "description": "Visualize the Aptos unstaking timeline by providing an unstake initiation time.", "step": [{"@type": "HowToStep", "name": "Initiate Visualization", "text": "Click the 'Visualize Unstaking From Now' button or select a custom date/time (feature coming soon) to start the calculation."}, {"@type": "HowToStep", "name": "Observe Timeline", "text": "The tool will display key dates: when your unstake is initiated, when the minimum lockup period is met, and when your APT becomes available at the relevant epoch end."}, {"@type": "HowToStep", "name": "Understand Network Info", "text": "Review current network parameters like minimum lockup duration and epoch interval that influence the timeline."}], "tool": [{"@type": "HowToTool", "name": "Aptos Staking Lockup Visualizer on Aptcore.one"}]})}</script>
        <script type="application/ld+json">{JSON.stringify({"@context": "https://schema.org", "@type": "SoftwareApplication", "name": "Aptos Staking Lockup Visualizer", "applicationCategory": "Utilities", "operatingSystem": "Web", "description": "A free online tool by Aptcore.one to visualize and understand the Aptos (APT) staking unstake period and lockup mechanism.", "author": { "@type": "Organization", "name": "Aptcore.one", "url": "https://aptcore.one" }, "url": pageUrl, "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }})}</script>
        {(stakingConfig && epochTiming && faqDataForSchema.length > 0) && (<script type="application/ld+json">{JSON.stringify({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": faqDataForSchema.map(faq => ({"@type": "Question", "name": faq.question, "acceptedAnswer": {"@type": "Answer", "text": faq.answer }}))})}</script>)}
      </Helmet>

      <div className="w-full max-w-3xl mx-auto py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-purple-500/10 p-6 sm:p-10">
          <div className="text-center mb-8 sm:mb-10">
            <Title level={1} className="!text-3xl sm:!text-4xl !font-bold !mb-4 tracking-tight !text-white"> {/* Ensured !text-white */}
              Aptos Staking Lock-up Visualizer
            </Title>
            <Paragraph className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto">
              Understand when your staked APT becomes available after unstaking. Visualize the timeline based on current Aptos network parameters.
            </Paragraph>
          </div>

          {isLoading && ( /* ... loading JSX ... */ <div className="py-10 text-center"><Spin size="large" /><p className="text-slate-300 mt-4 text-base">Loading Network Data...</p></div>)}
          {!isLoading && (fetchError || calculationError) && ( /* ... error JSX ... */ <div className="mb-6 p-4 bg-red-900/40 border border-red-700/60 text-red-300 rounded-lg text-sm flex items-center gap-x-3"><AlertTriangle size={20} className="flex-shrink-0" /><div><strong className="font-semibold block text-red-200">Error</strong><span>{fetchError || calculationError}</span></div></div>)}

          {!isLoading && !fetchError && (
            <>
              <LockupInputControls onVisualize={handleVisualize} />
              <Divider className="!my-6 sm:!my-8 !bg-slate-700/60" />
              <NetworkInfoDisplay stakingConfig={stakingConfig} epochTiming={epochTiming} /> 
              
              {timelineData && !calculationError && (
                <>
                  <Divider className="!my-6 sm:!my-8 !bg-slate-700/60" />
                  <LockupTimelineDisplay timelineData={timelineData} />
                </>
              )}
              
              <Divider className="!my-10 sm:!my-12 !bg-slate-700/60" />
              <LockupFAQ faqData={getFaqData()} />
              
              <div className="mt-10 sm:mt-12 pt-6 border-t border-slate-700/50">
                <LockupDisclaimer />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AptosLockupVisualizerPage;
