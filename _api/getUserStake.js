// File: _api/getUserStake.js

const APTOS_FULLNODE_URL = "https://fullnode.mainnet.aptoslabs.com/v1";

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userAccountAddress = url.searchParams.get('account');
    const poolAddress = url.searchParams.get('pool');

    if (!userAccountAddress || !poolAddress) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Missing required query parameters' }));
    }

    const [stakeAmounts, poolResource] = await Promise.all([
      // 1. Get user's stake amounts (correct)
      fetch(`${APTOS_FULLNODE_URL}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: '0x1::delegation_pool::get_stake',
          type_arguments: [],
          arguments: [poolAddress, userAccountAddress],
        }),
      }).then(r => r.ok ? r.json() : Promise.reject('Failed to get stake amounts')),

      // 2. ✅ FINAL STRATEGY: Get the entire StakePool resource from the VALIDATOR's account
      // to find the pool's global unlock date.
      fetch(`${APTOS_FULLNODE_URL}/accounts/${poolAddress}/resource/0x1::stake::StakePool`)
        .then(r => r.ok ? r.json() : null),
    ]);
    
    const OCTAS = 100_000_000;
    
    // ✅ FINAL STRATEGY: Use the pool's global `locked_until_secs` as the best available date.
    const lockupExpirationSecs = poolResource?.data?.locked_until_secs
      ? Number(poolResource.data.locked_until_secs)
      : null;
        
    const responseData = {
      active: Number(BigInt(stakeAmounts[0])) / OCTAS,
      inactive: Number(BigInt(stakeAmounts[1])) / OCTAS,
      pendingInactive: {
        amountApt: Number(BigInt(stakeAmounts[2])) / OCTAS,
        // We no longer need lockup_began_timestamp, as we can't calculate progress.
        lockup_expiration_timestamp: lockupExpirationSecs ? (lockupExpirationSecs * 1000000).toString() : null,
        lockup_began_timestamp: null, 
      },
    };

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(responseData));

  } catch (error) {
    console.error('[API /api/getUserStake] Error:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Failed to fetch or parse stake data from Aptos network' }));
  }
}