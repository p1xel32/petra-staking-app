import { UserResponse } from '@aptos-labs/wallet-standard';
export type EthereumAddress = `0x${string}`;
/**
 * Adapt EIP1193 response into a UserResponse.
 * `UserRejectedRequestError` will be converted into a rejection.
 */
export declare function wrapEthersUserResponse<TResponse>(promise: Promise<TResponse>): Promise<UserResponse<TResponse>>;
//# sourceMappingURL=shared.d.ts.map