import React, { useEffect, useState, useCallback } from 'react';
import { Aptos, Network, AccountAddress } from '@aptos-labs/ts-sdk';

// Initialize Aptos client for Mainnet
const client = new Aptos({
  network: Network.MAINNET,
});

// --- Configuration ---
// Validator's pool address (owner address)
const VALIDATOR_POOL_ADDRESS = '0xf747e3a6282cc0dee1c89239c529b039c64fe48e88b50e5cedd40e9c094800bb';
// Aptos framework address for global resources
const FRAMEWORK_ADDRESS = '0x1';
// Resource paths - Verify these against current Aptos Mainnet using an explorer if issues arise
// These paths and field names below are based on our successful debugging session.
const STAKING_CONFIG_RESOURCE_TYPE = '0x1::staking_config::StakingConfig';
const BLOCK_RESOURCE_TYPE = '0x1::block::BlockResource';
const OCTAS_PER_APT = 100_000_000;

// Helper function to format remaining seconds into a human-readable string
function formatRemainingTime(totalSeconds) {
  if (totalSeconds <= 0) {
    return "Unlocked";
  }
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  let result = "in ";
  if (days > 0) result += `${days}d `;
  if (hours > 0 || days > 0) result += `${hours}h `;
  if (days === 0 && (hours > 0 || days > 0) ) result += `${minutes}m`; // Show minutes only if less than a day and hours are shown
  else if (days === 0 && hours === 0) result += `${minutes}m`; // Show only minutes if less than an hour


  return result.trim();
}

