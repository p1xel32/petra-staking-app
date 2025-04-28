import { useEffect, useState } from 'react';

function ValidatorInfo() {
  const [validatorData, setValidatorData] = useState(null);

  useEffect(() => {
    async function fetchValidatorInfo() {
      try {
        const response = await fetch('https://fullnode.mainnet.aptoslabs.com/v1/validators?limit=100');
        const data = await response.json();
        const validator = data.result.find(
          (v) =>
            v.account_address ===
            '0xf747e3a6282cc0dee1c89239c529b039c64fe48e88b50e5cedd40e9c094800bb'
        );
        setValidatorData(validator);
      } catch (error) {
        console.error('Error fetching validator info:', error);
      }
    }

    fetchValidatorInfo();
  }, []);

  if (!validatorData) {
    return <p>Loading validator info...</p>;
  }

  return (
    <div className="mb-8 text-center">
      <h2 className="text-2xl font-bold mb-2">Validator Information</h2>
      <p><strong>Address:</strong> {validatorData.account_address}</p>
      <p><strong>Voting Power:</strong> {validatorData.voting_power}</p>
      <p><strong>Commission:</strong> {validatorData.commission_percentage}%</p>
    </div>
  );
}

export default ValidatorInfo;
