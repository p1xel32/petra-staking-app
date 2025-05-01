import { useState } from 'react';
import ConnectWalletButton from './components/ConnectWalletButton';
import ValidatorInfo from './components/ValidatorInfo';
import StakeUnstakeControls from './components/StakeUnstakeControls';
import './index.css';

function App() {
  const [account, setAccount] = useState(null);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-8">Petra Staking App</h1>
      <ConnectWalletButton onConnect={setAccount} />
      {account && (
        <>
          <ValidatorInfo account={account} />
          <StakeUnstakeControls account={account} />
        </>
      )}
    </div>
  );
}

export default App;
