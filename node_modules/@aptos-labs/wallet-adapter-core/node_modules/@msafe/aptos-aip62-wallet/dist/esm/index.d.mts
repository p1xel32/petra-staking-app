import { AnyRawTransaction, InputGenerateTransactionOptions, InputSubmitTransactionData, PendingTransactionResponse, SigningScheme, AccountAddress, Network } from '@aptos-labs/ts-sdk';
import { WalletName, Types, InputTransactionData, Wallet } from '@aptos-labs/wallet-adapter-core';
import { AptosSignTransactionMethod, AptosSignMessageMethod, AptosSignAndSubmitTransactionInput, UserResponse, AptosSignAndSubmitTransactionOutput, AptosWalletAccount, IdentifierArray, AptosWallet, AptosOnAccountChangeInput, AptosOnNetworkChangeInput, AptosFeatures, AptosChangeNetworkMethod, AptosGetAccountMethod, AptosConnectMethod, AptosGetNetworkMethod, AptosDisconnectMethod, AptosOnAccountChangeMethod, AptosOnNetworkChangeMethod } from '@aptos-labs/wallet-standard';

declare const MSafeWalletName: WalletName<"MSafe">;
declare function inMSafeWallet(): boolean;
interface ConnectResponse {
    address: string;
}
interface MSafeWalletServerApi {
    connect: () => Promise<string>;
    signTransaction: AptosSignTransactionMethod;
    signMessage: AptosSignMessageMethod;
    signAndSubmitTransaction: (transaction: Types.TransactionPayload | InputTransactionData | AnyRawTransaction | AptosSignAndSubmitTransactionInput, options?: InputGenerateTransactionOptions) => Promise<UserResponse<AptosSignAndSubmitTransactionOutput>>;
    submitTransaction(transaction: InputSubmitTransactionData): Promise<PendingTransactionResponse>;
}
declare class MSafeWalletAccount implements AptosWalletAccount {
    address: string;
    publicKey: Uint8Array;
    chains: IdentifierArray;
    features: IdentifierArray;
    signingScheme: SigningScheme;
    label?: string;
    icon?: `data:image/svg+xml;base64,${string}` | `data:image/webp;base64,${string}` | `data:image/png;base64,${string}` | `data:image/gif;base64,${string}` | undefined;
    constructor(address: AccountAddress);
}
declare class MSafeWalletServer {
    private iframe;
    private api;
    private bellhop;
    constructor(iframe: HTMLIFrameElement, api: MSafeWalletServerApi);
    connect(): void;
    disconnect(): void;
    changeAccount(address: string): void;
}
interface MSafeConfig {
    network: Network;
    appId?: string;
    appUrl?: string;
}
/**
 * For 3rd party dApp
 */
declare class MSafeWallet implements AptosWallet, Wallet {
    private config;
    readonly url: string;
    readonly isAIP62Standard = true;
    readonly version = "1.0.0";
    readonly name: WalletName<"MSafe">;
    readonly providerName: WalletName<"MSafe">;
    readonly provider: null;
    readonly icon = "data:image/png;base64,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";
    chains: readonly ["aptos:devnet", "aptos:testnet", "aptos:localnet", "aptos:mainnet"];
    accounts: MSafeWalletAccount[];
    onAccountChangeInput?: AptosOnAccountChangeInput;
    onNetworkChangeInput?: AptosOnNetworkChangeInput;
    private bellhop;
    get features(): AptosFeatures;
    constructor(config: MSafeConfig);
    deeplinkProvider?: ((data: {
        url: string;
    }) => string) | undefined;
    openInMobileApp?: (() => void) | undefined;
    changeNetwork?: AptosChangeNetworkMethod | undefined;
    account: AptosGetAccountMethod;
    connect: AptosConnectMethod;
    network: AptosGetNetworkMethod;
    disconnect: AptosDisconnectMethod;
    signMessage: AptosSignMessageMethod;
    signTransaction: AptosSignTransactionMethod;
    submitTransaction(transaction: InputSubmitTransactionData): Promise<PendingTransactionResponse>;
    signAndSubmitTransaction(transaction: Types.TransactionPayload | InputTransactionData | AnyRawTransaction | AptosSignAndSubmitTransactionInput, options?: InputGenerateTransactionOptions): Promise<UserResponse<AptosSignAndSubmitTransactionOutput>>;
    onAccountChange: AptosOnAccountChangeMethod;
    onNetworkChange: AptosOnNetworkChangeMethod;
    private getCurrentAccountInfo;
    private fetch;
}

export { type ConnectResponse, type MSafeConfig, MSafeWallet, MSafeWalletAccount, MSafeWalletName, MSafeWalletServer, type MSafeWalletServerApi, inMSafeWallet };
