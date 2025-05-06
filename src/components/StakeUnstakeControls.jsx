import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, Network } from '@aptos-labs/ts-sdk';

// --- Configuration ---
const client = new Aptos({ network: Network.MAINNET });
const VALIDATOR_POOL_ADDRESS = '0xf747e3a6282cc0dee1c89239c529b039c64fe48e88b50e5cedd40e9c094800bb';
const OCTAS_PER_APT = 100_000_000;
const MIN_STAKE_APT = 11; // Minimum stake amount for delegation is typically 11 APT

// This component handles stake, unstake, and withdraw actions.
// It expects an 'account' prop (connected user's address string)
// and an 'onTransactionSuccess' callback to trigger data refresh in parent.
function StakeUnstakeControls({ account, onTransactionSuccess }) {
  const { signAndSubmitTransaction } = useWallet();
  const [amountApt, setAmountApt] = useState('');
  const [withdrawableAmountApt, setWithdrawableAmountApt] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txResult, setTxResult] = useState(null);
  const [txError, setTxError] = useState(null);
  const [isFetchingWithdrawable, setIsFetchingWithdrawable] = useState(false);

  // Fetches the amount of stake that is inactive and ready for withdrawal
  const fetchWithdrawableStake = useCallback(async () => {
    if (!account) {
      setWithdrawableAmountApt(0);
      return;
    }
    setIsFetchingWithdrawable(true);
    setWithdrawableAmountApt(0);
    try {
      const result = await client.view({
        payload: {
          function: '0x1::delegation_pool::get_stake',
          functionArguments: [VALIDATOR_POOL_ADDRESS, account],
        }
      });
      // Index 1 of the result is the inactive (withdrawable) stake
      if (result && Array.isArray(result) && result.length >= 2) {
        const withdrawableOctas = BigInt(result[1]);
        setWithdrawableAmountApt(Number(withdrawableOctas) / OCTAS_PER_APT);
      } else {
         console.warn("Unexpected result format from get_stake for withdrawable amount.", result);
         setWithdrawableAmountApt(0);
      }
    } catch (error) {
      console.error("Failed to fetch withdrawable amount:", error);
      setWithdrawableAmountApt(0);
    } finally {
      setIsFetchingWithdrawable(false);
    }
  }, [account]);

  // Fetch withdrawable amount on component mount and when account changes
  useEffect(() => {
    fetchWithdrawableStake();
  }, [account, fetchWithdrawableStake]);

  // Generic handler for submitting stake, unstake, or withdraw transactions
  const handleTransaction = async (actionType, functionName, amountOctas) => {
     if (!account || isSubmitting) {
       setTxError("Wallet not connected or already submitting.");
       return;
     }
     if (typeof signAndSubmitTransaction !== 'function') {
       setTxError("signAndSubmitTransaction function is not available from wallet adapter.");
       return;
     }

    setIsSubmitting(true);
    setTxError(null);
    setTxResult(null);

    // Structure the payload as { data: { ... } }
    const transactionData = {
      function: `0x1::delegation_pool::${functionName}`,
      functionArguments: [
          VALIDATOR_POOL_ADDRESS,
          amountOctas // This is already a BigInt representing whole Octas
      ],
      typeArguments: [],
    };
    const transactionInput = { data: transactionData };

    console.log(`Attempting signAndSubmit ${actionType} with structure:`, transactionInput);

    try {
      const result = await signAndSubmitTransaction(transactionInput);
      console.log(`${actionType} Tx Submitted and Confirmed:`, result);
      setTxResult(`${actionType} successful! Tx hash: ${result.hash}`);

      // Refresh local withdrawable amount
      fetchWithdrawableStake();
      // Trigger refresh in parent component (e.g., App.jsx to refresh ValidatorInfo)
      if (onTransactionSuccess) {
        onTransactionSuccess();
      }
      alert(`${actionType} successful! Data will refresh shortly.`);
    } catch (error) {
      console.error(`${actionType} failed:`, error);
      let errorMessage = error.message || String(error);
      if (errorMessage.includes('User has rejected the request') || (error && error.code === 4001)) {
        errorMessage = 'Transaction rejected by user.';
      } else if (error.errorCode === 'invalid_argument' && error.message && error.message.includes('EDELEGATOR_ACTIVE_BALANCE_TOO_LOW')) {
        errorMessage = `Stake amount is too low. The resulting active balance would be less than the required minimum (approx. ${MIN_STAKE_APT} APT after fees).`;
      }
      // Catch the internal adapter error if it still occurs (hopefully not with latest fixes)
      else if (errorMessage.includes("Cannot use 'in' operator")) {
        errorMessage = `Internal adapter error (${errorMessage}). Please ensure wallet adapter and SDK versions are compatible or check for known issues.`;
      }
      console.error("Raw transaction error object:", error);
      setTxError(`Error during ${actionType}: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for the "Stake" button
  const handleStake = () => {
    const amount = parseFloat(amountApt);
    if (isNaN(amount) || amount <= 0) {
      setTxError("Please enter a valid amount > 0 to stake.");
      return;
    }
    if (amount < MIN_STAKE_APT) {
      setTxError(`Minimum stake amount is ${MIN_STAKE_APT} APT.`);
      return;
    }
    handleTransaction("Stake", "add_stake", BigInt(Math.floor(amount * OCTAS_PER_APT)));
  };

  // Handler for the "Unstake" button
  const handleUnstake = () => {
    const amount = parseFloat(amountApt);
    if (isNaN(amount) || amount <= 0) {
      setTxError("Please enter a valid amount > 0 to unstake.");
      return;
    }
    handleTransaction("Unstake", "unlock", BigInt(Math.floor(amount * OCTAS_PER_APT)));
  };

  // Handler for the "Withdraw" button
  const handleWithdraw = () => {
    if (withdrawableAmountApt <= 0) {
      setTxError("No withdrawable amount available.");
      return;
    }
    const amountOctas = BigInt(Math.floor(withdrawableAmountApt * OCTAS_PER_APT));
    if (amountOctas <= 0n) {
      setTxError("Withdrawable amount is too small (calculates to zero Octas).");
      return;
    }
    handleTransaction("Withdraw", "withdraw", amountOctas);
  };

   return (
    // Apply similar card styling as ValidatorInfo from App.jsx
    // Removed 'mt-6' as App.jsx now uses gap-8 for spacing between cards
    <div className="p-6 rounded-xl shadow-2xl bg-gray-800 w-full">
      <h2 className="text-xl font-semibold mb-4 text-gray-100">Staking Controls</h2> {/* Text color for dark theme */}
      
      {/* Amount Input Field */}
      <div className="mb-4">
        <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1"> {/* Text color for dark theme */}
          Amount (APT) for Stake / Unstake
        </label>
        <input
          type="number"
          id="amount"
          name="amount"
          // Dark theme styles for input
          className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
          placeholder={`e.g., ${MIN_STAKE_APT} (min stake)`}
          value={amountApt}
          onChange={(e) => {
            setAmountApt(e.target.value);
            setTxError(null);
            setTxResult(null);
          }}
          disabled={isSubmitting}
        />
      </div>

      {/* Stake and Unstake Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <button
          onClick={handleStake}
          disabled={isSubmitting || !amountApt || parseFloat(amountApt) <= 0}
          className="flex-1 px-4 py-2 bg-green-500 text-white font-semibold rounded-md shadow-sm hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Stake'}
        </button>
        <button
          onClick={handleUnstake}
          disabled={isSubmitting || !amountApt || parseFloat(amountApt) <= 0}
          className="flex-1 px-4 py-2 bg-yellow-500 text-white font-semibold rounded-md shadow-sm hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Unstake'}
        </button>
      </div>

      {/* Withdraw Section */}
      <div className="border-t border-gray-700 pt-4 mt-4"> {/* Dark theme border */}
         <p className="text-sm text-gray-300 mb-2"> {/* Text color for dark theme */}
            Withdrawable Amount: {isFetchingWithdrawable ? 'Loading...' : `${withdrawableAmountApt.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 8})} APT`}
            <button
              onClick={fetchWithdrawableStake}
              disabled={isFetchingWithdrawable || isSubmitting}
              className="ml-2 text-xs text-blue-400 hover:underline disabled:opacity-50" /* Dark theme link */
            >
              (Refresh)
            </button>
         </p>
         <button
           onClick={handleWithdraw}
           disabled={isSubmitting || isFetchingWithdrawable || withdrawableAmountApt <= 0}
           className="w-full px-4 py-2 bg-red-500 text-white font-semibold rounded-md shadow-sm hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
         >
           {isSubmitting ? 'Submitting...' : `Withdraw Available (${withdrawableAmountApt.toFixed(2)} APT)`}
         </button>
      </div>

      {/* Transaction Status/Error Messages */}
      {txError && (
        <p className="mt-4 text-sm text-red-400 bg-red-900 bg-opacity-30 p-2 rounded break-all"> {/* Dark theme error */}
          Error: {txError}
        </p>
      )}
      {txResult && (
        <p className="mt-4 text-sm text-green-400 bg-green-900 bg-opacity-30 p-2 rounded break-all"> {/* Dark theme success */}
          Status: {txResult}
        </p>
      )}
       <p className="text-xs text-gray-500 mt-3">
         Note: Unstaking requires a lock-up period before funds can be withdrawn. Transactions may take a few moments to confirm. Minimum stake is typically {MIN_STAKE_APT} APT.
       </p>
    </div>
  );
}

export default StakeUnstakeControls;
