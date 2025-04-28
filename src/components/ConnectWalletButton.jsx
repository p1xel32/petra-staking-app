import { useState } from 'react';

function ConnectWalletButton({ onConnect }) {
  const [walletAddress, setWalletAddress] = useState(null);

  const connectWallet = async () => {
    if (window.aptos) {
      try {
        const account = await window.aptos.connect();
        setWalletAddress(account.address);
        onConnect(account.address);
      } catch (error) {
        console.error("Failed to connect wallet:", error);
      }
    } else {
      alert("Please install the Petra Wallet extension!");
    }
  };

  return (
    <button
      onClick={connectWallet}
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-6"
    >
      {walletAddress ? `Connected: ${walletAddress.slice(0, 6)}...` : "Connect Wallet"}
    </button>
  );
}

export default ConnectWalletButton;
