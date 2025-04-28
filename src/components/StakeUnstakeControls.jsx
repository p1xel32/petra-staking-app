import { useState } from 'react';

function StakeUnstakeControls({ account }) {
  const [amount, setAmount] = useState('');
  const validatorAddress = '0xf747e3a6282cc0dee1c89239c529b039c64fe48e88b50e5cedd40e9c094800bb';

  const stake = async () => {
    if (!window.aptos) {
      alert('Petra wallet not installed');
      return;
    }
    try {
      const payload = {
        type: "entry_function_payload",
        function: "0x1::stake::delegate_stake",
        type_arguments: [],
        arguments: [
          validatorAddress,
          (parseFloat(amount) * 1e8).toString(), // перевод APT в окты
        ],
      };
      const tx = await window.aptos.signAndSubmitTransaction(payload);
      console.log('Stake Transaction:', tx);
      alert('Stake submitted!');
    } catch (error) {
      console.error('Stake error:', error);
    }
  };

  const unstake = async () => {
    if (!window.aptos) {
      alert('Petra wallet not installed');
      return;
    }
    try {
      const payload = {
        type: "entry_function_payload",
        function: "0x1::stake::unlock_stake",
        type_arguments: [],
        arguments: [],
      };
      const tx = await window.aptos.signAndSubmitTransaction(payload);
      console.log('Unstake Transaction:', tx);
      alert('Unstake submitted!');
    } catch (error) {
      console.error('Unstake error:', error);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <input
        type="number"
        placeholder="Amount APT"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="p-2 rounded bg-gray-800 text-white border border-gray-700"
      />
      <button
        onClick={stake}
        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
      >
        Stake
      </button>
      <button
        onClick={unstake}
        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
      >
        Unstake
      </button>
    </div>
  );
}

export default StakeUnstakeControls;
