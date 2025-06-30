// Файл: _api/getUserStake.js

const APTOS_FULLNODE_URL = "https://fullnode.mainnet.aptoslabs.com/v1";
const VIEW_FUNCTION_URL = `${APTOS_FULLNODE_URL}/view`;

// ✅ ИСПОЛЬЗУЕМ СТАНДАРТНЫЙ СИНТАКСИС (req, res)
export default async function handler(req, res) {
  try {
    const url = new URL(req.originalUrl, `http://${req.headers.host}`);
    const userAccountAddress = url.searchParams.get('account');
    const poolAddress = url.searchParams.get('pool');

    if (!userAccountAddress || !poolAddress) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing account or pool address' }));
      return;
    }

    const requestBody = {
      function: '0x1::delegation_pool::get_stake',
      type_arguments: [],
      arguments: [poolAddress, userAccountAddress],
    };

    const fetchOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    };

    console.log("--- [Debug Fetch] Preparing to send request ---");
    console.log(`Body: ${fetchOptions.body}`);

    const aptosResponse = await fetch(VIEW_FUNCTION_URL, fetchOptions);
    const responseText = await aptosResponse.text();
    
    console.log(`[Debug Fetch] Got response. Status: ${aptosResponse.status}`);
    console.log('[Debug Fetch] Raw response body:', responseText);

    if (!aptosResponse.ok) {
        throw new Error(`Aptos fullnode responded with status ${aptosResponse.status}. Body: ${responseText}`);
    }
    
    const userStakeResult = JSON.parse(responseText);

    let stakeData = { active: 0, inactive: 0, pendingInactive: 0 };
    if (Array.isArray(userStakeResult) && userStakeResult.length >= 3) {
      stakeData = {
        active: Number(BigInt(userStakeResult[0])) / 1e8,
        inactive: Number(BigInt(userStakeResult[1])) / 1e8,
        pendingInactive: Number(BigInt(userStakeResult[2])) / 1e8,
      };
    }
    
    // ✅ ГЛАВНОЕ ИСПРАВЛЕНИЕ: Отправляем ответ с помощью res.end()
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
    res.end(JSON.stringify(stakeData));

  } catch (error) {
    console.error('[Debug Fetch] API Error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Failed to fetch or parse stake data from Aptos network' }));
  }
}