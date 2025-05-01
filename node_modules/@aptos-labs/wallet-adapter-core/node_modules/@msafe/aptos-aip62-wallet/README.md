# MSafe Wallet

This guide is used to integrate dapp into MSafe.

## Installation

Installation of the [npm package]:

```bash
npm install @msafe/aptos-aip62-wallet
```

## Make some change to your code

- Add MSafeWallet to AptosWalletAdapterProvider

```js
<AptosWalletAdapterProvider plugins={[new MSafeWallet({
    network: Network.TESTNET,
    appId?: "", // If you have already integrate with MSafe (list in MSafe App Store), you can ask MSafe team to provide the AppId
    appUrl?: "" // If you are not integrate with MSafe, you can provide your app url here, this can let wallet kit redirect to correct MSafe url to your dApp
})]}>
  {appContent}
</AptosWalletAdapterProvider>
```

- Add auto detect and connect code

```js
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { inMSafeWallet, MSafeWalletName } from '@msafe/aptos-wallet'

const wallet = useWallet()

useEffect(() => {
  if (!wallet.connected && inMSafeWallet()) {
    wallet.connect(MSafeWalletName)
  }
}, [wallet.isLoading])
```

- Deploy above change to your app

## Request MSafe team to add your dApp to app store

Please provide below information to MSafe team

- Name
- Logo
- Description
- Tags (e.g. DeFi)
- Mainnet Url
- Mainnet Contracts
- Testnet Url
- Testnet Contracts

Once MSafe verify your dApp integration code, MSafe team will notify you the integration is finished.
User can using your dApp by multi-sig wallet now.
