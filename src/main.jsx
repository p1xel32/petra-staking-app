import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // Your main Tailwind CSS file
import { WalletProvider } from "./walletProvider";

// CSS for Ant Design (used by WalletSelector from @aptos-labs/wallet-adapter-ant-design)
import 'antd/dist/reset.css'; // or 'antd/dist/antd.min.css' if you prefer full styles
// CSS for the Aptos Wallet Adapter Ant Design UI components
import '@aptos-labs/wallet-adapter-ant-design/dist/index.css';

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WalletProvider>
      {/*
        WalletModalProvider was removed as it's not exported from the main adapter package,
        and the @aptos-labs/wallet-adapter-ant-design's WalletSelector
        typically handles its own modal presentation.
      */}
      <App />
    </WalletProvider>
  </React.StrictMode>
);
