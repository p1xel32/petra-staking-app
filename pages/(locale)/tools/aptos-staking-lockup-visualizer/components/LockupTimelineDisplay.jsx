import React, { useState, useEffect, useCallback } from 'react';
import { Play, Lock, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const TimelineEventRow = ({ icon: Icon, title, time, details, locale }) => (
  <div className="flex justify-between items-start sm:items-center py-3.5 border-b border-zinc-800 last:border-b-0">
    <div className="flex items-start sm:items-center text-sm w-2/5 sm:w-auto">
      {Icon && <Icon size={18} className="mr-3 text-zinc-400 flex-shrink-0 mt-0.5 sm:mt-0" />}
      <span className="text-zinc-300">{title}:</span>
    </div>
    <div className="text-right flex-shrink-0 pl-2 w-3/5 sm:w-auto">
      <p className="block text-sm font-medium text-zinc-100">
        {new Date(time).toLocaleString(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </p>
      {details && <p className="block text-xs text-zinc-500 mt-0.5">{details}</p>}
    </div>
  </div>
);

const formatLiveRemainingTime = (totalSeconds, t) => {
  if (totalSeconds <= 0) return t('lockupVisualizerPage.timelineDisplay.availableNow');
  const d = Math.floor(totalSeconds / (3600 * 24));
  const h = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  let parts = [];
  if (d > 0) parts.push(`${d}${t('lockupVisualizerPage.timelineDisplay.daysShort')}`);
  if (h > 0) parts.push(`${h}${t('lockupVisualizerPage.timelineDisplay.hoursShort')}`);
  if (m > 0 || parts.length === 0) {
    parts.push(`${m}${t('lockupVisualizerPage.timelineDisplay.minutesShort')}`);
  }
  let timeStr = parts.join(' ');
  if (!timeStr || timeStr === `0${t('lockupVisualizerPage.timelineDisplay.minutesShort')}`) {
    timeStr = t('lockupVisualizerPage.timelineDisplay.lessThanAMinute');
  }
  return t('lockupVisualizerPage.timelineDisplay.inFormat', { time: timeStr });
};

const LockupTimelineDisplay = ({ timelineData }) => {
  const { t, i18n } = useTranslation();
  const [liveRemainingTime, setLiveRemainingTime] = useState("");

  const calculateAndSetRemaining = useCallback(() => {
    if (!timelineData || !timelineData.actualUnlockTime) {
      setLiveRemainingTime(timelineData?.remainingTime || "");
      return;
    }
    const nowMs = Date.now();
    const actualUnlockMs = timelineData.actualUnlockTime;
    const remainingSeconds = Math.max(0, Math.floor((actualUnlockMs - nowMs) / 1000));
    setLiveRemainingTime(formatLiveRemainingTime(remainingSeconds, t));
  }, [timelineData, t]);

  useEffect(() => {
    calculateAndSetRemaining();
    if (timelineData?.actualUnlockTime > Date.now()) {
      const intervalId = setInterval(calculateAndSetRemaining, 10000);
      return () => clearInterval(intervalId);
    }
  }, [timelineData, calculateAndSetRemaining]);

  if (!timelineData) {
    return null;
  }

  const { initiationTime, poolCycleEndTime, actualUnlockTime } = timelineData;
  const availableNowText = t('lockupVisualizerPage.timelineDisplay.availableNow');

  return (
    <div className="space-y-2">
        <TimelineEventRow
          icon={Play}
          title={t('lockupVisualizerPage.timelineDisplay.event1.title')}
          time={initiationTime}
          locale={i18n.language}
        />
        <TimelineEventRow
          icon={Lock}
          title={t('lockupVisualizerPage.timelineDisplay.event2.title')}
          time={poolCycleEndTime}
          details={t('lockupVisualizerPage.timelineDisplay.event2.details')}
          locale={i18n.language}
        />
        <TimelineEventRow
          icon={CheckCircle}
          title={t('lockupVisualizerPage.timelineDisplay.event3.title')}
          time={actualUnlockTime}
          details={t('lockupVisualizerPage.timelineDisplay.event3.details')}
          locale={i18n.language}
        />
        {liveRemainingTime && (
          <div className="pt-4 text-center">
            <p className={`block text-lg font-semibold ${liveRemainingTime === availableNowText ? "text-green-400" : "text-zinc-100"}`}>
              {liveRemainingTime}
            </p>
          </div>
        )}
    </div>
  );
};

export default LockupTimelineDisplay;