// src/pages/tools/AptosLockupVisualizer/components/LockupDisclaimer.jsx
import React from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

const LockupDisclaimer = () => {
  return (
    <Text className="text-xs block text-center text-zinc-400 px-2 leading-relaxed"> {/* Matched note color and leading */}
      *All timeline calculations are estimates based on current Aptos network parameters (such as recurring lockup duration and epoch interval) and the provided initiation time. 
      Actual unlock times occur at epoch boundaries and may vary slightly due to network conditions or changes in network parameters. This tool does not constitute financial advice. 
      Always verify critical information with official Aptos documentation or directly with your validator if applicable.
    </Text>
  );
};

export default LockupDisclaimer;
