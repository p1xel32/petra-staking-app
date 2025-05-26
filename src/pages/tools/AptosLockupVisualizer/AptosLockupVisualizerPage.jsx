import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Spin, Divider } from 'antd';
import { Helmet } from 'react-helmet-async';
import { getStakingConfig, getEpochTiming, getValidatorPoolInfo } from '../../../services/aptosService'; // Added getValidatorPoolInfo
import LockupInputControls from './components/LockupInputControls';
import LockupTimelineDisplay from './components/LockupTimelineDisplay';
import NetworkInfoDisplay from './components/NetworkInfoDisplay';
import LockupDisclaimer from './components/LockupDisclaimer';
import LockupFAQ from './components/LockupFAQ';
import { AlertTriangle, Info } from 'lucide-react';

const { Title, Paragraph } = Typography;

// Hardcode your specific validator pool address here
const TARGET_VALIDATOR_POOL_ADDRESS = '0xf747e3a6282cc0dee1c89239c529b039c64fe48e88b50e5cedd40e9c094800bb';

const AptosLockupVisualizerPage = () => {
  const [initiationTime, setInitiationTime] = useState(null);
  const [stakingConfig, setStakingConfig] = useState(null); 
  const [epochTiming, setEpochTiming] = useState(null);
  const [validatorPoolInfo, setValidatorPoolInfo] = useState(null); // New state for specific validator info
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
          getValidatorPoolInfo(TARGET_VALIDATOR_POOL_ADDRESS) // Fetch specific validator info
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
        setValidatorPoolInfo(poolInfo); // Store validator pool info

      } catch (error) {
        console.error("LockupVisualizer: Failed to fetch initial data:", error);
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
      setCalculationError("Required data (network config, epoch timing, validator info, or initiation time) is missing for calculation.");
      setTimelineData(null);
      return;
    }
    
    try {
      const T_init_secs = Math.floor(userInitiationTimeMs / 1000);
      const general_network_lockup_duration_secs = Number(stakingConfig.recurring_lockup_duration_secs);
      
      // The primary unlock time is the validator pool's locked_until_secs
      let T_pool_cycle_end_secs = validatorPoolInfo.locked_until_secs;

      // If user initiates unstake *after* the current pool cycle has already ended (not typical for fetched live data, but for safety)
      // then they are aiming for the *next* cycle.
      // The locked_until_secs from chain should ideally always be the *current or next* unlock point.
      // For simplicity, we assume the fetched locked_until_secs is the relevant one.
      // If T_init_secs is greater than T_pool_cycle_end_secs, it implies the user is unstaking
      // aiming for a cycle *after* the currently fetched one. This would mean locked_until_secs
      // on chain hasn't updated yet, or the user is planning for a future cycle.
      // A robust solution might involve projecting the next cycle if T_init_secs > T_pool_cycle_end_secs,
      // using recurring_lockup_duration_secs.
      // For now, we assume T_pool_cycle_end_secs is the target if T_init_secs is before it.
      // If T_init_secs is after T_pool_cycle_end_secs, this calculation will show funds available almost immediately
      // at that past T_pool_cycle_end_secs, which means they *are* available.

      // The funds become inactive when the pool's lockup cycle ends.
      const T_funds_become_inactive_secs = T_pool_cycle_end_secs;


      // Now, find the epoch boundary on or after T_funds_become_inactive_secs for actual withdrawal
      const epoch_interval_micros = BigInt(epochTiming.epochIntervalMicroseconds);
      const current_epoch_start_time_micros = BigInt(new Date(epochTiming.epochStartTime).getTime() * 1000);
      const epoch_interval_secs = Number(epoch_interval_micros / 1_000_000n);

      if (epoch_interval_secs === 0) {
        throw new Error("Epoch interval is zero.");
      }
      
      const current_epoch_start_secs_ref = Number(current_epoch_start_time_micros / 1_000_000n);
      let T_actual_unlock_secs;

      // Find the epoch containing or just before T_funds_become_inactive_secs
      let relevant_epoch_start_for_unlock_calc = current_epoch_start_secs_ref;
      if (T_funds_become_inactive_secs < current_epoch_start_secs_ref) {
          while (relevant_epoch_start_for_unlock_calc > T_funds_become_inactive_secs) {
              relevant_epoch_start_for_unlock_calc -= epoch_interval_secs;
          }
      } else {
          const epochs_passed = Math.floor((T_funds_become_inactive_secs - current_epoch_start_secs_ref) / epoch_interval_secs);
          relevant_epoch_start_for_unlock_calc = current_epoch_start_secs_ref + (epochs_passed * epoch_interval_secs);
      }

      // T_actual_unlock_secs is the end of the epoch that contains T_funds_become_inactive_secs,
      // or the next one if T_funds_become_inactive_secs is exactly on an epoch boundary.
      T_actual_unlock_secs = relevant_epoch_start_for_unlock_calc + epoch_interval_secs;
      if (T_actual_unlock_secs < T_funds_become_inactive_secs) { // Ensure it's on or after
          T_actual_unlock_secs += epoch_interval_secs;
      }


      const nowSecs = Math.floor(Date.now() / 1000);
      const remainingSecondsToPoolCycleEnd = T_funds_become_inactive_secs > T_init_secs ? T_funds_become_inactive_secs - nowSecs : 0;
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
      
      const calculationEpochParamsUsed = {
        epochStartTimeISO: epochTiming.epochStartTime.toISOString(),
        epochIntervalSeconds: epoch_interval_secs.toString(),
        dataAsOfTimestampISO: epochTiming.dataAsOfTimestamp.toISOString(),
        currentEpochAtCalc: epochTiming.currentEpoch.toString(),
        validatorPoolAddress: TARGET_VALIDATOR_POOL_ADDRESS, // Include target validator
        poolLockedUntilSecs: T_pool_cycle_end_secs.toString(),
      };

      setTimelineData({
        initiationTime: userInitiationTimeMs,
        // "Minimum Lockup Met" is now the pool's cycle end time
        poolCycleEndTime: T_funds_become_inactive_secs * 1000, 
        actualUnlockTime: T_actual_unlock_secs * 1000,
        remainingTime: remainingSecondsToFinalUnlock > 0 ? `in ~${remainingTimeStr}` : "Available now",
        // minLockupDurationInSeconds is less relevant now, but we can keep general network cycle length
        networkRecurringLockupDurationSecs: general_network_lockup_duration_secs,
        calculationEpochParams: calculationEpochParamsUsed,
      });

    } catch (error) {
      console.error("LockupVisualizer: Error during timeline calculation logic:", error);
      setCalculationError(`Calculation error: ${error.message}`);
      setTimelineData(null);
    }
  }, [stakingConfig, epochTiming, validatorPoolInfo]); // Added validatorPoolInfo dependency

  useEffect(() => {
    // Trigger calculation if all necessary data is available
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
      // Re-fetch epoch timing for utmost freshness for epoch alignment
      // ValidatorPoolInfo and StakingConfig are less likely to change rapidly for this tool's purpose
      const freshEpochTiming = await getEpochTiming(); 
      if (!freshEpochTiming || !freshEpochTiming.epochIntervalMicroseconds || 
          !freshEpochTiming.epochStartTime || freshEpochTiming.currentEpoch === undefined ||
          !freshEpochTiming.dataAsOfTimestamp) {
        throw new Error("Failed to load complete up-to-date network epoch timing. Please try again.");
      }
      setEpochTiming(freshEpochTiming); 
      
      // Optionally, re-fetch validatorPoolInfo if it could change and impact a current visualization
      // For now, assuming it's stable enough from initial load for a single visualization session
      // const freshPoolInfo = await getValidatorPoolInfo(TARGET_VALIDATOR_POOL_ADDRESS);
      // setValidatorPoolInfo(freshPoolInfo);

    } catch (error) {
      console.error("LockupVisualizer: Failed to fetch fresh data for visualization:", error);
      setFetchError(`Could not get latest data: ${error.message}. Calculation may use older data or fail.`);
    } finally {
      setIsLoading(false); 
    }
  };
  
  const getFaqData = useCallback(() => { 
    let recurringLockupDisplay = 'N/A';
    if (stakingConfig && stakingConfig.recurring_lockup_duration_secs) {
      const lockupSecs = Number(stakingConfig.recurring_lockup_duration_secs);
      recurringLockupDisplay = (lockupSecs / (60 * 60 * 24)).toFixed(1);
    }
    // FAQ might need to be updated to explain validator-specific lockup cycles
    return [
      { question: "How does validator pool lockup affect unstaking?", answer: `When you unstake from a specific validator, your funds become available after that validator's current lockup cycle ends. This tool visualizes this for ${TARGET_VALIDATOR_POOL_ADDRESS}. The network also defines a general recurring lockup duration (around ${recurringLockupDisplay} days) which sets the length of these cycles.` },
      { question: "What is an epoch on Aptos?", answer: `An epoch on Aptos is a set duration during which a consistent set of validators participate. Final withdrawal of unstaked funds typically aligns with an epoch boundary after the lockup cycle ends.` },
      { question: "Why are 'Pool Cycle Ends' and 'Funds Available' different?", answer: "Your funds are tied to the validator's lockup cycle. They become inactive (ready for withdrawal processing) when this cycle ends. The final 'Funds Available' time is when this withdrawal is processed, aligned to the end of a network epoch." }
    ];
  }, [stakingConfig]); 

  const pageUrl = "https://aptcore.one/tools/aptos-staking-lockup-visualizer";
  const pageTitle = `Lockup Visualizer for ${TARGET_VALIDATOR_POOL_ADDRESS.substring(0,6)}... | Aptcore.one`;
  const pageDescription = `Estimate when your staked Aptos (APT) will be available from validator ${TARGET_VALIDATOR_POOL_ADDRESS} with the Aptcore.one Lockup Visualizer.`;
  const faqDataForSchema = getFaqData();

  return (
    <>
      <Helmet>
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
        <script type="application/ld+json">{JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", "name": pageTitle, "description": pageDescription, "url": pageUrl, "isPartOf": { "@type": "WebSite", "url": "https://aptcore.one", "name": "Aptcore.one" } })}</script>
        {(stakingConfig && epochTiming && validatorPoolInfo && faqDataForSchema.length > 0) && (<script type="application/ld+json">{JSON.stringify({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": faqDataForSchema.map(faq => ({"@type": "Question", "name": faq.question, "acceptedAnswer": {"@type": "Answer", "text": faq.answer }}))})}</script>)}
      </Helmet>

      <div className="w-full max-w-3xl mx-auto py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
        <div className="bg-slate-800/70 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl shadow-purple-500/20 p-6 sm:p-10">
          <div className="text-center mb-8 sm:mb-10">
            <Title level={1} className="!text-3xl sm:!text-4xl !font-bold !mb-4 tracking-tight !text-white">
              Aptos Unstaking Visualizer
            </Title>
            <Paragraph className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto">
              Visualize your unstaking timeline for validator: <strong className="text-purple-300 block break-all">{TARGET_VALIDATOR_POOL_ADDRESS}</strong>
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
                    validatorPoolInfo={validatorPoolInfo} // Pass to display specific validator info if needed
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
                    <p>Click "Visualize Unstaking From Now" to see the estimated timeline for the specified validator.</p>
                 </div>
              )}

              <Divider className="!my-10 sm:!my-12 !bg-slate-700/60" />
              <LockupFAQ faqData={getFaqData()} />

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