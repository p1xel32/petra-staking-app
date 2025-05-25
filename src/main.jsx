import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { WalletProvider } from "./walletProvider";
import { HelmetProvider } from 'react-helmet-async';
import 'antd/dist/reset.css';

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <WalletProvider>
        <App />
      </WalletProvider>
    </HelmetProvider>
  </React.StrictMode>
);
