// File: api/getUserStake.js

const APTOS_FULLNODE_URL = "https://fullnode.mainnet.aptoslabs.com/v1";

export default async function handler(request) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const userAccountAddress = url.searchParams.get('account');
  const poolAddress = url.searchParams.get('pool');

  console.log('[Direct Fetch] Incoming request. Parameters received:', {
    account: userAccountAddress,
    pool: poolAddress,
  });

  if (!userAccountAddress || !poolAddress) {
    return new Response(JSON.stringify({ error: 'Missing account or pool address' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const requestBody = {
    function: '0x1::delegation_pool::get_stake',
    type_arguments: [],
    arguments: [poolAddress, userAccountAddress],
  };

  try {
    console.log('[Direct Fetch] Attempting direct fetch to Aptos fullnode...');
    const start = performance.now();
    
    const aptosResponse = await fetch(`${APTOS_FULLNODE_URL}/view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const duration = performance.now() - start;
    console.log(`[Direct Fetch] Got response from fullnode in ${duration.toFixed(2)}ms. Status: ${aptosResponse.status}`);

    if (!aptosResponse.ok) {
      throw new Error(`Aptos fullnode responded with status ${aptosResponse.status}`);
    }

    const userStakeResult = await aptosResponse.json();
    console.log('[Direct Fetch] Successfully received and parsed data.');

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
    console.error('[Direct Fetch] API Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch stake data from Aptos network' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}