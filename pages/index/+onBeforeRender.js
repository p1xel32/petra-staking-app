const APTOS_FULLNODE_URL = "https://fullnode.mainnet.aptoslabs.com/v1";
const TARGET_POOL = '0xf747e3a6282cc0dee1c89239c529b039c64fe48e88b50e5cedd40e9c094800bb';

async function fetchResource(address, type) {
    const res = await fetch(`${APTOS_FULLNODE_URL}/accounts/${address}/resource/${type}`);
    if (!res.ok) throw new Error(`Fetch failed for ${type} at ${address}`);
    return res.json();
}

export async function onBeforeRender(pageContext) {
    try {
        const [poolResources, stakingConfig, blockResource] = await Promise.all([
            fetch(`${APTOS_FULLNODE_URL}/accounts/${TARGET_POOL}/resources`).then(r => r.json()),
            fetchResource('0x1', '0x1::staking_config::StakingConfig'),
            fetchResource('0x1', '0x1::block::BlockResource')
        ]);
        
        const stakePoolRes = poolResources.find(r => r.type === '0x1::stake::StakePool');
        const delegationPoolRes = poolResources.find(r => r.type.startsWith('0x1::delegation_pool::DelegationPool'));

        const serverFetchedPoolInfo = {
            poolAddress: TARGET_POOL,
            locked_until_secs: Number(stakePoolRes.data.locked_until_secs),
            active_stake_octas: String(stakePoolRes.data.active?.value || '0'),
            operator_commission_percentage: String(delegationPoolRes.data.operator_commission_percentage || '0'),
        };

        const rewardRate = BigInt(stakingConfig.data.rewards_rate);
        const denominator = BigInt(stakingConfig.data.rewards_rate_denominator);
        const epochsPerYear = 31536000 / (Number(BigInt(blockResource.data.epoch_interval)) / 1_000_000);
        const serverFetchedApy = (Math.pow(1 + (Number(rewardRate) / Number(denominator)), epochsPerYear) - 1) * 100;

        const pageProps = { serverFetchedPoolInfo, serverFetchedApy, error: null };

        return {
            pageContext: {
                pageProps
            }
        };

    } catch (error) {
        console.error("API Error in /index/+onBeforeRender.js:", error);
        const pageProps = { 
            serverFetchedPoolInfo: null, 
            serverFetchedApy: null, 
            error: error.message 
        };
        return {
            pageContext: {
                pageProps
            }
        };
    }
}