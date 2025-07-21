import React from 'react';
import { useTranslation } from 'react-i18next';

const DisclaimerText = () => {
  const { t } = useTranslation();

  return (
    <p className="text-xs block text-center text-gray-500 px-2 mt-6">
      {t('apyCalculatorPage.disclaimer.text')}
    </p>
  );
};

export default DisclaimerText;