const APTOS_FULLNODE_URL = "https://fullnode.mainnet.aptoslabs.com/v1";

// A helper to fetch a resource from the Aptos node.
async function fetchResource(address, type) {
    const res = await fetch(`${APTOS_FULLNODE_URL}/accounts/${address}/resource/${type}`);
    if (!res.ok) throw new Error(`Fetch failed for ${type} at address ${address}`);
    return res.json();
}

export default async function handler(req, res) {
    try {
        // Get the global staking configuration and the current ledger info.
        const [stakingConfig, ledgerInfo] = await Promise.all([
            fetchResource('0x1', '0x1::staking_config::StakingConfig'),
            fetch(`${APTOS_FULLNODE_URL}/`).then(r => r.json()),
        ]);

        const responseData = {
            lockupDurationSecs: Number(stakingConfig.data.recurring_lockup_duration_secs),
            // Convert current ledger timestamp from microseconds to seconds.
            currentChainTimeSecs: Math.floor(Number(ledgerInfo.ledger_timestamp) / 1000000),
        };
        
        // Return the data to the frontend.
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
        res.end(JSON.stringify(responseData));

    } catch (error) {
        console.error("API Error in getEpochInfo:", error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: `Failed to load on-chain data: ${error.message}` }));
    }
}