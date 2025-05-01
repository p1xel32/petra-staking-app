import React, { useEffect, useState } from 'react';
import { Aptos, Network } from '@aptos-labs/ts-sdk';

const client = new Aptos({
  network: Network.MAINNET,
});

const VALIDATOR_POOL_ADDRESS = '0xf747e3a6282cc0dee1c89239c529b039c64fe48e88b50e5cedd40e9c094800bb';

function ValidatorInfo() {
  const [info, setInfo] = useState(null);
  const [apr, setApr] = useState(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const resources = await client.getAccountResources({ accountAddress: VALIDATOR_POOL_ADDRESS });
        const pool = resources.find(r => r.type === '0x1::stake::StakePool');
        const delegation = resources.find(r => r.type.startsWith('0x1::delegation_pool::DelegationPool'));

        if (!pool || !delegation) throw new Error('StakePool or DelegationPool not found');

        const activeStake = Number(pool.data.active.value);
        const commission = Number(delegation.data.operator_commission_percentage) / 100;

        const totalCoins = Number(delegation.data.active_shares.total_coins);
        const totalShares = Number(delegation.data.active_shares.total_shares);
        const aprValue = (activeStake / totalShares) * 100;

        setInfo({
          poolAddress: VALIDATOR_POOL_ADDRESS,
          delegated: totalCoins / 1e8,
          commission,
        });
        setApr(aprValue.toFixed(2));
      } catch (err) {
        console.error('Error fetching validator info:', err);
      }
    };

    fetchInfo();
  }, []);

  if (!info) return <p>Loading validator info...</p>;

  return (
    <div className="mb-4 text-center">
      <p><strong>Stake Pool Address:</strong> {info.poolAddress}</p>
      <p><strong>Delegated Voting Power:</strong> {info.delegated.toLocaleString()} APT</p>
      <p><strong>Commission Percentage:</strong> {info.commission} %</p>
      <p><strong>APR:</strong> {apr ?? 'NaN'}%</p>
    </div>
  );
}

export default ValidatorInfo;
