import React, { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import {
    CheckCircle, AlertTriangle, RefreshCw, ArrowDownToLine, ArrowUpFromLine, 
    Loader2, Wallet, DownloadCloud, Hourglass, Landmark, PackageCheck, CheckCircle2
} from 'lucide-react';

// Импортируем дочерние компоненты
import UserStatus from './UserStatus';
import StakeForm from './StakeForm';

const VALIDATOR_POOL_ADDRESS = '0xf747e3a6282cc0dee1c89239c529b039c64fe48e88b50e5cedd40e9c094800bb';
const OCTAS_PER_APT = 100_000_000;
const MIN_STAKE_APT = 11;

export default function StakeUnstakeControls({ account, onTransactionSuccess, userStake, connected, walletBalance = 0 }) {
    const { signAndSubmitTransaction, connect, wallets } = useWallet();
    const [activeTab, setActiveTab] = useState('stake');
    const [amountApt, setAmountApt] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [txResult, setTxResult] = useState(null);
    const [txError, setTxError] = useState(null);

    const { inactive: withdrawableAmountApt = 0 } = userStake || {};

    // --- ЛОГИКА ОБРАБОТКИ ТРАНЗАКЦИЙ ---
    const handleConnect = () => {
        if (wallets && wallets.length > 0) {
            connect(wallets[0].name);
        } else {
            setTxError({ message: "No Aptos wallet found. Please install a wallet extension." });
        }
    };

    const handleTransaction = async (actionType, functionName, amountOctas) => {
        if (!account || isSubmitting || typeof signAndSubmitTransaction !== 'function') return;
        setIsSubmitting(true);
        setTxError(null);
        setTxResult(null);
        const transactionInput = { 
            data: {
                function: `0x1::delegation_pool::${functionName}`,
                functionArguments: [VALIDATOR_POOL_ADDRESS, String(amountOctas)],
                typeArguments: []
            }
        };
        try {
            const pendingTx = await signAndSubmitTransaction(transactionInput);
            setTxResult({ type: 'success', message: `Transaction successful! Hash: ${pendingTx.hash.substring(0, 10)}...` });
            if (onTransactionSuccess) { 
                setTimeout(() => { onTransactionSuccess(); }, 1500); 
            }
            setAmountApt('');
        } catch (error) {
            let errorMessage = error.message || String(error);
            if (errorMessage.includes('User has rejected the request')) { 
                errorMessage = 'Transaction rejected by user.'; 
            }
            setTxError({ message: `Error: ${errorMessage}` });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStake = () => {
        const amount = parseFloat(amountApt);
        if (isNaN(amount) || amount < MIN_STAKE_APT) {
            setTxError({ message: `Minimum stake amount is ${MIN_STAKE_APT} APT.` });
            return;
        }
        handleTransaction("Stake", "add_stake", BigInt(Math.floor(amount * OCTAS_PER_APT)));
    };

    const handleUnstake = () => {
        const amount = parseFloat(amountApt);
        if (isNaN(amount) || amount <= 0) {
            setTxError({ message: "Please enter a valid amount > 0 to unstake." });
            return;
        }
        handleTransaction("Unstake", "unlock", BigInt(Math.floor(amount * OCTAS_PER_APT)));
    };

    const handleWithdraw = () => {
        if (withdrawableAmountApt <= 0) return;
        const amountOctas = BigInt(Math.floor(withdrawableAmountApt * OCTAS_PER_APT));
        if (amountOctas <= 0n) {
            setTxError({ message: "Withdrawable amount is too small." });
            return;
        }
        handleTransaction("Withdraw", "withdraw", amountOctas);
    };

    return (
        <div className="w-full rounded-3xl bg-[#0d0d1f]/70 backdrop-blur-xl border border-purple-600 p-8 sm:p-10 shadow-[0_0_20px_rgba(168,85,247,0.25)] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-shadow duration-300">
            <h2 className="text-3xl font-bold mb-6 text-center tracking-tight bg-gradient-to-br from-zinc-100 to-zinc-400 bg-clip-text text-transparent">Manage Your Stake</h2>

            {connected ? (
                <>
                    <UserStatus 
                        userStake={userStake} 
                        walletBalance={walletBalance} 
                        onWithdraw={handleWithdraw} 
                        isSubmitting={isSubmitting} 
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
                <div className="mt-8 pt-6 border-t border-zinc-800">
                    <button
                        onClick={handleConnect}
                        className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-500/40 focus:outline-none flex items-center justify-center gap-2"
                    >
                        <Wallet size={20} />
                        Connect Wallet to Manage Stake
                    </button>

                    <p className="text-sm text-zinc-400 mt-3 text-center">
                        View your stake, rewards and unlock date.
                    </p>
                </div>

            )}

            {txError && txError.message && ( <div className="mt-5 p-3 bg-red-900/40 text-red-300 border border-red-500/30 rounded-lg text-sm flex items-center gap-2"><AlertTriangle size={18} /> <span>{txError.message}</span></div> )}
            {txResult && txResult.message && ( <div className="mt-5 p-3 bg-green-900/40 text-green-300 border border-green-500/30 rounded-lg text-sm flex items-center gap-2"><CheckCircle size={18} /> <span>{txResult.message}</span></div> )}
        </div>
    );
}