import { TARGET_POOL_ADDRESS } from '../src/config/consts';

const APTOS_FULLNODE_URL = "https://fullnode.mainnet.aptoslabs.com/v1";
// Коэффициент эффективности валидатора (Realized vs Target). 
// 0.88 (88%) скорректирует теоретические 7% до реальных ~6.1%, как в Explorer.
const VALIDATOR_PERFORMANCE_FACTOR = 0.88; 

async function fetchResource(address, type) {
    const res = await fetch(`${APTOS_FULLNODE_URL}/accounts/${address}/resource/${type}`);
    if (!res.ok) throw new Error(`Fetch failed for ${type}`);
    return res.json();
}

export default async function handler(req, res) {
    try {
        const [poolResources, stakingConfig, blockResource] = await Promise.all([
            fetch(`${APTOS_FULLNODE_URL}/accounts/${TARGET_POOL_ADDRESS}/resources`).then(r => r.json()),
            fetchResource('0x1', '0x1::staking_config::StakingConfig'),
            fetchResource('0x1', '0x1::block::BlockResource')
        ]);
        
        const stakePoolRes = poolResources.find(r => r.type === '0x1::stake::StakePool');
        const delegationPoolRes = poolResources.find(r => r.type.startsWith('0x1::delegation_pool::DelegationPool'));

        const sanitizedPoolInfo = {
            poolAddress: TARGET_POOL_ADDRESS,
            locked_until_secs: Number(stakePoolRes.data.locked_until_secs),
            active_stake_octas: String(stakePoolRes.data.active?.value || '0'),
            operator_commission_percentage: String(delegationPoolRes.data.operator_commission_percentage || '0'),
        };

        const rewardRate = BigInt(stakingConfig.data.rewards_rate);
        const denominator = BigInt(stakingConfig.data.rewards_rate_denominator);
        const epochsPerYear = 31536000 / Number(BigInt(blockResource.data.epoch_interval) / 1_000_000n);
        
        // Считаем теоретическую ставку и умножаем на реальную эффективность
        const theoreticalApr = Number(rewardRate) / Number(denominator);
        const realizedApr = theoreticalApr * VALIDATOR_PERFORMANCE_FACTOR;

        // Считаем APY (сложный процент) на основе скорректированной ставки
        const apy = (Math.pow(1 + (realizedApr / epochsPerYear), epochsPerYear) - 1) * 100;

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