import { useEffect, useState } from 'react';

const VALIDATOR_OWNER = '0xf747e3a6282cc0dee1c89239c529b039c64fe48e88b50e5cedd40e9c094800bb';
const FULLNODE_URL = `https://fullnode.mainnet.aptoslabs.com/v1/accounts/${VALIDATOR_OWNER}/resources`;

function formatApt(value) {
  return (Number(value) / 1e8).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatTimestamp(secs) {
  const date = new Date(Number(secs) * 1000);
  return date.toUTCString().replace('GMT', 'UTC');
}

export default function ValidatorInfo() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    async function fetchValidatorInfo() {
      try {
        const res = await fetch(FULLNODE_URL);
        const data = await res.json();

        const stakePool = data.find((r) => r.type === '0x1::stake::StakePool')?.data;
        const delegationPool = data.find((r) => r.type === '0x1::delegation_pool::DelegationPool')?.data;

        if (!stakePool || !delegationPool) throw new Error('Validator resources not found');

        setInfo({
          operator: stakePool.operator_address,
          totalStake: formatApt(stakePool.active.value),
          commission: (Number(delegationPool.operator_commission_percentage) / 100).toFixed(2),
          lockedUntil: formatTimestamp(stakePool.locked_until_secs)
        });
      } catch (err) {
        console.error('Failed to load validator info:', err);
        setInfo(null);
      }
    }

    fetchValidatorInfo();
  }, []);

  if (!info) return <p>Loading validator info...</p>;

  return (
    <div className="text-center mb-6">
      <h2 className="text-2xl font-bold mb-2">Validator Info</h2>
      <p><strong>Operator:</strong> {info.operator}</p>
      <p><strong>Total Stake:</strong> {info.totalStake} APT</p>
      <p><strong>Commission:</strong> {info.commission} %</p>
      <p><strong>Lockup Ends:</strong> {info.lockedUntil}</p>
    </div>
  );
}
