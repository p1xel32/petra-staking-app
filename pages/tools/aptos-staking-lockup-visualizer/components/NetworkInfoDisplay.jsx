// --- START OF FILE NetworkInfoDisplay.jsx ---

import React from 'react';
import { Layers, Clock, CalendarDays, Hash } from 'lucide-react';

const DataRow = ({ icon: Icon, label, children }) => (
    <div className="flex justify-between items-center py-3">
        <div className="flex items-center text-sm">
            <Icon size={18} className="text-zinc-400 mr-4 flex-shrink-0" />
            <span className="text-zinc-300">{label}</span>
        </div>
        <div className="flex items-center justify-end text-right text-sm font-mono text-zinc-100">
            {children}
        </div>
    </div>
);

const NetworkInfoDisplay = ({ stakingConfig, epochTiming }) => {
  if (!stakingConfig || !epochTiming) {
    return null; 
  }
  
  const recurringLockupDays = (Number(stakingConfig.recurring_lockup_duration_secs) / 86400).toFixed(1);
  const epochIntervalHours = `~${(Number(epochTiming.epochIntervalMicroseconds) / 1_000_000 / 3600).toFixed(1)} hours`;
  
  const currentEpoch = epochTiming.currentEpoch ? Number(epochTiming.currentEpoch).toLocaleString() : 'Loading...';

  const dataAsOfDisplay = epochTiming.epochStartTime ? new Date(epochTiming.epochStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Loading...';

  return (
    <div className="divide-y divide-zinc-800">
      <DataRow icon={Layers} label="Network Staking Cycle Duration">
        <span>{recurringLockupDays} days</span>
      </DataRow>
      <DataRow icon={Hash} label="Current Epoch Number">
        <span>{currentEpoch}</span>
      </DataRow>
      <DataRow icon={Clock} label="Average Epoch Duration">
        <span>{epochIntervalHours}</span>
      </DataRow>
      <DataRow icon={CalendarDays} label="Epoch Data as of">
        <span>{dataAsOfDisplay}</span>
      </DataRow>
    </div>
  );
};

export default NetworkInfoDisplay;