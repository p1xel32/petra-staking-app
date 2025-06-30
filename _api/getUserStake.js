const APTOS_FULLNODE_URL = "https://fullnode.mainnet.aptoslabs.com/v1";
const VIEW_FUNCTION_URL = `${APTOS_FULLNODE_URL}/view`;

export default async function handler(req, res) {
  try {
    
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userAccountAddress = url.searchParams.get('account');
    const poolAddress = url.searchParams.get('pool');

    if (!userAccountAddress || !poolAddress) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing required query parameters: account or pool' }));
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

    const aptosResponse = await fetch(VIEW_FUNCTION_URL, fetchOptions);
    const responseText = await aptosResponse.text();
    
    if (!aptosResponse.ok) {
        throw new Error(`Aptos fullnode responded with status ${aptosResponse.status}. Body: ${responseText}`);
    }
    
    const userStakeResult = JSON.parse(responseText);

    // Преобразуем данные в нужный формат
    let stakeData = { active: 0, inactive: 0, pendingInactive: 0 };
    if (Array.isArray(userStakeResult) && userStakeResult.length >= 3) {
      const OCTAS = 100_000_000;
      stakeData = {
        active: Number(BigInt(userStakeResult[0])) / OCTAS,
        inactive: Number(BigInt(userStakeResult[1])) / OCTAS,
        pendingInactive: Number(BigInt(userStakeResult[2])) / OCTAS,
      };
    }
    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    // Устанавливаем кэширование, чтобы не перегружать ноду частыми запросами
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
    res.end(JSON.stringify(stakeData));

  } catch (error) {
    console.error('[API /api/getUserStake] Error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Failed to fetch or parse stake data from Aptos network' }));
  }
}