// Component to display validator info, APR, user's stake, and pool lockup time
function ValidatorInfo({ account, refreshTrigger }) { // 'account' can be null, 'refreshTrigger' updates data
  // State for general validator info (total delegated, commission)
  const [info, setInfo] = useState(null);
  // State for calculated Gross APR percentage
  const [grossApr, setGrossApr] = useState(null);
  // State for calculated Net APR percentage
  const [netApr, setNetApr] = useState(null);
  // User's stake details
  const [userActiveStakeApt, setUserActiveStakeApt] = useState(0);
  const [userInactiveStakeApt, setUserInactiveStakeApt] = useState(0); // This is the withdrawable amount
  const [userPendingInactiveStakeApt, setUserPendingInactiveStakeApt] = useState(0);
  // Pool lockup info
  const [unlockTimestamp, setUnlockTimestamp] = useState(null); // Raw timestamp in seconds
  // UI states
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState(null);

  // Memoized function to fetch all data
  const fetchUserAndPoolData = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Reset data before fetching to ensure UI consistency during refresh
    setInfo(null);
    setGrossApr(null);
    setNetApr(null);
    setUserActiveStakeApt(0);
    setUserInactiveStakeApt(0);
    setUserPendingInactiveStakeApt(0);
    setUnlockTimestamp(null);

    try {
      // --- Fetch Required Resources Concurrently ---
      // Common resources are always fetched
      const commonPromises = [
        client.getAccountResources({ accountAddress: VALIDATOR_POOL_ADDRESS }),
        client.getAccountResource({ accountAddress: FRAMEWORK_ADDRESS, resourceType: STAKING_CONFIG_RESOURCE_TYPE }),
        client.getAccountResource({ accountAddress: FRAMEWORK_ADDRESS, resourceType: BLOCK_RESOURCE_TYPE }),
      ];

      // User-specific resource is fetched only if account is provided
      if (account) {
        commonPromises.push(
          client.view({
            payload: {
              function: '0x1::delegation_pool::get_stake',
              functionArguments: [VALIDATOR_POOL_ADDRESS, account],
            }
          })
        );
      }

      const results = await Promise.all(commonPromises);

      const validatorResources = results[0];
      const stakingConfigResource = results[1];
      const blockInfoResource = results[2];
      const userStakeResult = account ? results[3] : null; // Only present if account was provided

      // --- Process Validator Info ---
      const delegation = validatorResources.find(r => r.type.startsWith('0x1::delegation_pool::DelegationPool'));
      const pool = validatorResources.find(r => r.type === '0x1::stake::StakePool'); // For lockup info

      // --- Validate Fetched Resources ---
      if (!delegation || !pool || !stakingConfigResource || !blockInfoResource) {
        let missing = [];
        if (!delegation) missing.push("DelegationPool");
        if (!pool) missing.push("StakePool");
        if (!stakingConfigResource) missing.push(STAKING_CONFIG_RESOURCE_TYPE);
        if (!blockInfoResource) missing.push(BLOCK_RESOURCE_TYPE);
        throw new Error(`Required resource object(s) not found: ${missing.join(', ')}. Verify validator address and resource paths.`);
      }

      // Assuming SDK returns data directly on the resource object
      const configData = stakingConfigResource;
      const blockData = blockInfoResource;

      // Extract basic info & commission
      const totalCoins = BigInt(delegation.data.active_shares.total_coins);
      const delegatedAmountApt = Number(totalCoins) / OCTAS_PER_APT;
      const rawCommissionValue = Number(delegation.data.operator_commission_percentage);
      const commissionDisplayPercentage = rawCommissionValue / 100;
      const commissionRate = rawCommissionValue / 10000;

      // Extract pool lockup timestamp
      const lockedUntilSecs = Number(pool.data.locked_until_secs);
      setUnlockTimestamp(lockedUntilSecs);

      // --- Calculate Gross APR ---
      // Field names are based on successful debugging (rewards_rate, etc.)
      if (configData.rewards_rate === undefined || configData.rewards_rate_denominator === undefined || blockData.epoch_interval === undefined) {
         console.error("Config Data for APR:", configData);
         console.error("Block Data for APR:", blockData);
         throw new Error(`Could not find required fields (rewards_rate, rewards_rate_denominator, epoch_interval) in fetched resources. Check console and verify field names.`);
      }

      const rewardRate = BigInt(configData.rewards_rate);
      const denominator = BigInt(configData.rewards_rate_denominator);
      const epochIntervalMicroseconds = BigInt(blockData.epoch_interval);

      let calculatedGrossApr = null;
      if (denominator !== 0n && epochIntervalMicroseconds !== 0n) {
          const epochIntervalSeconds = epochIntervalMicroseconds / 1_000_000n;
          const secondsPerYear = 31_536_000n;
          const epochsPerYear = secondsPerYear / epochIntervalSeconds;
          const scaleFactor = 10000n;
          const scaledAnnualRateNumerator = rewardRate * epochsPerYear * scaleFactor;
          const scaledAnnualRateBasisPoints = scaledAnnualRateNumerator / denominator;
          calculatedGrossApr = Number(scaledAnnualRateBasisPoints) / 100;
      } else {
           console.warn("Denominator or epoch interval is zero, cannot calculate APR.");
      }

      // --- Calculate Net APR ---
      let calculatedNetApr = null;
      if (calculatedGrossApr !== null) {
          calculatedNetApr = calculatedGrossApr * (1 - commissionRate);
      }

      // --- Update Component State for Pool Info ---
      setInfo({
        poolAddress: VALIDATOR_POOL_ADDRESS,
        delegated: delegatedAmountApt,
        commission: commissionDisplayPercentage,
      });
      setGrossApr(calculatedGrossApr !== null ? calculatedGrossApr.toFixed(2) : null);
      setNetApr(calculatedNetApr !== null ? calculatedNetApr.toFixed(2) : null);

      // --- Process User Stake Info (only if account was provided and data fetched) ---
      if (account && userStakeResult) {
        if (Array.isArray(userStakeResult) && userStakeResult.length >= 3) {
            setUserActiveStakeApt(Number(BigInt(userStakeResult[0])) / OCTAS_PER_APT);
            setUserInactiveStakeApt(Number(BigInt(userStakeResult[1])) / OCTAS_PER_APT); // This is the withdrawable amount
            setUserPendingInactiveStakeApt(Number(BigInt(userStakeResult[2])) / OCTAS_PER_APT);
        } else {
            console.warn("Unexpected result format from get_stake for user stakes.", userStakeResult);
            // Keep user stakes at 0 if data is malformed
        }
      }
      // If account is null, user stake states remain 0 (their initial values)

    } catch (err) {
      console.error('Error in fetchUserAndPoolData:', err);
      setError(err.message || 'Failed to fetch or process data');
    } finally {
      setLoading(false); // Stop loading indicator
    }
  }, [account]); // useCallback dependency on account

  // useEffect to trigger data fetch when account or refreshTrigger changes
  useEffect(() => {
    console.log("ValidatorInfo: Fetching data. Account:", account, "RefreshTrigger:", refreshTrigger);
    fetchUserAndPoolData();
  }, [account, fetchUserAndPoolData, refreshTrigger]); // Added refreshTrigger

  // Derived values for display
  const unlockDateString = unlockTimestamp ? new Date(unlockTimestamp * 1000).toLocaleString() : 'N/A';
  const nowSeconds = Math.floor(Date.now() / 1000);
  const remainingSeconds = unlockTimestamp ? unlockTimestamp - nowSeconds : -1;
  const unlockRemainingString = unlockTimestamp ? formatRemainingTime(remainingSeconds) : 'N/A';

  // --- Render Logic ---
  // Show loading state if loading OR if info is null (initial load before account prop might be set)
  if (loading || (!info && !error)) {
      return <p className="text-center mt-4">Loading validator info...</p>;
  }

  // Show error state
  if (error) {
      return <p className="text-center text-red-600 mt-4">Error: {error}</p>;
  }

  // Render the fetched and calculated information
  return (
    <div className="mt-6 mb-4 text-center p-4 border rounded-xl shadow-2xl bg-gray-800 w-full"> {/* Matched styling from App.jsx */}
      {/* General Pool Info Section */}
      <h2 className="text-xl font-semibold mb-3 text-gray-100">Validator Pool Info</h2>
      <p className="text-sm text-gray-400 break-all">
        <strong>Address:</strong> {info.poolAddress}
      </p>
      <p className="text-gray-300">
        <strong>Total Delegated:</strong> {info.delegated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} APT
      </p>
      <p className="text-gray-300">
        <strong>Commission:</strong> {info.commission.toFixed(2)} %
      </p>
      <p className="text-gray-300 font-medium">
        <strong>Estimated Net APR:</strong> {netApr ?? 'N/A'}%
        {grossApr !== null && (
            <span className="text-sm text-gray-500"> (Gross: {grossApr}% — estimated from current protocol reward rate)</span>
        )}
        {grossApr === null && netApr === null && !loading && !error && (
             <span className="text-sm text-gray-500"> (APR calculation unavailable)</span>
        )}
      </p>
      <p className="text-gray-300 mt-1">
          <strong>Pool Lockup Ends:</strong> {unlockDateString}
          {unlockTimestamp && remainingSeconds > 0 && (
               <span className="text-sm text-gray-500"> ({unlockRemainingString})</span>
          )}
           {unlockTimestamp && remainingSeconds <= 0 && (
               <span className="text-sm text-green-400"> (Unlocked)</span>
          )}
      </p>

      {/* User Specific Info Section - Render only if account is connected */}
      {account && (
        <>
          <hr className="my-4 border-t border-gray-700"/>
          <h2 className="text-xl font-semibold mb-3 text-gray-100">Your Stake in this Pool</h2>
          <p className="text-lg text-green-400">
             <strong>Active:</strong> {userActiveStakeApt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} APT
          </p>
          <p className="text-lg text-yellow-400">
             <strong>Pending Inactive (Unstaking):</strong> {userPendingInactiveStakeApt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} APT
          </p>
          <p className="text-lg text-blue-400">
             <strong>Inactive (Withdrawable):</strong> {userInactiveStakeApt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} APT
          </p>
        </>
      )}
    </div>
  );
}
export default ValidatorInfo;
