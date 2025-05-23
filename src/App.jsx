// src/App.jsx
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ConfigProvider, theme as antTheme } from 'antd';

import Layout from './components/Layout/Layout'; 
import MainStakingPage from './pages/MainStakingPage/MainStakingPage';
import AptosAPYCalculatorPage from './pages/tools/AptosAPYCalculator/AptosAPYCalculatorPage';
import AptosLockupVisualizerPage from './pages/tools/AptosLockupVisualizer/AptosLockupVisualizerPage'; // New Import

import './index.css'; 
// import { WalletProvider } from './walletProvider'; // Assuming this is handled in main.jsx or here

const PageLoader = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
  </div>
);

function App() {
  const isDarkMode = document.documentElement.classList.contains('dark');

  return (
    <HelmetProvider>
      {/* <WalletProvider> */}
      <ConfigProvider
        theme={{
          algorithm: isDarkMode ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
          token: {
            colorPrimary: '#a855f7', 
          },
        }}
      >
        <BrowserRouter>
          <Layout> 
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<MainStakingPage />} />
                <Route path="/tools/aptos-staking-apy-calculator" element={<AptosAPYCalculatorPage />} />
                <Route path="/tools/aptos-staking-lockup-visualizer" element={<AptosLockupVisualizerPage />} /> {/* New Route */}
                <Route path="*" element={<Navigate to="/" replace />} /> 
              </Routes>
            </Suspense>
          </Layout>
        </BrowserRouter>
      </ConfigProvider>
      {/* </WalletProvider> */}
    </HelmetProvider>
  );
}

export default App;
