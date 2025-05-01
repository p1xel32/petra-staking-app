import { AccountAuthenticator, AnyRawTransaction } from '@aptos-labs/ts-sdk';
import { StandardWalletAdapter as SolanaWalletAdapter } from "@solana/wallet-standard-wallet-adapter-base";
/**
 * A first byte of the signature that indicates the "message type", this is defined in the
 * authentication function on chain, and lets us identify the type of the message and to make
 * changes in the future if needed.
 */
export declare const SIGNATURE_TYPE = 0;
export interface SignAptosTransactionWithSolanaInput {
    solanaWallet: SolanaWalletAdapter;
    authenticationFunction: string;
    rawTransaction: AnyRawTransaction;
    domain: string;
}
export declare function signAptosTransactionWithSolana(input: SignAptosTransactionWithSolanaInput): Promise<import("@aptos-labs/wallet-standard").UserResponse<AccountAuthenticator>>;
//# sourceMappingURL=signAptosTransaction.d.ts.map