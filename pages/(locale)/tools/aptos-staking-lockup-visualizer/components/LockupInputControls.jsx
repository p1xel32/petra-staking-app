import React from 'react';
import { PlayCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LockupInputControls = ({ onVisualize }) => {
  const { t } = useTranslation();

  return (
    <div className="flex justify-center">
      <button
        onClick={() => onVisualize(Date.now())}
        type="button"
        className="w-full max-w-sm flex items-center justify-center gap-x-2.5 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-purple-500 transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-100"
      >
        <PlayCircle size={20} />
        {t('lockupVisualizerPage.inputControls.visualizeNowButton')}
      </button>
    </div>
  );
};

export default LockupInputControls;