import React, { useEffect, useState } from 'react';
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
const STAKING_CONFIG_RESOURCE_TYPE = '0x1::staking_config::StakingConfig';
const BLOCK_RESOURCE_TYPE = '0x1::block::BlockResource';

// Component to display validator info, APR, and user's stake
function ValidatorInfo({ account }) {
  // State for general validator info
  const [info, setInfo] = useState(null);
  // State for calculated Gross APR percentage
  const [grossApr, setGrossApr] = useState(null);
  // State for calculated Net APR percentage
  const [netApr, setNetApr] = useState(null);
  // State for the connected user's staked amount
  const [userStakeApt, setUserStakeApt] = useState(null);
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Async function to fetch all required data
    const fetchData = async () => {
      // Don't fetch if the user isn't connected
      if (!account) {
        setInfo(null); setGrossApr(null); setNetApr(null); setUserStakeApt(null); setLoading(false); setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      setGrossApr(null); setNetApr(null); setUserStakeApt(null); // Reset calculated values

      try {
        // --- Fetch Required Resources Concurrently ---
        const promises = [
          // 1. Validator's resources (for commission, total delegated)
          client.getAccountResources({ accountAddress: VALIDATOR_POOL_ADDRESS }),
          // 2. Network staking config (for reward rate)
          client.getAccountResource({ accountAddress: FRAMEWORK_ADDRESS, resourceType: STAKING_CONFIG_RESOURCE_TYPE }),
          // 3. Network block info (for epoch duration)
          client.getAccountResource({ accountAddress: FRAMEWORK_ADDRESS, resourceType: BLOCK_RESOURCE_TYPE }),
          // 4. Connected user's stake in this pool
          client.view({
            payload: {
              function: '0x1::delegation_pool::get_stake',
              functionArguments: [VALIDATOR_POOL_ADDRESS, account],
            }
          })
        ];

        const [
            validatorResources,
            stakingConfigResource,
            blockInfoResource,
            userStakeResult
        ] = await Promise.all(promises).catch(err => {
             throw new Error(`Failed to fetch required data: ${err.message || String(err)}`);
        });

        // --- Process Validator Info ---
        const delegation = validatorResources.find(r => r.type.startsWith('0x1::delegation_pool::DelegationPool'));

        // --- Validate Fetched Resources ---
        if (!delegation || !stakingConfigResource || !blockInfoResource) {
          let missing = [];
          if (!delegation) missing.push("DelegationPool");
          if (!stakingConfigResource) missing.push(STAKING_CONFIG_RESOURCE_TYPE);
          if (!blockInfoResource) missing.push(BLOCK_RESOURCE_TYPE);
          throw new Error(`Required resource object(s) not found: ${missing.join(', ')}. Verify resource paths.`);
        }

        // Access data directly (assuming SDK returns data object, not nested under .data)
        const configData = stakingConfigResource;
        const blockData = blockInfoResource;

        // Extract commission and total delegation
        const totalCoins = BigInt(delegation.data.active_shares.total_coins);
        const delegatedAmountApt = Number(totalCoins) / 1e8;
        const rawCommissionValue = Number(delegation.data.operator_commission_percentage);
        const commissionDisplayPercentage = rawCommissionValue / 100; // For display (e.g., 400 -> 4.00)
        const commissionRate = rawCommissionValue / 10000; // For calculation (e.g., 400 -> 0.04)

        // --- Calculate Gross APR ---
        // Verify field names if errors occur here
        if (configData.rewards_rate === undefined || configData.rewards_rate_denominator === undefined || blockData.epoch_interval === undefined) {
             console.error("Config Data:", configData);
             console.error("Block Data:", blockData);
             throw new Error(`Could not find required fields (rewards_rate, rewards_rate_denominator, epoch_interval) in fetched resources. Check console and verify field names.`);
        }

        const rewardRate = BigInt(configData.rewards_rate);
        const denominator = BigInt(configData.rewards_rate_denominator);
        const epochIntervalMicroseconds = BigInt(blockData.epoch_interval);

        let calculatedGrossApr = null;
        if (denominator !== 0n && epochIntervalMicroseconds !== 0n) {
            const epochIntervalSeconds = epochIntervalMicroseconds / 1_000_000n;
            const secondsPerYear = 31_536_000n; // 365 * 24 * 60 * 60
            const epochsPerYear = secondsPerYear / epochIntervalSeconds;

            // Use scaling factor for precision with BigInt division for percentage
            const scaleFactor = 10000n; // For basis points (2 decimal places of percentage)
            const scaledAnnualRateNumerator = rewardRate * epochsPerYear * scaleFactor;
            const scaledAnnualRateBasisPoints = scaledAnnualRateNumerator / denominator;

            // Convert scaled BigInt to Number percentage
            calculatedGrossApr = Number(scaledAnnualRateBasisPoints) / 100;
        } else {
             console.warn("Denominator or epoch interval is zero, cannot calculate APR.");
        }

        // --- Calculate Net APR ---
        let calculatedNetApr = null;
        if (calculatedGrossApr !== null) {
            calculatedNetApr = calculatedGrossApr * (1 - commissionRate);
        }

        // --- Update Component State ---
        setInfo({
          poolAddress: VALIDATOR_POOL_ADDRESS,
          delegated: delegatedAmountApt,
          commission: commissionDisplayPercentage,
        });
        setGrossApr(calculatedGrossApr !== null ? calculatedGrossApr.toFixed(2) : null);
        setNetApr(calculatedNetApr !== null ? calculatedNetApr.toFixed(2) : null);

        // --- Process User Stake Info ---
        if (userStakeResult && Array.isArray(userStakeResult) && userStakeResult.length > 0) {
            const userStakeOctas = BigInt(userStakeResult[0]);
            setUserStakeApt(Number(userStakeOctas) / 1e8); // Convert Octas to APT
        } else {
             setUserStakeApt(0); // Assume 0 if no valid result
        }

      } catch (err) {
        console.error('Error in fetchData:', err);
        setError(err.message || 'Failed to fetch or process data');
      } finally {
         setLoading(false); // Stop loading indicator
      }
    };

    fetchData();
    // Re-run this effect if the connected account changes
  }, [account]);

  // --- Render Logic ---

  // Show prompt if wallet not connected
  if (!account) {
      return <p className="text-center text-gray-500 mt-4">Connect wallet to view validator and staking info.</p>;
  }

  // Show loading state
  if (loading) {
      return <p className="text-center mt-4">Loading validator & your staking info...</p>;
  }

  // Show error state
  if (error) {
      return <p className="text-center text-red-600 mt-4">Error: {error}</p>;
  }

  // Fallback if info isn't loaded (should be covered by loading/error)
  if (!info) {
      return <p className="text-center mt-4">Validator info not available.</p>;
  }

  // Render the fetched and calculated information
  return (
    <div className="mt-6 mb-4 text-center p-4 border rounded shadow-md w-full max-w-md bg-white">
      {/* General Pool Info Section */}
      <h2 className="text-xl font-semibold mb-3 text-gray-800">Validator Pool Info</h2>
      <p className="text-sm text-gray-600 break-all">
        <strong>Address:</strong> {info.poolAddress}
      </p>
      <p className="text-gray-700">
        <strong>Total Delegated:</strong> {info.delegated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} APT
      </p>
      <p className="text-gray-700">
        <strong>Commission:</strong> {info.commission.toFixed(2)} %
      </p>
      <p className="text-gray-700 font-medium">
        <strong>Estimated Net APR:</strong> {netApr ?? 'N/A'}%
        {grossApr !== null && (
            <span className="text-sm text-gray-500"> (Gross: {grossApr}% — estimated from current protocol reward rate)</span>
        )}
        {grossApr === null && netApr === null && !loading && !error && (
             <span className="text-sm text-gray-500"> (APR calculation unavailable)</span>
        )}
      </p>

      {/* Separator */}
      <hr className="my-4 border-t border-gray-300"/>

      {/* User Specific Info Section */}
      <h2 className="text-xl font-semibold mb-3 text-gray-800">Your Stake</h2>
      <p className="text-lg text-blue-700 font-semibold">
         <strong>Amount Staked:</strong> {
            userStakeApt !== null
            ? userStakeApt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })
            : 'N/A'
         } APT
      </p>
    </div>
  );
}

export default ValidatorInfo;