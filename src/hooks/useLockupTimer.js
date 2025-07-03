// File: src/hooks/useLockupTimer.js

import { useState, useEffect } from 'react';
import { useEpochInfo } from '@/context/EpochInfoContext.jsx';


export function useLockupTimer(lockupEndsSecs) {
    const { data: epochData, isLoading: isEpochLoading, error: epochError } = useEpochInfo();
    const [timeLeft, setTimeLeft] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isEpochLoading) {
            setIsLoading(true);
            return;
        }
        if (epochError) {
            setError(epochError);
            setIsLoading(false);
            return;
        }
        if (!lockupEndsSecs || !epochData || lockupEndsSecs * 1000 < Date.now()) {
            setTimeLeft({ total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
            setIsLoading(false);
            return;
        }
        const targetDate = new Date(lockupEndsSecs * 1000);
        const updateTimer = () => {
            const now = new Date();
            const difference = targetDate.getTime() - now.getTime();
            if (difference <= 0) {
                setTimeLeft({ total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
                clearInterval(intervalId);
                return;
            }
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);
            setTimeLeft({ total: difference, days, hours, minutes, seconds });
            setIsLoading(false);
        };
        const intervalId = setInterval(updateTimer, 1000); 
        updateTimer();
        return () => clearInterval(intervalId);
    }, [lockupEndsSecs, epochData, isEpochLoading, epochError]);
    
    return { timeLeft, isLoading, error };
}