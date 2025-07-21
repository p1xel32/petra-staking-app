import React, { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, AlertTriangle, Wallet } from 'lucide-react';
import UserStatus from './UserStatus';
import StakeForm from './StakeForm';

const VALIDATOR_POOL_ADDRESS = '0xf747e3a6282cc0dee1c89239c529b039c64fe48e88b50e5cedd40e9c094800bb';
const OCTAS_PER_APT = 100_000_000;

export default function StakeUnstakeControls({ account, onTransactionSuccess, userStake, connected, walletBalance = 0 }) {
    const { t } = useTranslation();
    const { signAndSubmitTransaction } = useWallet();
    
    const [activeTab, setActiveTab] = useState('stake');
    const [amountApt, setAmountApt] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [txResult, setTxResult] = useState(null);
    const [txError, setTxError] = useState(null);

    const { 
        inactive: withdrawableAmountApt = 0, 
        pendingInactive 
    } = userStake || {};

    const triggerHeaderConnect = () => {
        document.getElementById('main-header-connect-button')?.click();
    };

    const handleTransaction = async (functionName, amountOctas) => {
        if (!account || isSubmitting || typeof signAndSubmitTransaction !== 'function') return;
        setIsSubmitting(true);
        setTxError(null);
        setTxResult(null);
        try {
            const pendingTx = await signAndSubmitTransaction({ 
                data: {
                    function: `0x1::delegation_pool::${functionName}`,
                    functionArguments: [VALIDATOR_POOL_ADDRESS, String(amountOctas)],
                }
            });
            setTxResult({ message: t('stakeControls.messages.success', { hash: pendingTx.hash.substring(0, 10) }) });
            if (onTransactionSuccess) setTimeout(() => onTransactionSuccess(), 1500); 
            setAmountApt('');
        } catch (error) {
            let errorMessage = error.message || String(error);
            if (errorMessage.includes('User has rejected')) errorMessage = t('stakeControls.messages.rejected'); 
            setTxError({ message: t('stakeControls.messages.error', { message: errorMessage }) });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleStake = () => handleTransaction("add_stake", BigInt(Math.floor(parseFloat(amountApt) * OCTAS_PER_APT)));
    const handleUnstake = () => handleTransaction("unlock", BigInt(Math.floor(parseFloat(amountApt) * OCTAS_PER_APT)));
    const handleWithdraw = () => handleTransaction("withdraw", BigInt(Math.floor(withdrawableAmountApt * OCTAS_PER_APT)));

    return (
        <div className="w-full rounded-3xl bg-[#0d0d1f]/70 backdrop-blur-xl border border-purple-600 p-8 sm:p-10 shadow-[0_0_20px_rgba(168,85,247,0.25)]">
            <h2 className="text-3xl font-bold mb-6 text-center tracking-tight bg-gradient-to-br from-zinc-100 to-zinc-400 bg-clip-text text-transparent">{t('stakeControls.title')}</h2>
            
            {connected ? (
                <>
                    <UserStatus 
                        isFetching={userStake.isFetching}
                        activeStakeAmountApt={userStake.active}
                        pendingUnstakeAmountApt={pendingInactive?.amountApt || 0}
                        withdrawableAmountApt={withdrawableAmountApt}
                        walletBalance={walletBalance} 
                        onWithdraw={handleWithdraw} 
                        isSubmitting={isSubmitting}
                        pendingInactive={pendingInactive}
                    />
                    <div className="mt-8 pt-6 border-t border-zinc-800">
                        <StakeForm
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            amountApt={amountApt}
                            setAmountApt={setAmountApt}
                            handleStake={handleStake}
                            handleUnstake={handleUnstake}
                            isSubmitting={isSubmitting}
                            connected={connected}
                            setTxError={setTxError}
                            setTxResult={setTxResult}
                        />
                    </div>
                </>
            ) : (
                <>
                    <p className="text-center text-sm text-zinc-400 -mt-4 mb-8">
                        {t('stakeControls.notConnected.description')}
                    </p>
                    <div className="pt-6 border-t border-zinc-800">
                        <button onClick={triggerHeaderConnect} className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-500/40 focus:outline-none flex items-center justify-center gap-2">
                            <Wallet size={20} />
                            {t('stakeControls.notConnected.button')}
                        </button>
                    </div>
                </>
            )}

            {txError && ( <div className="mt-5 p-3 bg-red-900/40 text-red-300 border border-red-500/30 rounded-lg text-sm flex items-center gap-2"><AlertTriangle size={18} /> <span>{txError.message}</span></div> )}
            {txResult && ( <div className="mt-5 p-3 bg-green-900/40 text-green-300 border border-green-500/30 rounded-lg text-sm flex items-center gap-2"><CheckCircle size={18} /> <span>{txResult.message}</span></div> )}
        </div>
    );
}