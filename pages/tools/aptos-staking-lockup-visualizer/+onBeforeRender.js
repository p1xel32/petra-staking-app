const APTOS_FULLNODE_URL = "https://fullnode.mainnet.aptoslabs.com/v1";
const TARGET_POOL = '0xf747e3a6282cc0dee1c89239c529b039c64fe48e88b50e5cedd40e9c094800bb';

async function fetchResource(address, type) {
    const res = await fetch(`${APTOS_FULLNODE_URL}/accounts/${address}/resource/${type}`);
    if (!res.ok) throw new Error(`Fetch failed for ${type} at ${address}`);
    return res.json();
}

export async function onBeforeRender(pageContext) {
    try {
        const [stakingConfigRes, blockResourceRes, poolResourcesRes, ledgerInfoRes] = await Promise.all([
            fetchResource('0x1', '0x1::staking_config::StakingConfig'),
            fetchResource('0x1', '0x1::block::BlockResource'),
            fetch(`${APTOS_FULLNODE_URL}/accounts/${TARGET_POOL}/resources`).then(r => r.json()),
            fetch(`${APTOS_FULLNODE_URL}/`).then(r => r.json()),
        ]);

        const stakingConfig = {
            recurring_lockup_duration_secs: String(stakingConfigRes.data.recurring_lockup_duration_secs)
        };

        const currentLedgerTimestampUs = BigInt(ledgerInfoRes.ledger_timestamp);
        const epochIntervalUs = BigInt(blockResourceRes.data.epoch_interval);
        const epochStartUs = currentLedgerTimestampUs - (currentLedgerTimestampUs % epochIntervalUs);
        
        const epochTiming = {
            currentEpoch: Number(ledgerInfoRes.epoch),
            epochStartTime: new Date(Number(epochStartUs / 1000n)).toISOString(),
            epochIntervalMicroseconds: String(blockResourceRes.data.epoch_interval),
            dataAsOfTimestamp: new Date(Number(currentLedgerTimestampUs / 1000n)).toISOString()
        };

        const stakePoolRes = poolResourcesRes.find(r => r.type === '0x1::stake::StakePool');
        const validatorPoolInfo = {
            poolAddress: TARGET_POOL,
            locked_until_secs: Number(stakePoolRes.data.locked_until_secs)
        };
        
        const pageProps = {
            stakingConfig,
            epochTiming,
            validatorPoolInfo,
            error: null
        };
        
        return {
            pageContext: {
                pageProps
            }
        };

    } catch (error) {
        console.error("API Error in /tools/aptos-staking-lockup-visualizer/+onBeforeRender.js:", error);
        const pageProps = {
            stakingConfig: null,
            epochTiming: null,
            validatorPoolInfo: null,
            error: `Failed to load on-chain data: ${error.message}`
        };
        return {
            pageContext: {
                pageProps
            }
        };
    }
}