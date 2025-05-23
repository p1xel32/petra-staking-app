// src/pages/tools/AptosLockupVisualizer/components/LockupInputControls.jsx
import React from 'react';
import { PlayCircle } from 'lucide-react'; // Using Lucide icon

const LockupInputControls = ({ onVisualize }) => {
  // V1: Simple button to visualize from now.
  // Future V2 could include a date/time picker here.

  return (
    <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-slate-800/40 backdrop-blur-md border border-slate-700/60 rounded-xl shadow-md">
      <h3 className="text-xl font-semibold text-white mb-3">
        Set Unstake Initiation Time
      </h3>
      <p className="text-slate-300 text-sm mb-4">
        Calculate the unstaking timeline based on the current time. Custom date/time selection will be available in a future update.
      </p>
      <button 
        onClick={() => onVisualize(Date.now())}
        type="button"
        className="w-full flex items-center justify-center gap-x-2.5 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-100"
      >
        <PlayCircle size={20} />
        Visualize Unstaking From Now
      </button>
    </div>
  );
};

export default LockupInputControls;
