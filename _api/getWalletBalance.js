// Файл: _api/getWalletBalance.js

const APTOS_FULLNODE_URL = "https://fullnode.mainnet.aptoslabs.com/v1";

export default async function handler(req, res) {
    try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const userAccountAddress = url.searchParams.get('account');

        if (!userAccountAddress) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing required query parameter: account' }));
            return;
        }

        const resourceUrl = `${APTOS_FULLNODE_URL}/accounts/${userAccountAddress}/resource/0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`;
        const aptosResponse = await fetch(resourceUrl);

        if (!aptosResponse.ok) {
            if (aptosResponse.status === 404) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ balance: 0 }));
                return;
            }
            throw new Error(`Aptos fullnode responded with status ${aptosResponse.status}`);
        }
        
        const coinStoreData = await aptosResponse.json();
        const balanceOctas = BigInt(coinStoreData.data.coin.value);
        const balanceApt = Number(balanceOctas) / 100_000_000;
        
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
        res.end(JSON.stringify({ balance: balanceApt }));

    } catch (error) {
        console.error('[API /api/getWalletBalance] Error:', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Failed to fetch wallet balance' }));
    }
}