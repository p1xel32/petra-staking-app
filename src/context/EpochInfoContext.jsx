// File: src/context/EpochInfoContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react';

const EpochInfoContext = createContext(null);

export const EpochInfoProvider = ({ children }) => {
    const [epochInfo, setEpochInfo] = useState({
        data: null,
        isLoading: true,
        error: null,
    });

    useEffect(() => {
        const fetchEpochInfo = async () => {
            try {
                
                const response = await fetch('/api/getEpochInfo');
                if (!response.ok) {
                    throw new Error('API Error: Failed to fetch epoch info');
                }
                const data = await response.json();
                setEpochInfo({ data, isLoading: false, error: null });
            } catch (err) {
                setEpochInfo({ data: null, isLoading: false, error: err.message });
            }
        };

        fetchEpochInfo();
    }, []); 

    return (
        <EpochInfoContext.Provider value={epochInfo}>
            {children}
        </EpochInfoContext.Provider>
    );
};

export const useEpochInfo = () => {
    const context = useContext(EpochInfoContext);
    if (context === null) {
        throw new Error('useEpochInfo must be used within a wrapping EpochInfoProvider');
    }
    return context;
};