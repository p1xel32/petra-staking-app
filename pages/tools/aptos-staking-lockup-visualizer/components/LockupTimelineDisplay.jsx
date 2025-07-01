// --- START OF FILE LockupTimelineDisplay.jsx ---

import React, { useState, useEffect, useCallback } from 'react';
// ✅ Новые, более подходящие иконки
import { Play, Hourglass, Lock, CheckCircle } from 'lucide-react'; 

// ✅ Компонент строки события с УБРАННЫМИ цветами
const TimelineEventRow = ({ icon: Icon, title, time, details }) => (
  <div className="flex justify-between items-start sm:items-center py-3.5 border-b border-zinc-800 last:border-b-0">
    <div className="flex items-start sm:items-center text-sm w-2/5 sm:w-auto">
      {/* Все иконки теперь одного цвета */}
      {Icon && <Icon size={18} className="mr-3 text-zinc-400 flex-shrink-0 mt-0.5 sm:mt-0" />}
      <span className="text-zinc-300">{title}:</span>
    </div>
    <div className="text-right flex-shrink-0 pl-2 w-3/5 sm:w-auto">
      <p className="block text-sm font-medium text-zinc-100">
        {new Date(time).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </p>
      {details && <p className="block text-xs text-zinc-500 mt-0.5">{details}</p>}
    </div>
  </div>
);

const formatLiveRemainingTime = (totalSeconds) => {
  if (totalSeconds <= 0) return "Available for withdrawal";
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

  const calculateAndSetRemaining = useCallback(() => {
    if (!timelineData || !timelineData.actualUnlockTime) {
      setLiveRemainingTime(timelineData?.remainingTime || ""); 
      return;
    }
    const nowMs = Date.now();
    const actualUnlockMs = timelineData.actualUnlockTime;
    const remainingSeconds = Math.max(0, Math.floor((actualUnlockMs - nowMs) / 1000));
    setLiveRemainingTime(formatLiveRemainingTime(remainingSeconds));
  }, [timelineData]);

  useEffect(() => {
    calculateAndSetRemaining();
    if (timelineData?.actualUnlockTime > Date.now()) {
      const intervalId = setInterval(calculateAndSetRemaining, 10000); 
      return () => clearInterval(intervalId);
    }
  }, [timelineData, calculateAndSetRemaining]);

  if (!timelineData) {
    return null; // Ничего не рендерим, если нет данных
  }

  const { initiationTime, poolCycleEndTime, actualUnlockTime } = timelineData;

  return (
    <div className="space-y-2">
        {/* ✅ Иконки и стили приведены в соответствие */}
        <TimelineEventRow
          icon={Play}
          title="Unstake Initiated"
          time={initiationTime}
        />
        <TimelineEventRow
          icon={Lock} 
          title="Pool Lockup Cycle Ends"
          time={poolCycleEndTime}
          details="Funds become inactive"
        />
        <TimelineEventRow
          icon={CheckCircle}
          title="Funds Available"
          time={actualUnlockTime}
          details="Becomes withdrawable at epoch boundary"
        />
        {liveRemainingTime && ( 
          <div className="pt-4 text-center">
            {/* Текст стал нейтральным, акцент только на цвете */}
            <p className={`block text-lg font-semibold ${liveRemainingTime === "Available for withdrawal" ? "text-green-400" : "text-zinc-100"}`}>
              {liveRemainingTime}
            </p>
          </div>
        )}
    </div>
  );
};

export default LockupTimelineDisplay;