import { AccountAuthenticator, AnyRawTransaction } from '@aptos-labs/ts-sdk';
import { AptosSignMessageOutput, UserResponse } from '@aptos-labs/wallet-standard';
import { StandardWalletAdapter as SolanaWalletAdapter } from "@solana/wallet-standard-wallet-adapter-base";
import { PublicKey as SolanaPublicKey } from '@solana/web3.js';
import { StructuredMessageInputWithChainId } from './signAptosMessage';
import { SolanaDerivedPublicKey } from './SolanaDerivedPublicKey';
export type SolanaWalletAdapterWithAptosFeatures = SolanaWalletAdapter & {
    getAptosPublicKey: (solanaPublicKey: SolanaPublicKey) => SolanaDerivedPublicKey;
    signAptosTransaction: (rawTransaction: AnyRawTransaction) => Promise<UserResponse<AccountAuthenticator>>;
    signAptosMessage: (input: StructuredMessageInputWithChainId) => Promise<UserResponse<AptosSignMessageOutput>>;
};
/**
 * Utility function for extending a SolanaWalletAdapter with Aptos features.
 * @param solanaWallet the source wallet adapter
 * @param authenticationFunction authentication function required for DAA
 *
 * @example
 * ```typescript
 * const extendedWallet = extendSolanaWallet(solanaWallet, authenticationFunction);
 *
 * const solanaSignature = await extendedWallet.signTransaction(solanaTransaction);
 * const aptosSignature = await extendedWallet.signAptosTransaction(aptosRawTransaction);
 * ```
 */
export declare function extendSolanaWallet(solanaWallet: SolanaWalletAdapter, authenticationFunction?: string): SolanaWalletAdapterWithAptosFeatures;
//# sourceMappingURL=extendSolanaWallet.d.ts.map