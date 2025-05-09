import React, { useEffect, useState, useCallback } from 'react';
import { Aptos, Network } from '@aptos-labs/ts-sdk';
import { 
    Landmark, 
    Percent, 
    TrendingUp as AprIcon, 
    Info as InfoIcon, 
    Clock, 
    Activity, 
    AlertCircle, 
    ExternalLink, 
    Package, 
    Hourglass, 
    Layers, 
    CheckSquare, 
    RefreshCw, 
    Loader2 
} from 'lucide-react';

const APTOS_NODE_URL_ALTERNATIVE = "https://rpc.mainnet.aptos.network/v1";

const client = new Aptos({
    network: Network.MAINNET,
    clientConfig: { 
        NODE_URL: APTOS_NODE_URL_ALTERNATIVE,
    }
});

const VALIDATOR_POOL_ADDRESS = '0xf747e3a6282cc0dee1c89239c529b039c64fe48e88b50e5cedd40e9c094800bb';
const FRAMEWORK_ADDRESS = '0x1';
const STAKING_CONFIG_RESOURCE_TYPE = '0x1::staking_config::StakingConfig';
const BLOCK_RESOURCE_TYPE = '0x1::block::BlockResource';
const OCTAS_PER_APT = 100_000_000;

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

const InfoRow = ({ icon: Icon, label, value, valueClasses = "text-gray-100 font-semibold", link = null, subValue = null, iconColor = "text-purple-400", tooltipContent = null }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-gray-700/60 last:border-b-0">
    {/* Label part - иконка информации отсюда убрана */}
    <span className="text-gray-400 flex items-center text-sm">
      {Icon && <Icon size={16} className={`mr-2 ${iconColor}`} />}
      {label}:
    </span>
    
    {link ? (
      <a href={link} target="_blank" rel="noopener noreferrer" className={`font-mono text-sm break-all text-right ${valueClasses} hover:text-purple-300 transition-colors duration-150 flex items-center gap-1`}>
        {value} 
        <ExternalLink size={12} /> 
      </a>
    ) : (
      <div className="flex items-center justify-end text-right">
        <span className={`text-sm ${valueClasses}`}>{value}</span>
        {tooltipContent && (
          <span className="ml-1.5 group relative cursor-help">
            <InfoIcon size={14} className="text-gray-500 group-hover:text-gray-300" />
            <div className="absolute bottom-full right-0 transform translate-y-0 mb-2 w-64 p-3 text-xs text-left
                          bg-gray-800 border border-gray-700 text-gray-300 rounded-md shadow-lg 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
              {tooltipContent}
            </div>
          </span>
        )}
        {subValue && !tooltipContent && <p className="text-xs text-zinc-400 ml-1">{subValue}</p>}
      </div>
    )}
  </div>
);

