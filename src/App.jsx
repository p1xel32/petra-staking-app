import React, { useState, useCallback } from 'react';
import ValidatorInfo from './components/ValidatorInfo';
import StakeUnstakeControls from './components/StakeUnstakeControls';
import './index.css'; // Your main Tailwind CSS file

// Import the standard WalletSelector from the Ant Design UI package
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';
// Import the useWallet hook to get wallet state
import { useWallet } from '@aptos-labs/wallet-adapter-react';

function App() {
  // Get connection state and account info directly from the useWallet hook
  const { account, connected } = useWallet();

  // Safely get the address as a string; will be null if not connected
  const userAccountAddress = account?.address ? account.address.toString() : null;

  // State to trigger data refresh in child components after a successful transaction
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Callback function to increment the refresh counter, memoized with useCallback
  const triggerRefresh = useCallback(() => {
    console.log("App: Triggering data refresh for child components.");
    setRefreshCounter(prev => prev + 1);
  }, []); // Empty dependency array means this function is created once

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 font-sans">
      {/* Header Section */}
      <header className="w-full max-w-6xl mx-auto flex justify-between items-center py-4 px-2 md:px-0 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-100">
          Aptos Staking App
        </h1>
        {/* WalletSelector button from Ant Design adapter UI package */}
        <WalletSelector />
      </header>

      {/* Main Content Area */}
      <main className="w-full flex flex-col items-center">
        <div className="w-full max-w-xl flex flex-col items-center gap-8">
          {/* Validator Info Card - Always visible.
              It will handle the 'account' prop being null internally. */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-2xl w-full">
            <ValidatorInfo
              account={userAccountAddress} // Pass null if not connected
              refreshTrigger={refreshCounter} // Pass the counter to trigger re-fetch
            />
          </div>

          {/* Staking Controls Card - Visible only if the wallet is connected */}
          {connected && userAccountAddress ? (
            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl w-full">
              <StakeUnstakeControls
                account={userAccountAddress}
                onTransactionSuccess={triggerRefresh} // Pass callback to trigger refresh
              />
            </div>
          ) : (
            // Message to prompt connection if wallet is not connected,
            // shown below the always-visible ValidatorInfo
            <div className="mt-8 text-center bg-gray-800 p-6 rounded-xl shadow-2xl w-full">
              <h2 className="text-2xl font-semibold mb-4 text-gray-100">Ready to Stake?</h2>
              <p className="text-lg text-gray-400 mb-6">
                Connect your wallet to manage your stake and interact with the pool.
              </p>
              {/* WalletSelector is already in the header, but another could be placed here for emphasis if desired */}
            </div>
          )}
        </div>
      </main>

      {/* Footer Section */}
      <footer className="w-full max-w-6xl mx-auto text-center py-8 mt-12 text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Aptos Staking App. Stake responsibly.</p>
      </footer>
    </div>
  );
}

export default App;
