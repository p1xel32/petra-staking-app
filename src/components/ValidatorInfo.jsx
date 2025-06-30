//src/components/Validatorinfo.jsx
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

export default function ValidatorInfo({ poolInfo, apy, account, userStake, isMounted, connected }) {

  if (!poolInfo) {
      return (
        <div className="w-full text-center py-8">
          <Activity size={36} className="text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Loading Aptos Validator Info...</p>
        </div>
      );
  }
  
  const commissionAsFraction = Number(poolInfo.operator_commission_percentage) / 10000;
  
  const aprApyTooltipContent = (
    <>
      <p className="font-semibold mb-1 text-sm">Reward Calculation:</p>
      {isMounted && apy && <p><strong>Est. Net APY: {(apy * (1 - commissionAsFraction)).toFixed(2)}%</strong></p>}
      {isMounted && <p className="text-xs">(after {(commissionAsFraction * 100).toFixed(2)}% commission, compounded)</p>}
      <hr className="my-1.5 border-gray-600" />
      {isMounted && apy && <p className="text-xs">Est. Gross APY: {apy.toFixed(2)}%</p>}
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
        <InfoRow
            icon={Landmark}
            label="Validator Pool Address"
            value={`${poolInfo.poolAddress.substring(0, 8)}...${poolInfo.poolAddress.substring(poolInfo.poolAddress.length - 6)}`}
            link={`https://explorer.aptoslabs.com/validator/${poolInfo.poolAddress}?network=mainnet`}
        />
        <InfoRow
            icon={Layers}
            label="Total APT Delegated to Pool"
            value={isMounted ? `${(Number(poolInfo.active_stake_octas) / 1e8).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} APT` : 'Loading...'}
        />
        <InfoRow
            icon={Percent}
            label="Validator Commission Rate"
            value={isMounted ? `${(commissionAsFraction * 100).toFixed(2)} %` : '...'}
        />
        <InfoRow
            icon={AprIcon}
            label="Est. Net Yield"
            value={isMounted && apy ? `${(apy * (1 - commissionAsFraction)).toFixed(2)}% APY` : '...'}
            valueClasses="font-bold text-xl text-green-400"
            tooltipContent={aprApyTooltipContent}
        />
        <InfoRow
            icon={Clock}
            label="Pool Lockup Period Ends"
            value={isMounted ? new Date(poolInfo.locked_until_secs * 1000).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '...'}
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
              <InfoRow
                  icon={CheckSquare}
                  label="Your Active APT Stake"
                  value={`${userStake.active.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} APT`}
                  valueClasses="font-semibold text-green-400"
                  iconColor="text-green-400"
              />
              <InfoRow
                  icon={Hourglass}
                  label="APT Pending Unstake"
                  value={`${userStake.pendingInactive.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} APT`}
                  valueClasses="font-semibold text-zinc-400"
                  iconColor="text-zinc-400"
              />
              <InfoRow
                  icon={Package}
                  label="APT Ready to Withdraw"
                  value={`${userStake.inactive.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} APT`}
                  valueClasses="font-semibold text-blue-400"
                  iconColor="text-blue-400"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}