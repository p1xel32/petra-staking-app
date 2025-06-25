// api/getUserStake.js

import { Aptos, Network, AptosConfig } from '@aptos-labs/ts-sdk';

const aptosConfig = new AptosConfig({ network: Network.MAINNET });
const client = new Aptos(aptosConfig);

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

  try {
    const userStakeResult = await client.view({
      payload: {
        function: '0x1::delegation_pool::get_stake',
        functionArguments: [poolAddress, userAccountAddress],
      },
    });

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
    console.error('API Error in /api/getUserStake:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch stake data from Aptos network' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}