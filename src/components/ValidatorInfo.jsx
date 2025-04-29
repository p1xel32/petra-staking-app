import { useEffect, useState } from 'react';

function ValidatorInfo() {
  const [validatorData, setValidatorData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchValidatorInfo() {
      try {
        const query = `
          query {
            validator_performances(order_by: {epoch: desc}, limit: 1000) {
              validator_address
              voting_power
              commission_percentage
            }
          }
        `;

        const response = await fetch('/api/proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        });
        

        const result = await response.json();
        console.log('GraphQL result:', result);
        if (result.errors) {
          console.error('GraphQL error message:', result.errors[0].message);
        }
        
        const validator = result?.data?.validator_performances.find(
          (v) =>
            v.validator_address ===
            '0xf747e3a6282cc0dee1c89239c529b039c64fe48e88b50e5cedd40e9c094800bb'
        );

        setValidatorData(validator);
      } catch (error) {
        console.error('Error fetching validator info:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchValidatorInfo();
  }, []);

  if (loading) {
    return <p className="text-center text-gray-400">Loading validator info...</p>;
  }

  if (!validatorData) {
    return (
      <p className="text-center text-red-400">
        Validator info not available.
      </p>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8 text-center w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Validator Information</h2>
      <div className="space-y-2">
        <p>
          <strong>Validator Address:</strong> {validatorData.validator_address}
        </p>
        <p>
          <strong>Voting Power:</strong>{' '}
          {(parseInt(validatorData.voting_power) / 1e8).toFixed(2)} APT
        </p>
        <p>
          <strong>Commission Percentage:</strong>{' '}
          {validatorData.commission_percentage} %
        </p>
      </div>
    </div>
  );
}

export default ValidatorInfo;
