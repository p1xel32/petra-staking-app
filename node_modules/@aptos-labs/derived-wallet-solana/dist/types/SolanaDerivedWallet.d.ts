import { AccountAuthenticator, AnyRawTransaction, Network } from '@aptos-labs/ts-sdk';
import { AccountInfo, AptosChangeNetworkOutput, AptosConnectOutput, AptosFeatures, AptosSignMessageInput, AptosSignMessageOutput, AptosWallet, NetworkInfo, UserResponse, WalletIcon } from "@aptos-labs/wallet-standard";
import { StandardWalletAdapter as SolanaWalletAdapter } from "@solana/wallet-standard-wallet-adapter-base";
import { PublicKey as SolanaPublicKey } from '@solana/web3.js';
export type { SolanaPublicKey };
export interface SolanaDomainWalletOptions {
    authenticationFunction?: string;
    defaultNetwork?: Network;
}
export declare class SolanaDerivedWallet implements AptosWallet {
    readonly solanaWallet: SolanaWalletAdapter;
    readonly domain: string;
    readonly authenticationFunction: string;
    defaultNetwork: Network;
    readonly version = "1.0.0";
    readonly name: string;
    readonly icon: WalletIcon;
    readonly url: string;
    readonly accounts: never[];
    readonly chains: readonly ["aptos:devnet", "aptos:testnet", "aptos:localnet", "aptos:mainnet"];
    constructor(solanaWallet: SolanaWalletAdapter, options?: SolanaDomainWalletOptions);
    readonly features: AptosFeatures;
    private derivePublicKey;
    connect(): Promise<UserResponse<AptosConnectOutput>>;
    disconnect(): Promise<void>;
    private getActivePublicKey;
    getActiveAccount(): Promise<AccountInfo>;
    onActiveAccountChange(callback: (newAccount: AccountInfo) => void): void;
    readonly onActiveNetworkChangeListeners: Set<(newNetwork: NetworkInfo) => void>;
    getActiveNetwork(): Promise<NetworkInfo>;
    changeNetwork(newNetwork: NetworkInfo): Promise<UserResponse<AptosChangeNetworkOutput>>;
    onActiveNetworkChange(callback: (newNetwork: NetworkInfo) => void): void;
    signMessage(input: AptosSignMessageInput): Promise<UserResponse<AptosSignMessageOutput>>;
    signTransaction(rawTransaction: AnyRawTransaction, _asFeePayer?: boolean): Promise<UserResponse<AccountAuthenticator>>;
}
//# sourceMappingURL=SolanaDerivedWallet.d.ts.map