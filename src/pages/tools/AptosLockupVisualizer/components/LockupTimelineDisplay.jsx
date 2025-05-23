// src/pages/tools/AptosLockupVisualizer/components/LockupTimelineDisplay.jsx
import React from 'react';
import { Typography, Space } from 'antd';
import { Hourglass, CalendarClock, ShieldAlert, ShieldCheck, Info } from 'lucide-react';

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


const LockupTimelineDisplay = ({ timelineData }) => {
  if (!timelineData) {
    return (
      <div className="mt-6 text-center text-slate-400 text-sm p-6 bg-slate-800/40 rounded-xl border border-slate-700/60">
        <Info size={24} className="mx-auto mb-2 text-blue-400"/>
        <p>Click "Visualize Unstaking From Now" to see the estimated timeline.</p>
      </div>
    );
  }

  const { initiationTime, minLockupEndTime, actualUnlockTime, remainingTime } = timelineData;

  return (
    <div className="mt-6 sm:mt-8">
      <Title level={2} className="!text-xl sm:!text-2xl !font-semibold !mb-5 text-center !text-white"> {/* Ensured !text-white */}
        <Space align="center">
          <Hourglass size={24} className="text-purple-400" />
          <span>Estimated Unlock Timeline</span>
        </Space>
      </Title>
      <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/60 rounded-xl p-4 sm:p-6 shadow-md"> {/* Added padding here */}
        <TimelineEventRow 
          icon={CalendarClock}
          title="Unstake Initiated"
          time={initiationTime}
          colorClass="text-blue-400"
        />
        <TimelineEventRow 
          icon={ShieldAlert}
          title="Minimum Lockup Met"
          time={minLockupEndTime}
          details="Network's minimum lockup duration fulfilled."
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
         {remainingTime && (
            <div className="pt-4 pb-2 text-center">
                <Text className="block text-lg font-semibold text-green-300">{remainingTime}</Text>
            </div>
        )}
      </div>
    </div>
  );
};

export default LockupTimelineDisplay;
