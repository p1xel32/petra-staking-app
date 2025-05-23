// src/pages/tools/AptosLockupVisualizer/components/NetworkInfoDisplay.jsx
import React from 'react';
import { Typography, Space } from 'antd';
import { Cog, Info, Clock } from 'lucide-react';

const { Text, Title } = Typography;

const InfoRow = ({ label, value, icon: Icon }) => (
  // This row itself does not need horizontal padding if its container has it.
  <div className="flex justify-between items-center py-2.5 border-b border-slate-700/60 last:border-b-0">
    <span className="text-gray-400 flex items-center text-sm">
      {Icon && <Icon size={16} className="mr-2.5 text-purple-400 flex-shrink-0" />}
      {label}:
    </span>
    <Text className="text-sm text-slate-200 font-medium text-right">{value}</Text> {/* Ensure text-right for value */}
  </div>
);

const NetworkInfoDisplay = ({ stakingConfig, epochTiming }) => {
  if (!stakingConfig || !epochTiming) {
    return (
      <div className="mt-6 text-center text-slate-400 text-sm">
        Loading network parameters...
      </div>
    );
  }
  
  let minLockupDisplay = 'N/A';
  if (stakingConfig.recurring_lockup_duration_secs) {
    const lockupSecs = Number(stakingConfig.recurring_lockup_duration_secs);
    minLockupDisplay = (lockupSecs / (60 * 60 * 24)).toFixed(1) + " days";
  }
  
  let epochIntervalHoursDisplay = 'N/A';
  if (epochTiming.epochIntervalMicroseconds) {
    const intervalMicros = BigInt(epochTiming.epochIntervalMicroseconds);
    if (intervalMicros > 0) {
      epochIntervalHoursDisplay = "~" + (Number(intervalMicros / (1_000_000n * 3600n))).toFixed(1) + " hours";
    }
  }

  const currentEpoch = epochTiming.currentEpoch || 'N/A';

  return (
    <div className="mt-6 sm:mt-8">
      <Title level={3} className="!text-xl sm:!text-2xl !font-semibold !mb-5 text-center !text-white">
        <Space align="center">
            <Cog size={24} className="text-purple-400"/>
            <span>Current Network Parameters</span>
        </Space>
      </Title>
      {/* Added consistent padding to this container div */}
      <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/60 rounded-xl p-4 sm:p-6 shadow-md">
        <InfoRow icon={Clock} label="Typical Lockup Duration" value={minLockupDisplay} />
        <InfoRow icon={Info} label="Current Epoch Number" value={currentEpoch.toLocaleString()} />
        <InfoRow icon={Clock} label="Average Epoch Duration" value={epochIntervalHoursDisplay} />
      </div>
    </div>
  );
};

export default NetworkInfoDisplay;
