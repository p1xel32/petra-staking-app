import { UserResponse } from '@aptos-labs/wallet-standard';
export declare const defaultAuthenticationFunction = "0x1::solana_derivable_account::authenticate";
/**
 * Adapt SolanaWalletAdapter response into a UserResponse.
 * `WalletError` will be converted into a rejection.
 */
export declare function wrapSolanaUserResponse<TResponse>(promise: Promise<TResponse>): Promise<UserResponse<TResponse>>;
//# sourceMappingURL=shared.d.ts.map