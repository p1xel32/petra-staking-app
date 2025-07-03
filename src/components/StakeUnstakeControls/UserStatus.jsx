// File: src/components/StakeUnstakeControls/UserStatus.jsx

import React from 'react';
import { Loader2, Wallet, CheckCircle2, Hourglass, PackageCheck } from 'lucide-react';
import { useCountdown } from '../../hooks/useCountdown.js'; 


const DataRow = ({ icon: Icon, label, children, iconClassName = "text-zinc-400" }) => (
    <div className="flex justify-between items-center py-3">
        <div className="flex items-center text-sm"><Icon size={16} className={`mr-4 flex-shrink-0 ${iconClassName}`} /><span className="text-zinc-300">{label}</span></div>
        <div className="flex items-center justify-end text-right text-sm">{children}</div>
    </div>
);

const ValueDisplay = ({ children, className = "text-zinc-200" }) => (<span className={className}>{children}</span>);


const PersonalUnlockCountdown = ({ timestamp }) => {
    const timeLeft = useCountdown(timestamp);

    if (!timeLeft) {
        return (
             <div className="pl-10 pr-1 pt-2 pb-1 text-xs text-zinc-500">
                Calculating remaining time...
            </div>
        );
    }

    if (timeLeft.total <= 0) {
        return (
            <div className="pl-10 pr-1 pt-2 pb-1 text-xs text-green-400 font-semibold">
                Awaiting network confirmation to become withdrawable...
            </div>
        );
    }
    
    const pad = (num) => num.toString().padStart(2, '0');

    return (
        <div className="pl-10 pr-1 pt-2 pb-1 flex justify-between items-center">
            <span className="text-xs text-zinc-400">Time remaining:</span>
            <div className="font-mono text-sm tracking-tight text-indigo-300">
                <span>{timeLeft.days}</span><span className="text-xs text-zinc-500 mr-1.5">d</span>
                <span>{pad(timeLeft.hours)}</span><span className="text-xs text-zinc-500 mr-1.5">h</span>
                <span>{pad(timeLeft.minutes)}</span><span className="text-xs text-zinc-500 mr-1.5">m</span>
                <span>{pad(timeLeft.seconds)}</span><span className="text-xs text-zinc-500">s</span>
            </div>
        </div>
    );
};



export default function UserStatus({ 
    isFetching,
    activeStakeAmountApt,
    pendingUnstakeAmountApt,
    withdrawableAmountApt,
    walletBalance,
    onWithdraw,
    isSubmitting,
    pendingInactive
}) {
    const hasActiveStake = activeStakeAmountApt > 0;
    const hasPendingUnstake = pendingUnstakeAmountApt > 0;
    const hasWithdrawable = withdrawableAmountApt > 0;
    
    if (isFetching) {
        return <div className="text-center py-4"><Loader2 size={24} className="animate-spin text-purple-400 mx-auto" /></div>;
    }

    return (
        <div className="divide-y divide-zinc-800">
            <DataRow icon={Wallet} label="Available in Wallet">
                <ValueDisplay>{`${(walletBalance || 0).toLocaleString()} APT`}</ValueDisplay>
            </DataRow>
            
            <DataRow icon={CheckCircle2} label="Active Stake" iconClassName={hasActiveStake ? "text-green-400" : "text-zinc-400"}>
                <ValueDisplay className="font-semibold text-green-400">{`${(activeStakeAmountApt || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} APT`}</ValueDisplay>
            </DataRow>
            
            {hasPendingUnstake && !pendingInactive?.lockup_expiration_timestamp && (
                 <DataRow icon={Hourglass} label="Unlocking Stake" iconClassName="text-indigo-400 animate-pulse">
                     <span className="text-xs text-zinc-400">Unlock time will be assigned next epoch</span>
                </DataRow>
            )}

            {hasPendingUnstake && pendingInactive?.lockup_expiration_timestamp && (
                <div>
                    <DataRow icon={Hourglass} label="Unlocking Stake" iconClassName="text-indigo-400 animate-pulse">
                        <ValueDisplay className="font-semibold text-indigo-300">{`${(pendingUnstakeAmountApt || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} APT`}</ValueDisplay>
                    </DataRow>
                    <PersonalUnlockCountdown timestamp={pendingInactive.lockup_expiration_timestamp} />
                </div>
            )}
            
            <DataRow icon={PackageCheck} label="Ready to Withdraw" iconClassName={hasWithdrawable ? "text-blue-400" : "text-zinc-400"}>
                <div className="flex items-center gap-2">
                    <ValueDisplay className="font-semibold text-blue-300">{`${(withdrawableAmountApt || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} APT`}</ValueDisplay>
                    {hasWithdrawable && (
                        <button onClick={onWithdraw} disabled={isSubmitting} className="text-xs bg-blue-600/50 text-white px-2 py-0.5 rounded-md hover:bg-blue-600 transition-colors">
                            {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : 'Withdraw'}
                        </button>
                    )}
                </div>
            </DataRow>
        </div>
    );
}