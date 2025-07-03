// File: src/hooks/useCountdown.js

import { useState, useEffect } from 'react';
export const useCountdown = (targetTimestampMicro) => {
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        if (!targetTimestampMicro) {
            setTimeLeft(null);
            return;
        }

        const targetDate = new Date(parseInt(targetTimestampMicro, 10) / 1000);

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
        };

        const intervalId = setInterval(updateTimer, 1000);
        updateTimer(); 

        return () => clearInterval(intervalId);
    }, [targetTimestampMicro]);

    return timeLeft;
};