function ValidatorInfo({ account, refreshTrigger }) {
  const [info, setInfo] = useState(null);
  const [grossApr, setGrossApr] = useState(null);
  const [netApr, setNetApr] = useState(null);
  const [grossApy, setGrossApy] = useState(null);
  const [netApy, setNetApy] = useState(null);
  const [userActiveStakeApt, setUserActiveStakeApt] = useState(0);
  const [userInactiveStakeApt, setUserInactiveStakeApt] = useState(0);
  const [userPendingInactiveStakeApt, setUserPendingInactiveStakeApt] = useState(0);
  const [unlockTimestamp, setUnlockTimestamp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshingPool, setIsRefreshingPool] = useState(false);
  const [error, setError] = useState(null);

  const fetchUserAndPoolData = useCallback(async (isManualRefresh = false) => {
    if(isManualRefresh) {
      setIsRefreshingPool(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const promises = [
        client.getAccountResources({ accountAddress: VALIDATOR_POOL_ADDRESS }),
        client.getAccountResource({ accountAddress: FRAMEWORK_ADDRESS, resourceType: STAKING_CONFIG_RESOURCE_TYPE }),
        client.getAccountResource({ accountAddress: FRAMEWORK_ADDRESS, resourceType: BLOCK_RESOURCE_TYPE }),
      ];
      if (account) {
        promises.push(client.view({ payload: { function: '0x1::delegation_pool::get_stake', functionArguments: [VALIDATOR_POOL_ADDRESS, account] } }));
      }
      
      const results = await Promise.all(promises);
      const validatorResources = results[0];
      const stakingConfigResource = results[1];
      const blockInfoResource = results[2];
      const userStakeResult = account && results.length > 3 ? results[3] : null;

      const delegation = validatorResources.find(r => r.type.startsWith('0x1::delegation_pool::DelegationPool'));
      const pool = validatorResources.find(r => r.type === '0x1::stake::StakePool');
      
      if (!delegation || !pool || !stakingConfigResource || !blockInfoResource) {
        let missing = [];
        if (!delegation) missing.push("DelegationPool"); if (!pool) missing.push("StakePool");
        if (!stakingConfigResource) missing.push(STAKING_CONFIG_RESOURCE_TYPE); if (!blockInfoResource) missing.push(BLOCK_RESOURCE_TYPE);
        throw new Error(`Required Aptos resources not found: ${missing.join(', ')}. Please check Aptos network status or resource paths.`);
      }

      const configData = stakingConfigResource;
      const blockData = blockInfoResource;

      if (!pool.data || pool.data.active === undefined || pool.data.active.value === undefined) { 
        throw new Error("Stake pool data or its 'active.value' field is missing.");
      }
      if (!delegation.data) {
        throw new Error("Delegation pool data is missing.");
      }
      
      const totalCoins = BigInt(pool.data.active.value); 

      const delegatedAmountApt = Number(totalCoins) / OCTAS_PER_APT;
      const rawCommissionValue = Number(delegation.data.operator_commission_percentage);
      const commissionDisplayPercentage = rawCommissionValue / 100;
      const commissionRate = rawCommissionValue / 10000;
      const lockedUntilSecs = Number(pool.data.locked_until_secs);
      
      if (!configData || !blockData) {
        throw new Error("Staking config or block resource data is missing after assignment.");
      }

      if (configData.rewards_rate === undefined || configData.rewards_rate_denominator === undefined || blockData.epoch_interval === undefined) {
         throw new Error(`Could not find required fields for APR/APY calculation.`);
      }
      const rewardRateBigInt = BigInt(configData.rewards_rate);
      const denominatorBigInt = BigInt(configData.rewards_rate_denominator);
      const epochIntervalMicroseconds = BigInt(blockData.epoch_interval);

      let calculatedGrossAprNum = null;
      let calculatedGrossApyNum = null;

      if (denominatorBigInt !== 0n && epochIntervalMicroseconds !== 0n) {
          const epochIntervalSeconds = Number(epochIntervalMicroseconds / 1_000_000n);
          const secondsPerYear = 31536000;
          const epochsPerYear = secondsPerYear / epochIntervalSeconds;
          
          const ratePerEpoch = Number(rewardRateBigInt) / Number(denominatorBigInt);
          calculatedGrossAprNum = ratePerEpoch * epochsPerYear * 100;

          if (ratePerEpoch >= 0) {
             calculatedGrossApyNum = (Math.pow(1 + ratePerEpoch, epochsPerYear) - 1) * 100;
          }
      } else { 
          console.warn("Cannot calculate Aptos APR/APY due to zero denominator or epoch interval.");
      }

      setInfo({ poolAddress: VALIDATOR_POOL_ADDRESS, delegated: delegatedAmountApt, commission: commissionDisplayPercentage });
      setGrossApr(calculatedGrossAprNum !== null ? calculatedGrossAprNum.toFixed(2) : null);
      setNetApr(calculatedGrossAprNum !== null ? (calculatedGrossAprNum * (1 - commissionRate)).toFixed(2) : null);
      
      setGrossApy(calculatedGrossApyNum !== null ? calculatedGrossApyNum.toFixed(2) : null);
      setNetApy(calculatedGrossApyNum !== null ? (calculatedGrossApyNum * (1 - commissionRate)).toFixed(2) : null);

      setUnlockTimestamp(lockedUntilSecs);

      if (account && userStakeResult) {
        if (Array.isArray(userStakeResult) && userStakeResult.length >= 3) {
            setUserActiveStakeApt(Number(BigInt(userStakeResult[0])) / OCTAS_PER_APT);
            setUserInactiveStakeApt(Number(BigInt(userStakeResult[1])) / OCTAS_PER_APT);
            setUserPendingInactiveStakeApt(Number(BigInt(userStakeResult[2])) / OCTAS_PER_APT);
        } else { 
            console.warn("Unexpected user stake result format from Aptos blockchain.", userStakeResult); 
            setUserActiveStakeApt(0); setUserInactiveStakeApt(0); setUserPendingInactiveStakeApt(0);
        }
      } else if (!account) {
        setUserActiveStakeApt(0); setUserInactiveStakeApt(0); setUserPendingInactiveStakeApt(0);
      }

    } catch (err) {
      console.error('Error fetching Aptos pool/user data:', err);
      setError(err.message || 'Failed to fetch or process Aptos staking data');
    } finally { 
      setLoading(false);
      setIsRefreshingPool(false);
    }
  }, [account]);

  useEffect(() => {
    fetchUserAndPoolData();
  }, [account, fetchUserAndPoolData, refreshTrigger]);

  const handleManualRefresh = () => {
    fetchUserAndPoolData(true);
  };

  const unlockDateString = unlockTimestamp ? new Date(unlockTimestamp * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
  const nowSeconds = Math.floor(Date.now() / 1000);
  const remainingSeconds = unlockTimestamp ? unlockTimestamp - nowSeconds : -1;
  const unlockRemainingString = unlockTimestamp ? formatRemainingTime(remainingSeconds) : 'N/A';

  if (loading && !isRefreshingPool) {
      return (
        <div className="w-full text-center py-8">
          <Activity size={36} className="text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Loading Aptos Validator Info...</p>
        </div>
      );
  }
  if (error) {
      return (
        <div className="w-full text-center py-8">
          <AlertCircle size={36} className="text-red-400 mx-auto mb-4" />
          <p className="text-red-400 text-lg">Error: {error}</p>
          <p className="text-sm text-gray-500 mt-2">Could not load Aptos staking data. Please try again later.</p>
        </div>
      );
  }
   if (!info) {
      return (
        <div className="w-full text-center py-8">
          <InfoIcon size={36} className="text-yellow-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Aptos validator pool information is currently unavailable.</p>
        </div>
      );
  }

  const aprApyTooltipContent = (
    <>
      <p className="font-semibold mb-1 text-sm">Reward Calculation:</p>
      {netApy && <p><strong>Est. Net APY: {netApy}%</strong></p>}
      {info?.commission && <p className="text-xs">(after {info.commission.toFixed(2)}% commission, compounded)</p>}
      <hr className="my-1.5 border-gray-600" />
      {grossApy && <p className="text-xs">Est. Gross APY: {grossApy}%</p>}
      {netApr && <p className="text-xs">Est. Net APR: {netApr}% (simple)</p>}
      {grossApr && <p className="text-xs">Est. Gross APR: {grossApr}% (simple)</p>}
      <p className="text-xs mt-1.5 italic">APY includes compounding. APR is simple interest. All figures are estimates and may vary.</p>
    </>
  );

  return (
    <div className="w-full text-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-100"> 
          Validator Pool Details 
        </h2>
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshingPool || loading}
          className="p-1.5 text-purple-400 hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 rounded-md hover:bg-purple-500/10"
          title="Refresh pool data"
        >
          {isRefreshingPool ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
        </button>
      </div>
      
      <div className="space-y-3 mb-6">
        <InfoRow
            icon={Landmark}
            label="Validator Pool Address"
            value={`${info.poolAddress.substring(0, 8)}...${info.poolAddress.substring(info.poolAddress.length - 6)}`}
            valueClasses="text-purple-300"
            link={`https://explorer.aptoslabs.com/account/${info.poolAddress}?network=mainnet`}
        />
        <InfoRow
            icon={Layers}
            label="Total APT Delegated to Pool"
            value={`${info.delegated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} APT`}
        />
        <InfoRow
            icon={Percent}
            label="Validator Commission Rate"
            value={`${info.commission.toFixed(2)} %`}
        />
        <InfoRow
            icon={AprIcon}
            label="Est. Net Yield"
            value={`${netApy ?? 'N/A'}% APY`}
            valueClasses="font-bold text-xl text-green-400"
            tooltipContent={aprApyTooltipContent}
        />
        <InfoRow
            icon={Clock}
            label="Pool Lockup Period Ends"
            value={unlockDateString}
            valueClasses="text-gray-300"
            subValue={unlockTimestamp && remainingSeconds > 0 ? unlockRemainingString : (unlockTimestamp ? '(Unlocked - Ready for unstake/withdraw)' : null)}
        />
      </div>

      {account && (
        <>
          <hr className="my-6 border-t border-gray-700/60"/>
          <h3 className="text-xl font-semibold mb-4 text-center text-gray-100">Your Current Aptos (APT) Stake with aptcore.one</h3>
          <div className="space-y-2.5 text-sm">
            <InfoRow
                icon={CheckSquare}
                label="Your Active APT Stake"
                value={`${userActiveStakeApt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} APT`}
                valueClasses="font-semibold text-green-400"
                iconColor="text-green-400"
            />
            <InfoRow
                icon={Hourglass}
                label="APT Pending Unstake"
                value={`${userPendingInactiveStakeApt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} APT`}
                valueClasses="font-semibold text-zinc-400"
                iconColor="text-zinc-400"
            />
            <InfoRow
                icon={Package}
                label="APT Ready to Withdraw"
                value={`${userInactiveStakeApt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} APT`}
                valueClasses="font-semibold text-blue-400"
                iconColor="text-blue-400"
            />
          </div>
        </>
      )}
    </div>
  );
}
export default ValidatorInfo;