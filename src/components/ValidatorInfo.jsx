import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Network, Database, BadgePercent, Signal, CalendarClock,
    Percent, Info as InfoIcon, Loader2, ExternalLink
} from 'lucide-react';
import LockupProgressBar from './LockupProgressBar';


const StatCard = ({ icon: Icon, label, children }) => (
    <div className="bg-zinc-900/50 rounded-xl p-4 border border-white/10 transition-colors duration-200 hover:bg-zinc-800/50">
        <div className="flex items-center text-sm text-zinc-400"><Icon size={16} className="mr-2" /><span>{label}</span></div>
        <div className="mt-1 text-2xl font-semibold text-zinc-100">{children}</div>
    </div>
);

const DataRow = ({ icon: Icon, label, children }) => (
    <div className="flex justify-between items-center py-3">
        <div className="flex items-center text-sm">
            <Icon size={16} className="text-zinc-400 mr-4 flex-shrink-0" />
            <span className="text-zinc-300">{label}</span>
        </div>
        <div className="flex items-center justify-end text-right text-sm">{children}</div>
    </div>
);

const ValueDisplay = ({ children, className = "text-zinc-200" }) => (<span className={className}>{children}</span>);

const LinkValue = ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-mono text-zinc-200 hover:text-white transition-colors duration-150 flex items-center gap-1.5">
        <span>{children}</span>
        <ExternalLink size={12} />
    </a>
);

const InfoTooltip = ({ content }) => (
    <span className="ml-1.5 group relative cursor-help">
        <InfoIcon size={14} className="text-zinc-500 group-hover:text-zinc-300" />
        <div className="absolute bottom-full right-0 mb-2 w-64 p-3 text-xs text-left bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">{content}</div>
    </span>
);

const LiveIndicator = () => (
    <div className="flex items-center ml-2">
        <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
    </div>
);


export default function ValidatorInfo({ poolInfo, apy, isMounted }) {
    const { t } = useTranslation();

    if (!poolInfo) {
        return (
            <div className="w-full rounded-3xl bg-[#0d0d1f]/70 backdrop-blur-xl border border-purple-600 p-8 sm:p-10 shadow-[0_0_20px_rgba(168,85,247,0.25)]">
                <div className="w-full h-[450px] bg-zinc-900/50 rounded-2xl animate-pulse" />
            </div>
        );
    }
  
    const commissionAsFraction = Number(poolInfo.operator_commission_percentage) / 10000;
  
    const aprApyTooltipContent = (
        <>
            <p className="font-semibold mb-1 text-sm text-zinc-100">{t('validatorInfo.tooltip.title')}</p>
            {isMounted && apy && <p><strong>{t('validatorInfo.tooltip.netApyLabel')} {(apy * (1 - commissionAsFraction)).toFixed(2)}%</strong></p>}
            {isMounted && <p className="text-xs text-zinc-400">{t('validatorInfo.tooltip.afterCommission', { commission: (commissionAsFraction * 100).toFixed(2) })}</p>}
            <hr className="my-1.5 border-zinc-700" />
            {isMounted && apy && <p className="text-xs">{t('validatorInfo.tooltip.grossApyLabel')} {apy.toFixed(2)}%</p>}
            <p className="text-xs mt-1.5 italic text-zinc-500">{t('validatorInfo.tooltip.footnote')}</p>
        </>
    );

    return (
        <div className="w-full rounded-3xl bg-[#0d0d1f]/70 backdrop-blur-xl border border-purple-600 p-8 sm:p-10 shadow-[0_0_20px_rgba(168,85,247,0.25)] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-shadow duration-300">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-zinc-100 tracking-tight">{t('validatorInfo.title')}</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <StatCard icon={Database} label={t('validatorInfo.cards.totalDelegated')}>
                    {isMounted ? `${(Number(poolInfo.active_stake_octas) / 1e8).toLocaleString(undefined, { maximumFractionDigits: 0 })} APT` : <Loader2 size={20} className="animate-spin" />}
                </StatCard>
                <StatCard icon={BadgePercent} label={t('validatorInfo.cards.netYield')}>
                    <div className="flex items-center">
                        <span className="text-green-400">{isMounted && apy ? `${(apy * (1 - commissionAsFraction)).toFixed(2)}% ${t('validatorInfo.cards.apySuffix')}` : <Loader2 size={20} className="animate-spin" />}</span>
                        {isMounted && apy && <LiveIndicator />}
                        <InfoTooltip content={aprApyTooltipContent} />
                    </div>
                </StatCard>
            </div>
            <div className="divide-y divide-zinc-800 border-t border-zinc-800">
                <DataRow icon={Signal} label={t('validatorInfo.rows.status')}>
                    <ValueDisplay className="font-semibold text-green-400">{t('validatorInfo.rows.statusValue')}</ValueDisplay>
                </DataRow>
                <DataRow icon={Percent} label={t('validatorInfo.rows.commission')}>
                    <ValueDisplay>{isMounted ? `${(commissionAsFraction * 100).toFixed(2)} %` : '...'}</ValueDisplay>
                </DataRow>
                <DataRow icon={CalendarClock} label={
                    <div className='max-w-[150px]'>
                        <div>{t('validatorInfo.rows.timeUntilUnlock')}</div>
                        <div className="text-xs text-zinc-500">{t('validatorInfo.rows.lockupPeriod')}</div>
                    </div>
                }>
                    {isMounted
                        ? <LockupProgressBar lockupEndsSecs={poolInfo.locked_until_secs} />
                        : <div className='w-full max-w-[180px] h-8 bg-zinc-800/50 rounded-lg animate-pulse' />
                    }
                </DataRow>
                <DataRow icon={Network} label={t('validatorInfo.rows.poolAddress')}>
                    <LinkValue href={`https://explorer.aptoslabs.com/validator/${poolInfo.poolAddress}?network=mainnet`}>
                        {`${poolInfo.poolAddress.substring(0, 8)}...`}
                    </LinkValue>
                </DataRow>
            </div>
        </div>
    );
}