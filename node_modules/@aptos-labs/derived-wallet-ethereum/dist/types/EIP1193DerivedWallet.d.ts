import { AccountAuthenticator, AnyRawTransaction, Network } from '@aptos-labs/ts-sdk';
import { AccountInfo, AptosChangeNetworkOutput, AptosConnectOutput, AptosFeatures, AptosSignMessageInput, AptosSignMessageOutput, AptosWallet, NetworkInfo, UserResponse, WalletIcon } from "@aptos-labs/wallet-standard";
import { BrowserProvider } from 'ethers';
import type { EIP1193Provider, EIP6963ProviderDetail } from 'mipd';
export interface EIP1193DerivedWalletOptions {
    authenticationFunction?: string;
    defaultNetwork?: Network;
}
export declare class EIP1193DerivedWallet implements AptosWallet {
    readonly eip1193Provider: EIP1193Provider;
    readonly eip1193Ethers: BrowserProvider;
    readonly domain: string;
    readonly authenticationFunction: string;
    defaultNetwork: Network;
    readonly version = "1.0.0";
    readonly name: string;
    readonly icon: WalletIcon;
    readonly url: string;
    readonly accounts: never[];
    readonly chains: readonly ["aptos:devnet", "aptos:testnet", "aptos:localnet", "aptos:mainnet"];
    constructor(providerDetail: EIP6963ProviderDetail, options?: EIP1193DerivedWalletOptions);
    readonly features: AptosFeatures;
    private derivePublicKey;
    connect(): Promise<UserResponse<AptosConnectOutput>>;
    disconnect(): Promise<void>;
    getActiveAccount(): Promise<AccountInfo>;
    private onAccountsChangedListeners;
    onActiveAccountChange(callback: (newAccount: AccountInfo) => void): void;
    private onActiveNetworkChangeListeners;
    getActiveNetwork(): Promise<NetworkInfo>;
    changeNetwork(newNetwork: NetworkInfo): Promise<UserResponse<AptosChangeNetworkOutput>>;
    onActiveNetworkChange(callback: (newNetwork: NetworkInfo) => void): void;
    signMessage(input: AptosSignMessageInput): Promise<UserResponse<AptosSignMessageOutput>>;
    signTransaction(rawTransaction: AnyRawTransaction, _asFeePayer?: boolean): Promise<UserResponse<AccountAuthenticator>>;
}
//# sourceMappingURL=EIP1193DerivedWallet.d.ts.map