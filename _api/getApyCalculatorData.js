// Файл: _api/getApyCalculatorData.js

const APTOS_FULLNODE_URL = "https://fullnode.mainnet.aptoslabs.com/v1";
const PYTH_APT_USD_FEED_ID = '0x03ae4db29ed4ae33d323568895aa00337e658e348b37509f5372ae51f0af00d5';
const PYTH_HTTP_ENDPOINT = `https://hermes.pyth.network/api/latest_price_feeds?ids[]=${PYTH_APT_USD_FEED_ID}`;

async function fetchResource(address, type) {
    const res = await fetch(`${APTOS_FULLNODE_URL}/accounts/${address}/resource/${type}`);
    if (!res.ok) throw new Error(`Fetch failed for ${type}`);
    return res.json();
}

async function fetchAptPrice() {
    try {
        const res = await fetch(PYTH_HTTP_ENDPOINT);
        if (!res.ok) return null;
        const data = await res.json();
        if (data && data[0]?.price) {
            const priceData = data[0].price;
            return Number(priceData.price) * Math.pow(10, priceData.expo);
        }
        return null;
    } catch (e) {
        console.warn("Could not fetch APT price from Pyth:", e.message);
        return null;
    }
}

export default async function handler(req, res) {
    try {
        const [stakingConfig, blockResource, aptPriceUSD] = await Promise.all([
            fetchResource('0x1', '0x1::staking_config::StakingConfig'),
            fetchResource('0x1', '0x1::block::BlockResource'),
            fetchAptPrice()
        ]);
        
        const rewardRate = BigInt(stakingConfig.data.rewards_rate);
        const denominator = BigInt(stakingConfig.data.rewards_rate_denominator);
        const epochsPerYear = 31536000 / Number(BigInt(blockResource.data.epoch_interval) / 1_000_000n);
        const apy = (Math.pow(1 + (Number(rewardRate) / Number(denominator)), epochsPerYear) - 1) * 100;

        const responseData = { defaultApy: apy, aptPriceUSD: aptPriceUSD, error: null };

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
        res.end(JSON.stringify(responseData));

    } catch (error) {
        console.error("API Error in getApyCalculatorData:", error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: `Failed to load on-chain data: ${error.message}` }));
    }
}