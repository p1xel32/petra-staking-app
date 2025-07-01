import React from 'react';
import { Loader2, Wallet, Landmark, DownloadCloud, CheckCircle2, Hourglass, PackageCheck } from 'lucide-react';

// Вспомогательные компоненты
const DataRow = ({ icon: Icon, label, children, iconClassName = "text-zinc-400" }) => (
    <div className="flex justify-between items-center py-3">
        <div className="flex items-center text-sm"><Icon size={16} className={`mr-4 flex-shrink-0 ${iconClassName}`} /><span className="text-zinc-300">{label}</span></div>
        <div className="flex items-center justify-end text-right text-sm">{children}</div>
    </div>
);
const ValueDisplay = ({ children, className = "text-zinc-200" }) => (<span className={className}>{children}</span>);
const UserStakeProgressBar = ({ value, label }) => (
    <div className="pl-10 pr-1 pt-1 pb-2">
        <div className="w-full bg-zinc-700/50 rounded-full h-1.5"><div className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full" style={{ width: `${value}%` }}></div></div>
        <div className="text-right text-xs text-zinc-400 mt-1.5"><span>{label}</span></div>
    </div>
);

export default function UserStatus({ userStake, walletBalance, onWithdraw, isSubmitting }) {
    const { inactive: withdrawableAmountApt = 0, active: activeStakeAmountApt = 0, pendingInactive: pendingUnstakeAmountApt = 0, isFetching } = userStake || {};

    const hasActiveStake = activeStakeAmountApt > 0;
    const hasPendingUnstake = pendingUnstakeAmountApt > 0;
    const hasWithdrawable = withdrawableAmountApt > 0;

    if (isFetching) {
        return <div className="text-center py-4"><Loader2 size={24} className="animate-spin text-purple-400 mx-auto" /></div>;
    }

    return (
        <div className="divide-y divide-zinc-800">
            {/* Добавляем баланс кошелька для контекста */}
            <DataRow icon={Wallet} label="Available in Wallet">
                <ValueDisplay>{`${(walletBalance || 0).toLocaleString()} APT`}</ValueDisplay>
            </DataRow>
            <DataRow icon={CheckCircle2} label="Active Stake" iconClassName={hasActiveStake ? "text-green-400 animate-pulse" : "text-zinc-400"}>
                <ValueDisplay className="font-semibold text-green-400">{`${activeStakeAmountApt.toLocaleString(undefined, { minimumFractionDigits: 8 })} APT`}</ValueDisplay>
            </DataRow>
            <div>
                <DataRow icon={Hourglass} label="Pending Unstake" iconClassName={hasPendingUnstake ? "text-indigo-400 animate-pulse" : "text-zinc-400"}>
                    <ValueDisplay className="font-semibold text-indigo-300">{`${pendingUnstakeAmountApt.toLocaleString(undefined, { minimumFractionDigits: 8 })} APT`}</ValueDisplay>
                </DataRow>
                {hasPendingUnstake && (
                    <UserStakeProgressBar value={30} label="Ready in ~10 days" />
                )}
            </div>
            <DataRow icon={PackageCheck} label="Ready to Withdraw" iconClassName={hasWithdrawable ? "text-blue-400 animate-pulse" : "text-zinc-400"}>
                <div className="flex items-center gap-2">
                    <ValueDisplay className="font-semibold text-blue-300">{`${withdrawableAmountApt.toLocaleString(undefined, { minimumFractionDigits: 8 })} APT`}</ValueDisplay>
                    {hasWithdrawable && (<button onClick={onWithdraw} disabled={isSubmitting} className="text-xs bg-blue-600/50 text-white px-2 py-0.5 rounded-md hover:bg-blue-600 transition-colors">Withdraw</button>)}
                </div>
            </DataRow>
        </div>
    );
}