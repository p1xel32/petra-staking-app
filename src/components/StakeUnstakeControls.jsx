import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, Network } from '@aptos-labs/ts-sdk';
import { CheckCircle, AlertTriangle, RefreshCw, TrendingUp, TrendingDown, Download, Loader2 } from 'lucide-react';

// --- Configuration ---
const client = new Aptos({ network: Network.MAINNET });
const VALIDATOR_POOL_ADDRESS = '0xf747e3a6282cc0dee1c89239c529b039c64fe48e88b50e5cedd40e9c094800bb';
const OCTAS_PER_APT = 100_000_000;
const MIN_STAKE_APT = 11; // Minimum stake amount for delegation

// This component handles stake, unstake, and withdraw actions.
function StakeUnstakeControls({ account, onTransactionSuccess }) {
  const { signAndSubmitTransaction } = useWallet();
  const [amountApt, setAmountApt] = useState('');
  const [withdrawableAmountApt, setWithdrawableAmountApt] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txResult, setTxResult] = useState(null); // Stores { type: 'success', message: string }
  // *** State declaration for txError was missing, now added ***
  const [txError, setTxError] = useState(null);   // Stores { message: string } or null
  const [isFetchingWithdrawable, setIsFetchingWithdrawable] = useState(false);

  // Fetches the amount of stake that is inactive and ready for withdrawal
  const fetchWithdrawableStake = useCallback(async () => {
    if (!account) {
      setWithdrawableAmountApt(0);
      return;
    }
    setIsFetchingWithdrawable(true);
    setWithdrawableAmountApt(0); // Reset while fetching
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
      setWithdrawableAmountApt(0); // Reset in case of error
    } finally {
      setIsFetchingWithdrawable(false);
    }
  }, [account]); // Dependency: 'account'

  // Fetch withdrawable amount on component mount and when account changes
  useEffect(() => {
    fetchWithdrawableStake();
  }, [account, fetchWithdrawableStake]);

  // Generic handler for submitting stake, unstake, or withdraw transactions
  const handleTransaction = async (actionType, functionName, amountOctas) => {
     if (!account || isSubmitting) {
       setTxError({ message: "Wallet not connected or already submitting." });
       return;
     }
     if (typeof signAndSubmitTransaction !== 'function') {
       setTxError({ message: "signAndSubmitTransaction function is not available from wallet adapter." });
       return;
     }

    setIsSubmitting(true);
    setTxError(null); // Reset error state before new transaction
    setTxResult(null); // Reset result state before new transaction

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
      setTxResult({ type: 'success', message: `${actionType} successful! Tx hash: ${result.hash}` });

      // Refresh local withdrawable amount and trigger refresh in parent
      fetchWithdrawableStake();
      if (onTransactionSuccess) {
        onTransactionSuccess();
      }
      setAmountApt(''); // Clear input on success
    } catch (error) {
      console.error(`${actionType} failed:`, error);
      let errorMessage = error.message || String(error);
      if (errorMessage.includes('User has rejected the request') || (error && error.code === 4001)) {
        errorMessage = 'Transaction rejected by user.';
      } else if (error.errorCode === 'invalid_argument' && error.message && error.message.includes('EDELEGATOR_ACTIVE_BALANCE_TOO_LOW')) {
        errorMessage = `Stake amount is too low. The resulting active balance would be less than the required minimum (approx. ${MIN_STAKE_APT} APT after fees).`;
      }
      else if (errorMessage.includes("Cannot use 'in' operator")) {
        errorMessage = `Internal adapter error (${errorMessage}). Please ensure wallet adapter and SDK versions are compatible or check for known issues.`;
      }
      console.error("Raw transaction error object:", error);
      setTxError({ message: `Error during ${actionType}: ${errorMessage}` }); // Ensure txError is set as an object
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for the "Stake" button
  const handleStake = () => {
    const amount = parseFloat(amountApt);
    if (isNaN(amount) || amount <= 0) { setTxError({ message: "Please enter a valid amount > 0 to stake." }); return; }
    if (amount < MIN_STAKE_APT) { setTxError({ message: `Minimum stake amount is ${MIN_STAKE_APT} APT.` }); return; }
    handleTransaction("Stake", "add_stake", BigInt(Math.floor(amount * OCTAS_PER_APT)));
  };

  // Handler for the "Unstake" button
  const handleUnstake = () => {
    const amount = parseFloat(amountApt);
    if (isNaN(amount) || amount <= 0) { setTxError({ message: "Please enter a valid amount > 0 to unstake." }); return; }
    handleTransaction("Unstake", "unlock", BigInt(Math.floor(amount * OCTAS_PER_APT)));
  };

  // Handler for the "Withdraw" button
  const handleWithdraw = () => {
    if (withdrawableAmountApt <= 0) { setTxError({ message: "No withdrawable amount available." }); return; }
    const amountOctas = BigInt(Math.floor(withdrawableAmountApt * OCTAS_PER_APT));
    if (amountOctas <= 0n) { setTxError({ message: "Withdrawable amount is too small (calculates to zero Octas)." }); return; }
    handleTransaction("Withdraw", "withdraw", amountOctas);
  };

   return (
    // The parent div in App.jsx provides: bg-gray-800/80 backdrop-blur-md border border-gray-700 p-6 rounded-2xl shadow-xl w-full
    // This component just defines its internal structure.
    <div className="w-full">
      <h2 className="text-2xl font-semibold mb-6 text-gray-100 text-center">Manage Your Stake</h2>

      <div className="mb-6">
        <label htmlFor="amount" className="block text-sm font-medium text-gray-400 mb-2">
          Amount (APT)
        </label>
        <div className="relative">
          <input
            type="number"
            id="amount"
            name="amount"
            className="w-full px-4 py-3 border border-gray-700 bg-gray-900 text-gray-100 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-500 text-lg transition-colors duration-150"
            placeholder={`e.g., ${MIN_STAKE_APT}`}
            value={amountApt}
            onChange={(e) => { setAmountApt(e.target.value); setTxError(null); setTxResult(null); }}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <button
          onClick={handleStake}
          disabled={isSubmitting || !amountApt || parseFloat(amountApt) <= 0}
          className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold rounded-xl shadow-lg hover:from-green-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-teal-400 transition-all duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <TrendingUp size={20} />}
          {isSubmitting ? 'Processing...' : 'Stake APT'}
        </button>
        <button
          onClick={handleUnstake}
          disabled={isSubmitting || !amountApt || parseFloat(amountApt) <= 0}
          className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl shadow-lg hover:from-yellow-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-orange-400 transition-all duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <TrendingDown size={20} />}
          {isSubmitting ? 'Processing...' : 'Unstake APT'}
        </button>
      </div>

      <div className="border-t border-gray-700 pt-6 mt-6">
         <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-gray-400">
                Withdrawable:
                <span className={`font-semibold ml-1 ${withdrawableAmountApt > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                    {isFetchingWithdrawable ? <Loader2 size={14} className="inline animate-spin" /> : `${withdrawableAmountApt.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 8})} APT`}
                </span>
            </p>
            <button
              onClick={fetchWithdrawableStake}
              disabled={isFetchingWithdrawable || isSubmitting}
              className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 flex items-center gap-1 transition-colors duration-150"
            >
              <RefreshCw size={14} /> Refresh
            </button>
         </div>
         <button
           onClick={handleWithdraw}
           disabled={isSubmitting || isFetchingWithdrawable || withdrawableAmountApt <= 0}
           className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:from-red-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-pink-500 transition-all duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
         >
           {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
           {isSubmitting ? 'Processing...' : `Withdraw Available`}
         </button>
      </div>

      {/* Ensure txError is checked before accessing .message */}
      {txError && txError.message && (
        <div className="mt-5 p-3 bg-red-800 bg-opacity-50 text-red-300 rounded-lg text-sm flex items-center gap-2 transition-opacity duration-300">
          <AlertTriangle size={18} /> <span>{txError.message}</span>
        </div>
      )}
      {/* Ensure txResult is checked before accessing .message */}
      {txResult && txResult.message && (
        <div className="mt-5 p-3 bg-green-800 bg-opacity-50 text-green-300 rounded-lg text-sm flex items-center gap-2 break-all transition-opacity duration-300">
          <CheckCircle size={18} /> <span>{txResult.message}</span>
        </div>
      )}
       <p className="text-xs text-gray-600 mt-6 text-center">
         Note: Unstaking requires a lock-up period. Minimum stake is {MIN_STAKE_APT} APT.
       </p>
    </div>
  );
}

export default StakeUnstakeControls;
