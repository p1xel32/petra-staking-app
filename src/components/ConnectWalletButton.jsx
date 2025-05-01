import React, { useEffect, useRef } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

/**
 * A button component that specifically attempts to connect to Petra Wallet,
 * ignoring other available wallets. It also handles disconnection and
 * correctly displays the truncated address upon connection.
 *
 * Props:
 * onConnect: (address: string | null) => void; - Callback function that receives
 * the connected account address (string) or null on disconnect/error.
 */
export default function ConnectWalletButton({ onConnect }) {
  // Destructure necessary properties from the useWallet hook
  const {
    account,      // Information about the connected account (address, publicKey)
    connected,    // Boolean indicating if a wallet is currently connected
    connect,      // Function to initiate connection to a specific wallet by name
    disconnect,   // Function to disconnect the currently connected wallet
    wallet,       // Object representing the currently connected wallet instance (null if not connected)
    wallets,      // Array of all detected wallet adapter plugins/instances
    connecting,   // Boolean indicating if a connection attempt is in progress
    disconnecting,// Boolean indicating if a disconnection attempt is in progress
  } = useWallet();

  // Ref to track the previous connection state helps reliably trigger onConnect(null) only on actual disconnects
  const prevConnected = useRef(connected);

  // --- Connection Logic (Targets ONLY Petra Wallet) ---
  const handleConnect = async () => {
    // Prevent connection attempt if already connecting or connected
    if (connecting || connected) return;

    console.log("handleConnect triggered (Attempting Petra Only).");

    // Find Petra Wallet specifically within the list of detected wallets.
    // Use the exact name reported in the logs ('Petra')
    const petraWallet = wallets.find(w => w.name === 'Petra');

    // Check if Petra Wallet was found in the list
    if (petraWallet) {
      console.log(`Found Petra Wallet. Attempting to connect via its adapter...`);
      try {
        // Initiate connection *specifically* with Petra using its name
        await connect(petraWallet.name);
        // Log uses the name we connected with for clarity
        console.log(`await connect('${petraWallet.name}') promise resolved.`);
        // Note: Successful connection state change is handled by the useEffect below
      } catch (err) {
        // Log any errors during the connection attempt
        console.error(`❌ Connect failed for ${petraWallet.name}:`, err);
        // Optionally, inform the user via UI/alert
        // alert(`Failed to connect Petra Wallet: ${err.message || err}`);
      }
    } else {
      // Petra Wallet adapter was not found among the detected wallets
      console.error("Petra Wallet not found among available wallets. Cannot connect via this button.");
      if (wallets && wallets.length > 0) {
         console.log("Available wallets detected:", wallets.map(w => w.name));
      } else {
         console.log("No wallets detected at all.");
      }
      // Inform the user
      alert("Petra Wallet not found. Please ensure it is installed and enabled in your browser.");
    }
  };

  // --- Disconnection Logic ---
  const handleDisconnect = async () => {
    // Prevent disconnection attempt if already disconnecting or not connected
    if (disconnecting || !connected) return;

    console.log("handleDisconnect triggered.");
    try {
      await disconnect();
      console.log("Wallet disconnected successfully via adapter.");
      // Note: State change triggering onConnect(null) is handled by the useEffect below
    } catch (err) {
      console.error("❌ Disconnect failed:", err);
    }
  };

  // --- Effect to React to Wallet State Changes ---
  // This effect runs after renders when `connected` or `account` changes.
  // It calls the `onConnect` prop passed from the parent component.
  useEffect(() => {
    // Case 1: Wallet is connected and has account info
    if (connected && account?.address) {
      // Only call onConnect if we just transitioned to connected state,
      // prevents potentially redundant calls if account info changed for other reasons.
      if (!prevConnected.current) {
         // Log the address string for clarity
         console.log("✅ Wallet connected. Account:", account.address.toString());
         // Pass the STRING representation of the address to the parent component
         onConnect(account.address.toString());
      }
    }
    // Case 2: Wallet transitioned from connected (true) to disconnected (false)
    else if (prevConnected.current && !connected) {
      console.log("🔌 Wallet disconnected.");
      onConnect(null); // Notify parent of disconnection
    }

    // Update the ref *after* all checks to store the current state for the next run
    if (prevConnected.current !== connected) {
       prevConnected.current = connected;
    }
  // Dependencies: This effect should re-run if connection status, account info, or the callback changes.
  }, [connected, account, onConnect]);


  // --- Button Rendering Logic ---
  const buttonAction = connected ? handleDisconnect : handleConnect;
  const isButtonDisabled = connecting || disconnecting;

  // Determine the text displayed on the button based on the current state
  let buttonText = "Connect Petra Wallet"; // Default text for this specific button
  if (connecting) {
    buttonText = "Connecting...";
  } else if (disconnecting) {
    // Optional: Show disconnecting state clearly on the button
    buttonText = "Disconnecting...";
  } else if (connected && account?.address) {
    // *** FIX APPLIED HERE ***
    // 1. Convert the address object to a string FIRST
    const addressString = account.address.toString();
    // 2. Use the string for substring operations
    buttonText = `Disconnect (${addressString.substring(0, 6)}...${addressString.substring(addressString.length - 4)})`;
  } else if (connected) {
    // Fallback text if connected but account details are somehow missing
     buttonText = "Disconnect";
  }

  return (
    <button
      onClick={buttonAction}
      disabled={isButtonDisabled}
      // Basic styling - adjust as needed for your UI framework/CSS setup
      className={`px-4 py-2 font-semibold text-white rounded transition duration-150 ease-in-out ${
        isButtonDisabled
          ? 'bg-gray-400 cursor-not-allowed opacity-70' // Style for disabled state
          : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800' // Style for enabled state
      }`}
      aria-label={connected ? 'Disconnect wallet' : 'Connect Petra Wallet'}
    >
      {buttonText}
    </button>
  );
}