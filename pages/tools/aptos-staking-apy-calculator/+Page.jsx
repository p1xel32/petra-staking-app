//+Page.jsx
import React from 'react';
import AptosAPYCalculatorPage from '../../../src/pages/tools/AptosAPYCalculator/AptosAPYCalculatorPage'; // Adjust path
import { Helmet, HelmetProvider } from '@/lib/helmet';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Interactive Aptos (APT) Staking APY Calculator – Estimate Your Rewards | aptcore.one</title>
        <meta name="description" content="Easily calculate your potential Aptos (APT) staking rewards with aptcore.one's free APY calculator. Input stake amount & see estimated daily, monthly, and yearly earnings." />
      </Helmet>
      <AptosAPYCalculatorPage />
    </>
  );
}
