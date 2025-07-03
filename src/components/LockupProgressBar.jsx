// File: src/components/LockupProgressBar.jsx

import React from 'react';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useLockupTimer } from '../hooks/useLockupTimer.js'; 

const LockupProgressBar = ({ lockupEndsSecs }) => {
    const { timeLeft, isLoading, error } = useLockupTimer(lockupEndsSecs);

    if (isLoading) {
        return <div className="flex items-center justify-end gap-2 text-sm text-zinc-400"><Loader2 size={16} className="animate-spin" /> <span>Calculating...</span></div>;
    }

    if (error) {
        return <div className="flex items-center justify-end gap-2 text-sm text-red-400" title={error}><AlertCircle size={16} /> <span>Timer Error</span></div>;
    }

    if (timeLeft.total <= 0) {
        return (
            <div className="flex items-center justify-end gap-2 text-sm text-green-400 font-semibold">
                <CheckCircle size={16} />
                <span>Epoch Complete</span>
            </div>
        );
    }
    
    const pad = (num) => num.toString().padStart(2, '0');

    return (
        <div className="text-right">
            <div className="font-mono text-base tracking-tight text-zinc-100">
                <span>{timeLeft.days}</span>
                <span className="text-xs text-zinc-500 mr-1.5">d</span>
                
                <span>{pad(timeLeft.hours)}</span>
                <span className="text-xs text-zinc-500 mr-1.5">h</span>
                
                <span>{pad(timeLeft.minutes)}</span>
                <span className="text-xs text-zinc-500 mr-1.5">m</span>
                
                <span>{pad(timeLeft.seconds)}</span>
                <span className="text-xs text-zinc-500">s</span>
            </div>
        </div>
    );
};

export default LockupProgressBar;