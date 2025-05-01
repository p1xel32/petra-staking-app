import { AccountAuthenticator, AccountInfo, AdapterWallet, AnyRawTransaction, AptosSignAndSubmitTransactionOutput, InputTransactionData, NetworkInfo, AptosSignMessageInput, AptosSignMessageOutput, AdapterNotDetectedWallet, Network, AptosChangeNetworkOutput, PendingTransactionResponse, InputSubmitTransactionData, AptosSignInInput, AptosSignInOutput } from "@aptos-labs/wallet-adapter-core";
import { OriginWalletDetails } from "./WalletProvider";
export interface WalletContextState {
    connected: boolean;
    isLoading: boolean;
    account: AccountInfo | null;
    network: NetworkInfo | null;
    connect(walletName: string): void;
    signIn(args: {
        walletName: string;
        input: AptosSignInInput;
    }): Promise<AptosSignInOutput | void>;
    signAndSubmitTransaction(transaction: InputTransactionData): Promise<AptosSignAndSubmitTransactionOutput>;
    signTransaction(args: {
        transactionOrPayload: AnyRawTransaction | InputTransactionData;
        asFeePayer?: boolean;
    }): Promise<{
        authenticator: AccountAuthenticator;
        rawTransaction: Uint8Array;
    }>;
    signMessage(message: AptosSignMessageInput): Promise<AptosSignMessageOutput>;
    signMessageAndVerify(message: AptosSignMessageInput): Promise<boolean>;
    disconnect(): void;
    changeNetwork(network: Network): Promise<AptosChangeNetworkOutput>;
    submitTransaction(transaction: InputSubmitTransactionData): Promise<PendingTransactionResponse>;
    getOriginWalletDetails(wallet: AdapterWallet): Promise<OriginWalletDetails | undefined>;
    isSolanaDerivedWallet(wallet: AdapterWallet): boolean;
    isEIP1193DerivedWallet(wallet: AdapterWallet): boolean;
    wallet: AdapterWallet | null;
    wallets: ReadonlyArray<AdapterWallet>;
    notDetectedWallets: ReadonlyArray<AdapterNotDetectedWallet>;
}
export declare const WalletContext: import("react").Context<WalletContextState>;
export declare function useWallet(): WalletContextState;
//# sourceMappingURL=useWallet.d.ts.map