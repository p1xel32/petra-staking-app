import React, { useEffect, useState, useCallback } from 'react';
import { Aptos, Network } from '@aptos-labs/ts-sdk';
import { Landmark, TrendingUp as AprIcon, Info, Clock, UserCircle, Activity, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';

// Initialize Aptos client for Mainnet
const client = new Aptos({
  network: Network.MAINNET,
});

// --- Configuration ---
const VALIDATOR_POOL_ADDRESS = '0xf747e3a6282cc0dee1c89239c529b039c64fe48e88b50e5cedd40e9c094800bb';
const FRAMEWORK_ADDRESS = '0x1';
const STAKING_CONFIG_RESOURCE_TYPE = '0x1::staking_config::StakingConfig';
const BLOCK_RESOURCE_TYPE = '0x1::block::BlockResource';
const OCTAS_PER_APT = 100_000_000;

// Helper function to format remaining seconds
function formatRemainingTime(totalSeconds) {
  if (totalSeconds <= 0) return "Unlocked";
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  let parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || (days === 0 && hours === 0)) parts.push(`${minutes}m`);
  return parts.length > 0 ? `in ${parts.join(' ')}` : "Soon";
}

function ValidatorInfo({ account, refreshTrigger }) {
  const [info, setInfo] = useState(null);
  const [grossApr, setGrossApr] = useState(null);
  const [netApr, setNetApr] = useState(null);
  const [userActiveStakeApt, setUserActiveStakeApt] = useState(0);
  const [userInactiveStakeApt, setUserInactiveStakeApt] = useState(0);
  const [userPendingInactiveStakeApt, setUserPendingInactiveStakeApt] = useState(0);
  const [unlockTimestamp, setUnlockTimestamp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserAndPoolData = useCallback(async () => {
    setLoading(true); setError(null);
    setInfo(null); setGrossApr(null); setNetApr(null);
    setUserActiveStakeApt(0); setUserInactiveStakeApt(0); setUserPendingInactiveStakeApt(0);
    setUnlockTimestamp(null);

    try {
      const commonPromises = [
        client.getAccountResources({ accountAddress: VALIDATOR_POOL_ADDRESS }),
        client.getAccountResource({ accountAddress: FRAMEWORK_ADDRESS, resourceType: STAKING_CONFIG_RESOURCE_TYPE }),
        client.getAccountResource({ accountAddress: FRAMEWORK_ADDRESS, resourceType: BLOCK_RESOURCE_TYPE }),
      ];
      if (account) {
        commonPromises.push(client.view({ payload: { function: '0x1::delegation_pool::get_stake', functionArguments: [VALIDATOR_POOL_ADDRESS, account] } }));
      }
      const results = await Promise.all(commonPromises);
      const validatorResources = results[0];
      const stakingConfigResource = results[1];
      const blockInfoResource = results[2];
      const userStakeResult = account ? results[3] : null;

      const delegation = validatorResources.find(r => r.type.startsWith('0x1::delegation_pool::DelegationPool'));
      const pool = validatorResources.find(r => r.type === '0x1::stake::StakePool');

      if (!delegation || !pool || !stakingConfigResource || !blockInfoResource) {
        let missing = [];
        if (!delegation) missing.push("DelegationPool"); if (!pool) missing.push("StakePool");
        if (!stakingConfigResource) missing.push(STAKING_CONFIG_RESOURCE_TYPE); if (!blockInfoResource) missing.push(BLOCK_RESOURCE_TYPE);
        throw new Error(`Required resources not found: ${missing.join(', ')}. Verify paths.`);
      }

      const configData = stakingConfigResource;
      const blockData = blockInfoResource;

      const totalCoins = BigInt(delegation.data.active_shares.total_coins);
      const delegatedAmountApt = Number(totalCoins) / OCTAS_PER_APT;
      const rawCommissionValue = Number(delegation.data.operator_commission_percentage);
      const commissionDisplayPercentage = rawCommissionValue / 100;
      const commissionRate = rawCommissionValue / 10000;
      const lockedUntilSecs = Number(pool.data.locked_until_secs);
      setUnlockTimestamp(lockedUntilSecs);

      if (configData.rewards_rate === undefined || configData.rewards_rate_denominator === undefined || blockData.epoch_interval === undefined) {
         throw new Error(`Could not find required fields for APR. Verify names.`);
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
      } else { console.warn("Cannot calculate APR."); }

      let calculatedNetApr = null;
      if (calculatedGrossApr !== null) { calculatedNetApr = calculatedGrossApr * (1 - commissionRate); }

      setInfo({ poolAddress: VALIDATOR_POOL_ADDRESS, delegated: delegatedAmountApt, commission: commissionDisplayPercentage });
      setGrossApr(calculatedGrossApr !== null ? calculatedGrossApr.toFixed(2) : null);
      setNetApr(calculatedNetApr !== null ? calculatedNetApr.toFixed(2) : null);

      if (account && userStakeResult) {
        if (Array.isArray(userStakeResult) && userStakeResult.length >= 3) {
            setUserActiveStakeApt(Number(BigInt(userStakeResult[0])) / OCTAS_PER_APT);
            setUserInactiveStakeApt(Number(BigInt(userStakeResult[1])) / OCTAS_PER_APT);
            setUserPendingInactiveStakeApt(Number(BigInt(userStakeResult[2])) / OCTAS_PER_APT);
        } else { console.warn("Unexpected user stake result format.", userStakeResult); }
      }
    } catch (err) {
      console.error('Error in fetchUserAndPoolData:', err);
      setError(err.message || 'Failed to fetch/process data');
    } finally { setLoading(false); }
  }, [account]);

  useEffect(() => {
    fetchUserAndPoolData();
  }, [account, fetchUserAndPoolData, refreshTrigger]);

  const unlockDateString = unlockTimestamp ? new Date(unlockTimestamp * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
  const nowSeconds = Math.floor(Date.now() / 1000);
  const remainingSeconds = unlockTimestamp ? unlockTimestamp - nowSeconds : -1;
  const unlockRemainingString = unlockTimestamp ? formatRemainingTime(remainingSeconds) : 'N/A';

  if (loading || (!info && !error && account !== undefined)) {
      return (
        // The parent div in App.jsx provides the card styling (bg-gray-800/80, p-6 etc.)
        <div className="w-full text-center"> {/* Removed card styles from here */}
          <Activity size={32} className="text-blue-400 animate-spin mx-auto mb-3" />
          <p className="text-gray-400">Loading validator info...</p>
        </div>
      );
  }
  if (error) {
      return (
        <div className="w-full text-center"> {/* Removed card styles from here */}
          <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
          <p className="text-red-400">Error: {error}</p>
        </div>
      );
  }
  if (!info) {
      return (
        <div className="w-full text-center"> {/* Removed card styles from here */}
          <Info size={32} className="text-yellow-400 mx-auto mb-3" />
          <p className="text-gray-500">Validator info not available.</p>
        </div>
      );
  }

  return (
    // Root div of this component no longer needs card styling (bg-gray-800, p-6, rounded-xl, shadow-2xl)
    // as it's applied by the wrapper in App.jsx. It just needs w-full and text colors.
    <div className="w-full text-gray-200">
      <h2 className="text-xl font-bold mb-4 text-center text-gray-100">Validator Pool Details</h2>
      <div className="space-y-3 text-sm"> {/* Increased spacing a bit */}
        <div className="flex justify-between items-center">
          <span className="text-gray-400 flex items-center gap-2"><Landmark size={16}/>Address:</span>
          <a
            href={`https://explorer.aptoslabs.com/account/${info.poolAddress}?network=mainnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono break-all text-right text-purple-400 hover:text-purple-300 transition-colors duration-150 flex items-center gap-1"
          >
            {`${info.poolAddress.substring(0, 6)}...${info.poolAddress.substring(info.poolAddress.length - 4)}`}
            <ExternalLink size={12} />
          </a>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 flex items-center gap-2"><UserCircle size={16}/>Total Delegated:</span>
          <span className="font-semibold text-gray-100">{info.delegated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} APT</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 flex items-center gap-2"><Info size={16}/>Commission:</span>
          <span className="font-semibold text-gray-100">{info.commission.toFixed(2)} %</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 flex items-center gap-2"><AprIcon size={16}/>Est. Net APR:</span>
          <div className="text-right">
            <span className="font-semibold text-lg text-green-400">{netApr ?? 'N/A'}%</span>
            {grossApr !== null && (<p className="text-xs text-gray-500">(Gross: {grossApr}%)</p>)}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 flex items-center gap-2"><Clock size={16}/>Pool Lockup Ends:</span>
          <div className="text-right text-gray-300">
            <span>{unlockDateString}</span>
            {unlockTimestamp && remainingSeconds > 0 && (<span className="text-xs text-gray-500 ml-1">({unlockRemainingString})</span>)}
            {unlockTimestamp && remainingSeconds <= 0 && (<span className="text-xs text-green-400 ml-1">(Unlocked)</span>)}
          </div>
        </div>
      </div>

      {account && (
        <>
          <hr className="my-5 border-t border-gray-700"/>
          <h3 className="text-lg font-semibold mb-3 text-center text-gray-100">Your Stake</h3>
          <div className="space-y-2 text-sm"> {/* Increased spacing a bit */}
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Active:</span>
              <span className="font-semibold text-green-400">{userActiveStakeApt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} APT</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Pending Inactive:</span>
              <span className="font-semibold text-yellow-400">{userPendingInactiveStakeApt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} APT</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Inactive (Withdrawable):</span>
              <span className="font-semibold text-blue-400">{userInactiveStakeApt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} APT</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
export default ValidatorInfo;
