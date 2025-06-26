// src/components/ValidatorInfo.jsx

import React from 'react';
import {
    Landmark,
    Percent,
    TrendingUp as AprIcon,
    Info as InfoIcon,
    Clock,
    Activity,
    ExternalLink,
    Package,
    Hourglass,
    Layers,
    CheckSquare,
    Loader2
} from 'lucide-react';


const InfoRow = ({ icon: Icon, label, value, valueClasses = "text-gray-100 font-semibold", link = null, subValue = null, iconColor = "text-purple-400", tooltipContent = null }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-gray-700/60 last:border-b-0">
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
            <div className="absolute bottom-full right-0 transform translate-y-0 mb-2 w-64 p-3 text-xs text-left bg-gray-800 border border-gray-700 text-gray-300 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
              {tooltipContent}
            </div>
          </span>
        )}
        {subValue && !tooltipContent && <p className="text-xs text-zinc-400 ml-1">{subValue}</p>}
      </div>
    )}
  </div>
);

// Функция formatRemainingTime остается без изменений
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

export default function ValidatorInfo({ poolInfo, apy, account, userStake, isMounted, connected }) {

  if (!poolInfo) {
      return (
        <div className="w-full text-center py-8">
          <Activity size={36} className="text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Loading Aptos Validator Info...</p>
        </div>
      );
  }
  
  const commissionInBasisPoints = Number(poolInfo.operator_commission_percentage);
  const commissionAsFraction = commissionInBasisPoints / 10000;
  const commissionToDisplay = commissionAsFraction * 100;
  const delegatedAmountApt = Number(poolInfo.active_stake_octas) / 100_000_000;
  const netApy = apy ? (apy * (1 - commissionAsFraction)).toFixed(2) : 'N/A';
  const grossApy = apy ? apy.toFixed(2) : 'N/A';
  
  const unlockTimestamp = poolInfo.locked_until_secs;
  const unlockDateString = unlockTimestamp ? new Date(unlockTimestamp * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';


  let timeDependentSubValue = null;
  if (isMounted && unlockTimestamp) {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const remainingSeconds = unlockTimestamp - nowSeconds;
    if (remainingSeconds > 0) {
        timeDependentSubValue = formatRemainingTime(remainingSeconds);
    } else {
        timeDependentSubValue = '(Unlocked)';
    }
  }

  const aprApyTooltipContent = (
    <>
      <p className="font-semibold mb-1 text-sm">Reward Calculation:</p>
      {netApy !== 'N/A' && <p><strong>Est. Net APY: {netApy}%</strong></p>}
      <p className="text-xs">(after {commissionToDisplay.toFixed(2)}% commission, compounded)</p>
      <hr className="my-1.5 border-gray-600" />
      {grossApy !== 'N/A' && <p className="text-xs">Est. Gross APY: {grossApy}%</p>}
      <p className="text-xs mt-1.5 italic">APY includes compounding. All figures are estimates and may vary.</p>
    </>
  );

  return (
    <div className="w-full text-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-100">
          Validator Pool Details
        </h2>
      </div>
      <div className="space-y-3 mb-6">
        <InfoRow icon={Landmark} label="Validator Pool Address" value={`${poolInfo.poolAddress.substring(0, 8)}...`} link={`https://explorer.aptoslabs.com/validator/${poolInfo.poolAddress}?network=mainnet`} />
        <InfoRow icon={Layers} label="Total APT Delegated to Pool" value={`${delegatedAmountApt.toLocaleString(undefined, {})} APT`} />
        <InfoRow icon={Percent} label="Validator Commission Rate" value={`${commissionToDisplay.toFixed(2)} %`} />
        <InfoRow icon={AprIcon} label="Est. Net Yield" value={`${netApy}% APY`} valueClasses="font-bold text-xl text-green-400" tooltipContent={aprApyTooltipContent} />
        <InfoRow
            icon={Clock}
            label="Pool Lockup Period Ends"
            value={unlockDateString}
            subValue={timeDependentSubValue} 
        />
      </div>

      {isMounted && connected && (
        <>
          <hr className="my-6 border-t border-gray-700/60"/>
          <h3 className="text-xl font-semibold mb-4 text-center text-gray-100">Your Current Aptos (APT) Stake with aptcore.one</h3>
          {userStake.isFetching ? (
            <div className="text-center py-4"><Loader2 size={24} className="animate-spin text-purple-400 mx-auto" /></div>
          ) : (
            <div className="space-y-2.5 text-sm">
              <InfoRow icon={CheckSquare} label="Your Active APT Stake" value={`${userStake.active.toLocaleString(undefined, {})} APT`} valueClasses="font-semibold text-green-400" iconColor="text-green-400" />
              <InfoRow icon={Hourglass} label="APT Pending Unstake" value={`${userStake.pendingInactive.toLocaleString(undefined, {})} APT`} valueClasses="font-semibold text-zinc-400" iconColor="text-zinc-400" />
              <InfoRow icon={Package} label="APT Ready to Withdraw" value={`${userStake.inactive.toLocaleString(undefined, {})} APT`} valueClasses="font-semibold text-blue-400" iconColor="text-blue-400" />
            </div>
          )}
        </>
      )}
    </div>
  );
}