// src/pages/tools/AptosLockupVisualizer/components/LockupTimelineDisplay.jsx
import React, { useState, useEffect } from 'react';
import { Typography, Space } from 'antd';
import { Hourglass, CalendarClock, ShieldAlert, ShieldCheck, Info, PackageCheck } from 'lucide-react'; // Added PackageCheck

const { Title, Text } = Typography;

const TimelineEventRow = ({ icon: Icon, title, time, details, colorClass = "text-purple-400", valueTextColor = "text-slate-200" }) => (
  <div className="flex justify-between items-start sm:items-center py-3 border-b border-slate-700/60 last:border-b-0">
    <span className="text-gray-400 flex items-start sm:items-center text-sm w-2/5 sm:w-auto">
      {Icon && <Icon size={18} className={`mr-3 ${colorClass} flex-shrink-0 mt-0.5 sm:mt-0`} />}
      {title}:
    </span>
    <div className="text-right flex-shrink-0 pl-2 w-3/5 sm:w-auto">
      <Text className={`block text-sm font-medium ${valueTextColor}`}>
        {new Date(time).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </Text>
      {details && <Text className="block text-xs text-slate-400 mt-0.5">{details}</Text>}
    </div>
  </div>
);

const formatLiveRemainingTime = (totalSeconds) => {
  if (totalSeconds <= 0) return "Available now";
  const d = Math.floor(totalSeconds / (3600 * 24));
  const h = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  let parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || parts.length === 0) { 
    parts.push(`${m}m`); 
  }
  let timeStr = parts.join(' ');
  if (!timeStr || timeStr === "0m") {
    timeStr = "<1m";
  }
  return `in ~${timeStr}`;
};

const LockupTimelineDisplay = ({ timelineData }) => {
  const [liveRemainingTime, setLiveRemainingTime] = useState("");

  useEffect(() => {
    if (!timelineData || !timelineData.actualUnlockTime) {
      setLiveRemainingTime(timelineData?.remainingTime || ""); 
      return;
    }
    setLiveRemainingTime(timelineData.remainingTime);
    const calculateAndSetRemaining = () => {
      const nowMs = Date.now();
      const actualUnlockMs = timelineData.actualUnlockTime;
      const remainingSeconds = Math.max(0, Math.floor((actualUnlockMs - nowMs) / 1000));
      setLiveRemainingTime(formatLiveRemainingTime(remainingSeconds));
    };
    calculateAndSetRemaining(); 
    if (timelineData.actualUnlockTime > Date.now()) {
      const intervalId = setInterval(calculateAndSetRemaining, 10000); 
      return () => clearInterval(intervalId);
    }
  }, [timelineData]); 


  if (!timelineData) {
    return (
      <div className="mt-6 text-center text-slate-400 text-sm p-6 bg-slate-800/40 rounded-xl border border-slate-700/60">
        <Info size={24} className="mx-auto mb-2 text-blue-400"/>
        <p>Timeline data will appear here once calculated.</p>
      </div>
    );
  }

  const { initiationTime, poolCycleEndTime, actualUnlockTime, calculationEpochParams } = timelineData;

  return (
    <div className="mt-6 sm:mt-8">
      <Title level={2} className="!text-xl sm:!text-2xl !font-semibold !mb-5 text-center !text-white">
        <Space align="center">
          <Hourglass size={24} className="text-purple-400" />
          <span>Estimated Unlock Timeline</span>
        </Space>
      </Title>
      <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/60 rounded-xl p-4 sm:p-6 shadow-md">
        <TimelineEventRow
          icon={CalendarClock}
          title="Unstake Initiated"
          time={initiationTime}
          colorClass="text-blue-400"
        />
        <TimelineEventRow
          icon={PackageCheck} 
          title="Pool Lockup Cycle Ends"
          time={poolCycleEndTime}
          details="Funds become inactive; withdrawal processing begins."
          colorClass="text-yellow-400"
        />
        <TimelineEventRow
          icon={ShieldCheck}
          title="Funds Available (Epoch End)"
          time={actualUnlockTime}
          details="APT becomes withdrawable at this epoch boundary."
          colorClass="text-green-400"
          valueTextColor="!text-green-300"
        />
        {liveRemainingTime && ( 
          <div className="pt-4 pb-2 text-center">
            <Text className="block text-lg font-semibold text-green-300">{liveRemainingTime}</Text>
          </div>
        )}

        {calculationEpochParams && (
          <div className="mt-5 pt-4 border-t border-slate-700/50 text-xs text-slate-400 text-center bg-slate-900/20 rounded-lg p-3 shadow-inner">
            <p className="mb-1">
              <Info size={13} className="inline mr-1.5 relative -top-px text-blue-300"/>
              Calculated for validator: <strong className="text-slate-200 break-all block sm:inline mt-0.5 sm:mt-0">{calculationEpochParams.validatorPoolAddress}</strong>
            </p>
            <p className="mb-1">
              Using network data from: <strong className="text-slate-200">{new Date(calculationEpochParams.dataAsOfTimestampISO).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong>
            </p>
            <p className="text-slate-500 leading-relaxed">
              (Current on-chain Epoch #{calculationEpochParams.currentEpochAtCalc} started: {new Date(calculationEpochParams.epochStartTimeISO).toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit'})}. 
              Target pool's cycle ends: {new Date(Number(calculationEpochParams.poolLockedUntilSecs) * 1000).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}.)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LockupTimelineDisplay;