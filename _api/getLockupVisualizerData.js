// Файл: _api/getLockupVisualizerData.js

const APTOS_FULLNODE_URL = "https://fullnode.mainnet.aptoslabs.com/v1";
const TARGET_POOL = '0xf747e3a6282cc0dee1c89239c529b039c64fe48e88b50e5cedd40e9c094800bb';

async function fetchResource(address, type) {
    const res = await fetch(`${APTOS_FULLNODE_URL}/accounts/${address}/resource/${type}`);
    if (!res.ok) throw new Error(`Fetch failed for ${type}`);
    return res.json();
}

export default async function handler(req, res) {
    try {
        const [stakingConfigRes, blockResourceRes, poolResourcesRes, ledgerInfoRes] = await Promise.all([
            fetchResource('0x1', '0x1::staking_config::StakingConfig'),
            fetchResource('0x1', '0x1::block::BlockResource'),
            fetch(`${APTOS_FULLNODE_URL}/accounts/${TARGET_POOL}/resources`).then(r => r.json()),
            fetch(`${APTOS_FULLNODE_URL}/`).then(r => r.json()),
        ]);

        const sanitizedStakingConfig = {
            recurring_lockup_duration_secs: String(stakingConfigRes.data.recurring_lockup_duration_secs)
        };

        const currentLedgerTimestampUs = BigInt(ledgerInfoRes.ledger_timestamp);
        const epochIntervalUs = BigInt(blockResourceRes.data.epoch_interval);
        const epochStartUs = currentLedgerTimestampUs - (currentLedgerTimestampUs % epochIntervalUs);
        
        const sanitizedEpochTiming = {
            currentEpoch: Number(ledgerInfoRes.epoch),
            epochStartTime: new Date(Number(epochStartUs / 1000n)).toISOString(),
            epochIntervalMicroseconds: String(blockResourceRes.data.epoch_interval),
            dataAsOfTimestamp: new Date(Number(currentLedgerTimestampUs / 1000n)).toISOString()
        };

        const stakePoolRes = poolResourcesRes.find(r => r.type === '0x1::stake::StakePool');
        const sanitizedPoolInfo = {
            poolAddress: TARGET_POOL,
            locked_until_secs: Number(stakePoolRes.data.locked_until_secs)
        };
        
        const responseData = {
            stakingConfig: sanitizedStakingConfig,
            epochTiming: sanitizedEpochTiming,
            validatorPoolInfo: sanitizedPoolInfo,
            error: null
        };
        
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
        res.end(JSON.stringify(responseData));

    } catch (error) {
        console.error("API Error in getLockupVisualizerData:", error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: `Failed to load on-chain data: ${error.message}` }));
    }
}