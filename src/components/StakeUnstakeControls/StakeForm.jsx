import React from 'react';
import { Loader2, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

const MIN_STAKE_APT = 11;

export default function StakeForm({
  activeTab,
  setActiveTab,
  amountApt,
  setAmountApt,
  handleStake,
  handleUnstake,
  isSubmitting,
  connected,
  setTxError,
  setTxResult,
}) {
  return (
    <>
      {/* ✅ Улучшенные табы для большей четкости */}
      <div className="flex w-full rounded-xl mb-4 bg-zinc-900/50 p-1 border border-zinc-800">
        <button
          onClick={() => setActiveTab('stake')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 focus:outline-none ${
            activeTab === 'stake'
              ? 'bg-zinc-700 text-white shadow' // Активная вкладка стала значительно заметнее
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Stake
        </button>
        <button
          onClick={() => setActiveTab('unstake')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 focus:outline-none ${
            activeTab === 'unstake'
              ? 'bg-zinc-700 text-white shadow' // Активная вкладка стала значительно заметнее
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Unstake
        </button>
      </div>

      {/* ✅ Улучшенное поле ввода в общем стиле */}
      <div className="mb-4">
        <label
          htmlFor="amount"
          className="block text-xs font-medium text-zinc-400 mb-1.5"
        >
          {activeTab === 'stake' ? 'Amount to Stake' : 'Amount to Unstake'}
        </label>
        <div className="relative">
          <input
            type="number"
            id="amount"
            name="amount"
            // Дизайн полностью соответствует другим элементам
            className="w-full pr-24 px-4 py-3 bg-zinc-900/50 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 placeholder:text-zinc-500 text-zinc-100 text-lg transition-colors duration-200"
            placeholder={`e.g., ${MIN_STAKE_APT}`}
            value={amountApt}
            onChange={(e) => {
              setAmountApt(e.target.value);
              setTxError(null);
              setTxResult(null);
            }}
            disabled={!connected || isSubmitting}
            step="any"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400 pointer-events-none">
            Available
          </div>
        </div>
      </div>

      {/* Кнопки действий */}
      {activeTab === 'stake' && (
        <>
          {/* ✅ Кнопка основного действия */}
          <button
            onClick={handleStake}
            disabled={
              !connected ||
              isSubmitting ||
              !amountApt ||
              parseFloat(amountApt) < MIN_STAKE_APT
            }
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-purple-500 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
          >
            {isSubmitting ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <ArrowDownToLine size={18} />
            )}
            Stake APT
          </button>

          {/* ✅ Улучшенный текст подсказки */}
          {(!connected || !amountApt || parseFloat(amountApt) < MIN_STAKE_APT) && (
            <p className="text-xs text-zinc-400 text-center mt-3">
              {!connected
                ? 'Connect wallet to enable staking'
                : `Enter at least ${MIN_STAKE_APT} APT to enable`}
            </p>
          )}
        </>
      )}

      {activeTab === 'unstake' && (
        // ✅ Кнопка второстепенного действия в стиле 'Pro'
        <button
          onClick={handleUnstake}
          disabled={
            !connected || isSubmitting || !amountApt || parseFloat(amountApt) <= 0
          }
          className="w-full flex items-center justify-center gap-x-3 px-5 py-3 bg-zinc-800/50 rounded-xl border border-white/10 text-sm font-semibold text-zinc-100 shadow-lg shadow-black/20 hover:bg-zinc-800/80 hover:border-white/20 active:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowUpFromLine size={18} />
          Unstake APT
        </button>
      )}
    </>
  );
}