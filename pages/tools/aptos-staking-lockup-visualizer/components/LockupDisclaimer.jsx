// --- START OF FILE LockupDisclaimer.jsx ---

import React from 'react';

const LockupDisclaimer = () => {
  return (
    <p className="text-xs text-center text-zinc-500 px-2 leading-relaxed">
      *All timeline calculations are estimates based on current Aptos network parameters (such as recurring lockup duration and epoch interval) and the provided initiation time. 
      Actual unlock times occur at epoch boundaries and may vary slightly due to network conditions or changes in network parameters. This tool does not constitute financial advice. 
      Always verify critical information with official Aptos documentation or directly with your validator if applicable.
    </p>
  );
};

export default LockupDisclaimer;