import React from 'react';
import { useTranslation } from 'react-i18next';

const LockupDisclaimer = () => {
  const { t } = useTranslation();
  return (
    <p className="text-xs text-center text-zinc-500 px-2 leading-relaxed">
      {t('lockupVisualizerPage.disclaimer.text')}
    </p>
  );
};

export default LockupDisclaimer;