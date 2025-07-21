import React from 'react';
import { Typography, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  Sun,
  CalendarRange,
  CalendarHeart,
  CalendarCheck2,
  CalendarDays,
  AlertTriangle,
  Info
} from 'lucide-react';

const { Title, Text } = Typography;

const ResultInfoRow = ({ label, aptValue, usdValue, isPriceAvailable, icon: Icon, t }) => {
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
          <Text className="text-xs sm:text-sm text-gray-400">{t('apyCalculatorPage.resultsDisplay.priceUnavailable')}</Text>
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
  const { t } = useTranslation();

  const periodKeys = {
    [t('apyCalculatorPage.results.daily')]: Sun,
    [t('apyCalculatorPage.results.weekly')]: CalendarRange,
    [t('apyCalculatorPage.results.monthly')]: CalendarHeart,
    [t('apyCalculatorPage.results.yearly')]: CalendarCheck2,
  };

  if (isLoading && !showResults) {
    return (
      <div className="text-center py-10">
        <Spin size="large" />
        <p className="text-gray-400 mt-3 text-base">{t('apyCalculatorPage.resultsDisplay.calculating')}</p>
      </div>
    );
  }

  if (!showResults && !isLoading) {
    return (
      <div className="mt-6 p-4 bg-blue-600 bg-opacity-20 text-blue-200 rounded-lg text-sm flex items-center gap-3 border border-blue-500/30">
        <Info size={20} />
        <div>
            <p className="font-semibold">{t('apyCalculatorPage.resultsDisplay.prompt.title')}</p>
            <p className="text-blue-300/80">{t('apyCalculatorPage.resultsDisplay.prompt.description')}</p>
        </div>
      </div>
    );
  }

  if ((!rewards || rewards.length === 0) && showResults && !isLoading) {
     return (
      <div className="mt-6 p-4 bg-yellow-500 bg-opacity-20 text-yellow-200 rounded-lg text-sm flex items-center gap-3 border border-yellow-500/30">
        <AlertTriangle size={20} />
        <div>
            <p className="font-semibold">{t('apyCalculatorPage.resultsDisplay.error.title')}</p>
            <p className="text-yellow-300/80">{t('apyCalculatorPage.resultsDisplay.error.description')}</p>
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
        {t('apyCalculatorPage.resultsDisplay.title')}
      </Title>
      
      <div className="divide-y divide-gray-700/50">
        {rewards.map((reward) => (
          <ResultInfoRow
            key={reward.period}
            label={t('apyCalculatorPage.resultsDisplay.rowLabel', { period: reward.period })}
            aptValue={reward.apt}
            usdValue={reward.usd}
            isPriceAvailable={isPriceAvailable}
            icon={periodKeys[reward.period] || CalendarDays}
            t={t}
          />
        ))}
      </div>

      {isPriceAvailable && aptPriceUSD !== null && aptPriceUSD !== undefined && (
         <Text className="text-xs mt-5 block text-center text-gray-400">
            {t('apyCalculatorPage.resultsDisplay.priceFootnote', { price: aptPriceUSD.toFixed(2) })}
        </Text>
      )}
    </div>
  );
};

export default ResultsDisplay;