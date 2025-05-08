# Aptos Staking App (aptcore.one)

[![Vercel Deployment](https://img.shields.io/github/deployments/p1xel32/petra-staking-app/production?label=Vercel&logo=vercel&style=flat-square)](https://petra-staking-app.vercel.app/)
[![GitHub License](https://img.shields.io/github/license/p1xel32/petra-staking-app?style=flat-square)](LICENSE) A simple, clean, and modern web interface for staking APT tokens on the Aptos blockchain. This application provides a user-friendly way to delegate your APT to a specific validator's delegation pool and manage your stake.

**Live Application:** [**https://aptcore.one/**](https://aptcore.one/)

*(This application is associated with the aptcore.one initiative/validator, providing a dedicated interface for its delegators. Replace/remove this line if not applicable).*

Built with React, Vite, Tailwind CSS, `@aptos-labs/ts-sdk`, and `@aptos-labs/wallet-adapter-react`.

## ✨ Features

* **Connect Wallet:** Easily connect popular Aptos wallets like Petra, Martian, Pontem, etc. (using `@aptos-labs/wallet-adapter-react` auto-detection).
* **Validator Info:** View key details about the target validator pool:
    * Total delegated APT
    * Operator commission percentage
    * Estimated Gross and Net Staking APR (calculated from on-chain data)
    * Pool lockup end date and remaining time
* **User Stake Details:** See your personal stake breakdown within the pool:
    * Active stake (earning rewards)
    * Pending inactive stake (currently unstaking)
    * Inactive stake (withdrawable)
* **Staking Actions:**
    * **Stake:** Delegate your APT tokens to the pool (minimum 11 APT).
    * **Unstake:** Initiate the process to unlock your staked APT.
    * **Withdraw:** Withdraw your unlocked (inactive) APT back to your wallet.
* **Auto-Refresh:** Data automatically updates after successful transactions.
* **Modern UI:** Clean, responsive interface with a dark theme.

## 🚀 Getting Started Locally

To run this application on your local machine:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/p1xel32/petra-staking-app.git
    cd petra-staking-app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    The application should now be running on `http://localhost:5173` (or another port specified by Vite).

## 🔧 Configuration: Using with a Different Validator

This application is currently configured to interact with a specific validator pool. To use it with a different validator's delegation pool:

1.  **Find the Validator's Pool Address:** Locate the `owner` address (often referred to as the pool address or staking pool address) of the desired validator on an Aptos explorer like AptoScan.
2.  **Update Constants:** Open the following files and replace the existing `VALIDATOR_POOL_ADDRESS` constant with the new address:
    * `src/components/ValidatorInfo.jsx`
    * `src/components/StakeUnstakeControls.jsx`

    ```javascript
    // Example: Change this line in both files
    const VALIDATOR_POOL_ADDRESS = '0xNEW_VALIDATOR_POOL_ADDRESS_HERE';
    ```
3.  **Restart** your development server or **rebuild/redeploy** the application.

## ⚠️ Disclaimer

Staking involves risks, including potential smart contract vulnerabilities (although the core Aptos contracts are audited) and the lock-up period during which your funds are not immediately accessible after unstaking. This application provides an interface to interact with the Aptos blockchain; you are responsible for your own actions and funds. Always do your own research (DYOR).

## 📜 License

MIT License
---

*Keywords: Aptos, Aptos Network, Staking, APT Staking, Delegate APT, Petra Wallet, Martian Wallet, Pontem Wallet, Aptos Wallet Adapter, Delegation Pool, Validator, Blockchain, Crypto, Web3, React, Vite, Tailwind CSS, aptcore.one*
