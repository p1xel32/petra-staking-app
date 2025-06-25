import React from 'react';
import { Typography, Space } from 'antd';
import { Cog, Info as InfoIcon, Clock, KeyRound } from 'lucide-react'; // KeyRound for recurring lockup

const { Text, Title } = Typography;

const InfoRowUIDisplay = ({ label, value, icon: Icon }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-slate-700/60 last:border-b-0">
    <span className="text-gray-400 flex items-center text-sm">
      {Icon && <Icon size={16} className="mr-2.5 text-purple-400 flex-shrink-0" />}
      {label}:
    </span>
    <Text className="text-sm text-slate-200 font-medium text-right">{value}</Text>
  </div>
);

const NetworkInfoDisplay = ({ stakingConfig, epochTiming, validatorPoolInfo }) => { // validatorPoolInfo can be used if needed
  if (!stakingConfig || !epochTiming) { // validatorPoolInfo might not be needed here if main timeline shows its specifics
    return (
      <div className="mt-6 text-center text-slate-400 text-sm">
        Loading network parameters...
      </div>
    );
  }
  
  let recurringLockupDisplay = 'N/A';
  if (stakingConfig.recurring_lockup_duration_secs) {
    const lockupSecs = Number(stakingConfig.recurring_lockup_duration_secs);
    recurringLockupDisplay = (lockupSecs / (60 * 60 * 24)).toFixed(1) + " days";
  }
  
  let epochIntervalHoursDisplay = 'N/A';
  if (epochTiming.epochIntervalMicroseconds) {
    const intervalMicros = BigInt(epochTiming.epochIntervalMicroseconds);
    if (intervalMicros > 0) {
      const intervalSecs = Number(intervalMicros / 1_000_000n);
      epochIntervalHoursDisplay = "~" + (intervalSecs / 3600).toFixed(1) + " hours";
    }
  }

  const currentEpoch = epochTiming.currentEpoch ? epochTiming.currentEpoch.toLocaleString() : 'N/A';

  let dataAsOfDisplay = 'N/A';
  if (epochTiming.dataAsOfTimestamp) { 
    dataAsOfDisplay = new Date(epochTiming.dataAsOfTimestamp).toLocaleString(undefined, {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }
  
  // Info about the specific validator being visualized (optional here if shown elsewhere)
  // let validatorSpecificInfo = null;
  // if (validatorPoolInfo) {
  //   validatorSpecificInfo = `Target Pool (${validatorPoolInfo.poolAddress.substring(0,6)}...) Lockup End: ${new Date(validatorPoolInfo.locked_until_secs * 1000).toLocaleDateString()}`;
  // }


  return (
    <div className="mt-6 sm:mt-8">
      <Title level={3} className="!text-xl sm:!text-2xl !font-semibold !mb-5 text-center !text-white">
        <Space align="center">
            <Cog size={24} className="text-purple-400"/>
            <span>Network & Staking Parameters</span>
        </Space>
      </Title>
      <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/60 rounded-xl p-4 sm:p-6 shadow-md">
        <InfoRowUIDisplay icon={KeyRound} label="Network Staking Cycle Duration" value={recurringLockupDisplay} />
        <InfoRowUIDisplay icon={InfoIcon} label="Current Epoch Number" value={currentEpoch} />
        <InfoRowUIDisplay icon={Clock} label="Average Epoch Duration" value={epochIntervalHoursDisplay} />
        {epochTiming.dataAsOfTimestamp && (
           <InfoRowUIDisplay icon={InfoIcon} label="Epoch Data as of" value={dataAsOfDisplay} />
        )}
        {/* {validatorSpecificInfo && (
          <InfoRowUIDisplay icon={InfoIcon} label="Target Validator Info" value={validatorSpecificInfo} />
        )} */}
      </div>
    </div>
  );
};

export default NetworkInfoDisplay;