// src/pages/tools/AptosAPYCalculator/components/ResultsDisplay.jsx
import React from 'react';
import { Typography, Spin } from 'antd'; // Removed Alert, Space from AntD
import {
  TrendingUp,
  Sun,
  CalendarRange,
  CalendarHeart,
  CalendarCheck2,
  CalendarDays, // Fallback
  AlertTriangle, // For custom styled alert
  Info // For custom styled alert
} from 'lucide-react';

const { Title, Text } = Typography;

const ResultInfoRow = ({ label, aptValue, usdValue, isPriceAvailable, icon: Icon }) => {
  return (
    <div className="flex justify-between items-center py-3"> 
      <span className="text-gray-300 flex items-center text-sm sm:text-base"> 
        {Icon && <Icon size={18} className="mr-2.5 text-zinc-400 flex-shrink-0" />} 
        {label}:
      </span>
      <div className="text-right flex-shrink-0 pl-2">
        <Text className="text-base sm:text-lg font-semibold text-green-400 block"> 
          {aptValue.toFixed(4)} APT
        </Text>
        {isPriceAvailable ? (
          <Text className="text-xs sm:text-sm text-gray-400"> 
            ~ ${usdValue.toFixed(2)} USD
          </Text>
        ) : (
          <Text className="text-xs sm:text-sm text-gray-400">~ USD (price unavailable)</Text>
        )}
      </div>
    </div>
  );
};

const ResultsDisplay = ({
  rewards,
  aptPriceUSD,
  showResults,
  isLoading,
  isPriceAvailable
}) => {

  const periodIcons = {
    Daily: Sun,
    Weekly: CalendarRange,
    Monthly: CalendarHeart,
    Yearly: CalendarCheck2,
  };

  if (isLoading && !showResults) {
    return (
      <div className="text-center py-10">
        <Spin size="large" />
        <p className="text-gray-400 mt-3 text-base">Calculating returns...</p>
      </div>
    );
  }

  if (!showResults && !isLoading) {
    return (
      <div className="mt-6 p-4 bg-blue-600 bg-opacity-20 text-blue-200 rounded-lg text-sm flex items-center gap-3 border border-blue-500/30">
        <Info size={20} />
        <div>
            <p className="font-semibold">Enter APT Amount</p>
            <p className="text-blue-300/80">Input the amount of APT you plan to stake to see potential earnings.</p>
        </div>
      </div>
    );
  }

  if ((!rewards || rewards.length === 0) && showResults && !isLoading) {
     return (
      <div className="mt-6 p-4 bg-yellow-500 bg-opacity-20 text-yellow-200 rounded-lg text-sm flex items-center gap-3 border border-yellow-500/30">
        <AlertTriangle size={20} />
        <div>
            <p className="font-semibold">Failed to Calculate Returns</p>
            <p className="text-yellow-300/80">Could not calculate returns. Please check your input and ensure network APY is available.</p>
        </div>
      </div>
    );
  }

  if (!rewards || rewards.length === 0) {
    return null;
  }

  return (
    
    <div className="mt-0"> 
      <Title level={2} className="!text-xl sm:!text-2xl !font-semibold !mb-4 !text-gray-100 flex items-center gap-2">
        <TrendingUp size={24} className="text-zinc-400" />
        Expected Returns
      </Title>
      
      <div className="divide-y divide-gray-700/50"> 
        {rewards.map((reward) => (
          <ResultInfoRow
            key={reward.period}
            label={`${reward.period} Earnings`}
            aptValue={reward.apt}
            usdValue={reward.usd}
            isPriceAvailable={isPriceAvailable}
            icon={periodIcons[reward.period] || CalendarDays}
          />
        ))}
      </div>

      {isPriceAvailable && aptPriceUSD !== null && aptPriceUSD !== undefined && (
         <Text className="text-xs mt-5 block text-center text-gray-400">
            *USD calculation based on 1 APT = ${aptPriceUSD.toFixed(2)} USD.
        </Text>
      )}
    </div>
  );
};

export default ResultsDisplay;