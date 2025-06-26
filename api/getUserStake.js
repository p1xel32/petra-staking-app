// File: api/getUserStake.js

const APTOS_FULLNODE_URL = "https://fullnode.mainnet.aptoslabs.com/v1";
const VIEW_FUNCTION_URL = `${APTOS_FULLNODE_URL}/view`;

export default async function handler(request) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const userAccountAddress = url.searchParams.get('account');
  const poolAddress = url.searchParams.get('pool');

  if (!userAccountAddress || !poolAddress) {
    return new Response(JSON.stringify({ error: 'Missing account or pool address' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 1. Формируем тело запроса
  const requestBody = {
    function: '0x1::delegation_pool::get_stake',
    type_arguments: [],
    arguments: [poolAddress, userAccountAddress],
  };

  // 2. Формируем параметры для fetch
  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  };

  // --- ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ ИСХОДЯЩЕГО ЗАПРОСА ---
  console.log("--- [Debug Fetch] Preparing to send request ---");
  console.log(`URL: ${VIEW_FUNCTION_URL}`);
  console.log(`Method: ${fetchOptions.method}`);
  console.log("Headers:", JSON.stringify(fetchOptions.headers, null, 2));
  console.log("Body:", fetchOptions.body);
  console.log("---------------------------------------------");


  try {
    const aptosResponse = await fetch(VIEW_FUNCTION_URL, fetchOptions);

    console.log(`[Debug Fetch] Got response. Status: ${aptosResponse.status}`);
    
    const responseText = await aptosResponse.text();
    console.log('[Debug Fetch] Raw response body:', responseText);

    if (!aptosResponse.ok) {
        throw new Error(`Aptos fullnode responded with status ${aptosResponse.status}. Body: ${responseText}`);
    }
    if (!responseText) {
        throw new Error("Received empty response body from fullnode.");
    }
    
    const userStakeResult = JSON.parse(responseText);

    let stakeData = { active: 0, inactive: 0, pendingInactive: 0 };
    if (Array.isArray(userStakeResult) && userStakeResult.length >= 3) {
      stakeData = {
        active: Number(BigInt(userStakeResult[0])) / 100_000_000,
        inactive: Number(BigInt(userStakeResult[1])) / 100_000_000,
        pendingInactive: Number(BigInt(userStakeResult[2])) / 100_000_000,
      };
    }
    
    return new Response(JSON.stringify(stakeData), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=10, stale-while-revalidate=30'
      },
    });

  } catch (error) {
    console.error('[Debug Fetch] API Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch or parse stake data from Aptos network' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}