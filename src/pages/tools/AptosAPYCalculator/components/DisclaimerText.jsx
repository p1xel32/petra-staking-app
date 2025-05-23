// src/pages/tools/AptosAPYCalculator/components/DisclaimerText.jsx
import React from 'react';
// Removed Typography import from AntD if not strictly needed, can use <p>
// import { Typography } from 'antd';
// const { Text } = Typography;

const DisclaimerText = () => {
  return (
    // Using <p> for semantic correctness, styled to match notes
    <p className="text-xs block text-center text-gray-500 px-2 mt-6">
      *All calculations are approximate and based on the current/specified APY and APT/USD exchange rate.
      APY and exchange rates are subject to change. This tool does not constitute financial advice.
      Staking income is subject to validator commission fees, which are not factored into these calculations.
      Note that actual rewards in the Aptos network are distributed per epoch.
    </p>
  );
};

export default DisclaimerText;