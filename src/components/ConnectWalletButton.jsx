// Файл: src/components/ConnectWalletButton.jsx

import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { XIcon, ShieldCheckIcon, AlertTriangle as AlertTriangleIcon, ChevronRightIcon } from 'lucide-react';

export default function ConnectWalletButton() {
  const { account, connected, disconnect, wallets, connect, wallet } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalAnimating, setIsModalAnimating] = useState(false); 
  const address = account?.address?.toString?.();
  const [modalRoot, setModalRoot] = useState(null);

  useEffect(() => {
    setModalRoot(document.getElementById('modal-root'));
  }, []);

  const openModal = () => {
    setIsModalOpen(true);
    requestAnimationFrame(() => setIsModalAnimating(true));
  };

  const closeModal = () => {
    setIsModalAnimating(false);
    setTimeout(() => setIsModalOpen(false), 300); 
  };

  const handleWalletConnect = (walletName) => {
    connect(walletName);
    closeModal();
  };

  useEffect(() => {
    if (isModalOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isModalOpen]);

  const modalContent = (
    <div 
      className={`fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[1000] p-4 overflow-y-auto transition-opacity duration-300 ease-in-out ${isModalAnimating ? 'opacity-100' : 'opacity-0'}`}
      onClick={closeModal}
    >
      <div 
        className={`bg-slate-800/80 backdrop-blur-2xl border border-slate-700/60 rounded-2xl shadow-2xl p-6 w-full max-w-xs sm:max-w-sm space-y-4 transition-all duration-300 ease-out ${isModalAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 -translate-y-4'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-white">Select Wallet</h3>
          <button onClick={closeModal} className="text-slate-400 hover:text-slate-100 p-1 rounded-full hover:bg-slate-700/60 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800" aria-label="Close wallet selection modal">
            <XIcon size={22} />
          </button>
        </div>
        
        {/* ✅ ЗАЩИТА ОТ UNDEFINED */}
        {(wallets || []).length === 0 && (
          <div className="text-center py-6">
            <AlertTriangleIcon size={36} className="mx-auto text-yellow-400 mb-3" />
            <p className="text-slate-300">No wallets found.</p>
            <p className="text-sm text-slate-400">Please install an Aptos-compatible wallet.</p>
          </div>
        )}

        <div className="space-y-2.5 max-h-60 sm:max-h-80 overflow-y-auto pr-1 custom-scrollbar"> 
          {/* ✅ ЗАЩИТА ОТ UNDEFINED */}
          {(wallets || []).map((w) => (
            <button
              key={w.name}
              onClick={() => handleWalletConnect(w.name)}
              className="w-full flex items-center text-left px-4 py-3.5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 dark:bg-slate-700/30 dark:border-slate-600/50 dark:hover:bg-slate-700/50 dark:hover:border-slate-500/60 text-slate-100 dark:text-slate-50 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800 group transform hover:scale-[1.02] hover:shadow-lg active:scale-95"
              aria-label={`Connect with ${w.name}`}
            >
              {w.icon && <img src={w.icon} alt={`${w.name} icon`} className="w-8 h-8 mr-4 rounded-full object-contain shadow-md flex-shrink-0" />}
              <span className="flex-grow font-medium text-sm truncate">{w.name}</span>
              <ChevronRightIcon size={20} className="text-slate-400 dark:text-slate-400 group-hover:text-purple-300 dark:group-hover:text-purple-200 transition-colors flex-shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {connected && address ? (
        <button onClick={disconnect} className="flex items-center gap-x-2.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-lg hover:shadow-purple-500/40 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-900 transform hover:scale-105 active:scale-100" aria-label={`Disconnect wallet ${address.slice(0, 6)}...${address.slice(-4)}`}>
          {wallet?.icon && <img src={wallet.icon} alt="Wallet icon" className="w-5 h-5 rounded-full object-contain" />}
          <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
          <ShieldCheckIcon size={18} className="opacity-80" />
        </button>
      ) : (
        <button onClick={openModal} className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-lg hover:shadow-purple-500/40 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-900 transform hover:scale-105 active:scale-100" aria-label="Connect wallet">
          Connect Wallet
        </button>
      )}

      {isModalOpen && modalRoot && ReactDOM.createPortal(modalContent, modalRoot)}
    </>
  );
}