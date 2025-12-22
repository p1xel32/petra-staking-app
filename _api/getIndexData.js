const APTOS_FULLNODE_URL = "https://fullnode.mainnet.aptoslabs.com/v1";
const TARGET_POOL = '0xf747e3a6282cc0dee1c89239c529b039c64fe48e88b50e5cedd40e9c094800bb';

async function fetchResource(address, type) {
    const res = await fetch(`${APTOS_FULLNODE_URL}/accounts/${address}/resource/${type}`);
    if (!res.ok) throw new Error(`Fetch failed for ${type}`);
    return res.json();
}

export default async function handler(req, res) {
    try {
        const [poolResources, stakingConfig, blockResource] = await Promise.all([
            fetch(`${APTOS_FULLNODE_URL}/accounts/${TARGET_POOL}/resources`).then(r => r.json()),
            fetchResource('0x1', '0x1::staking_config::StakingConfig'),
            fetchResource('0x1', '0x1::block::BlockResource')
        ]);
        
        const stakePoolRes = poolResources.find(r => r.type === '0x1::stake::StakePool');
        const delegationPoolRes = poolResources.find(r => r.type.startsWith('0x1::delegation_pool::DelegationPool'));

        const sanitizedPoolInfo = {
            poolAddress: TARGET_POOL,
            locked_until_secs: Number(stakePoolRes.data.locked_until_secs),
            active_stake_octas: String(stakePoolRes.data.active?.value || '0'),
            operator_commission_percentage: String(delegationPoolRes.data.operator_commission_percentage || '0'),
        };

        const rewardRate = BigInt(stakingConfig.data.rewards_rate);
        const denominator = BigInt(stakingConfig.data.rewards_rate_denominator);
        const epochsPerYear = 31536000 / Number(BigInt(blockResource.data.epoch_interval) / 1_000_000n);
        
        const epochRate = Number(rewardRate) / Number(denominator);
        const apy = (Math.pow(1 + epochRate, epochsPerYear) - 1) * 100;

        const responseData = { serverFetchedPoolInfo: sanitizedPoolInfo, serverFetchedApy: apy, error: null };

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
        res.end(JSON.stringify(responseData));

    } catch (error) {
        console.error("API Error in getIndexData:", error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: error.message }));
    }
}