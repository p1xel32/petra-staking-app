// Файл: src/components/ConnectWalletButton.jsx

import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { X, ShieldCheck, AlertTriangle, ChevronRight } from 'lucide-react';

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
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isModalOpen]);

  // Дизайн модального окна оставлен прежним, так как он соответствует стилю ValidatorInfo
  const modalContent = (
    <div 
      className={`fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-[1000] p-4 transition-opacity duration-300 ease-in-out ${isModalAnimating ? 'opacity-100' : 'opacity-0'}`}
      onClick={closeModal}
    >
      <div 
        className={`w-full max-w-sm rounded-3xl bg-[#0d0d1f]/80 backdrop-blur-2xl border border-purple-600/50 p-6 space-y-4 shadow-[0_0_20px_rgba(168,85,247,0.25)] transition-all duration-300 ease-out ${isModalAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 -translate-y-4'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-zinc-100 tracking-tight">Select Wallet</h3>
          <button onClick={closeModal} className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-700/60 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#0d0d1f]" aria-label="Close wallet selection modal">
            <X size={22} />
          </button>
        </div>
        
        {(wallets || []).length === 0 ? (
          <div className="text-center py-6">
            <AlertTriangle size={36} className="mx-auto text-yellow-400 mb-3" />
            <p className="text-zinc-300">No wallets found.</p>
            <p className="text-sm text-zinc-400">Please install an Aptos-compatible wallet.</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar"> 
            {(wallets || []).map((w) => (
              <button
                key={w.name}
                onClick={() => handleWalletConnect(w.name)}
                className="w-full flex items-center text-left p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-purple-500/50 text-zinc-100 transition-all duration-200 ease-in-out group transform hover:scale-[1.02] hover:bg-zinc-800/60 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#0d0d1f]"
                aria-label={`Connect with ${w.name}`}
              >
                {w.icon && <img src={w.icon} alt={`${w.name} icon`} className="w-8 h-8 mr-4 rounded-full" />}
                <span className="flex-grow font-medium text-sm truncate">{w.name}</span>
                <ChevronRight size={20} className="text-zinc-400 group-hover:text-purple-300 transition-colors flex-shrink-0 ml-2" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {connected && address ? (
        // ✅ ОБНОВЛЕННЫЙ ДИЗАЙН КНОПКИ (PRO СТИЛЬ)
        <button 
          onClick={disconnect} 
          className="group flex items-center gap-x-3 px-5 py-2.5 bg-zinc-800/50 rounded-xl border border-white/10 text-sm font-semibold text-zinc-100 shadow-lg shadow-black/20 hover:bg-zinc-800/80 hover:border-white/20 active:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-black transition-all duration-200" 
          aria-label={`Disconnect wallet ${address.slice(0, 6)}...${address.slice(-4)}`}
        >
          {wallet?.icon && <img src={wallet.icon} alt="Wallet icon" className="w-5 h-5 rounded-full" />}
          <span className="font-mono">{address.slice(0, 6)}...{address.slice(-4)}</span>
          <ShieldCheck size={18} className="text-green-400" />
        </button>
      ) : (
        // ✅ ОБНОВЛЕННЫЙ ДИЗАЙН КНОПКИ (PRO СТИЛЬ)
        <button 
          onClick={openModal} 
          className="group flex items-center gap-x-3 px-5 py-2.5 bg-zinc-800/50 rounded-xl border border-white/10 text-sm font-semibold text-zinc-100 shadow-lg shadow-black/20 hover:bg-zinc-800/80 hover:border-white/20 active:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-black transition-all duration-200" 
          aria-label="Connect wallet"
        >
          Connect Wallet
        </button>
      )}

      {isModalOpen && modalRoot && ReactDOM.createPortal(modalContent, modalRoot)}
    </>
  );
}