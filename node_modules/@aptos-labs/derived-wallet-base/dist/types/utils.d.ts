import { AccountPublicKey } from '@aptos-labs/ts-sdk';
import { AccountInfo } from '@aptos-labs/wallet-standard';
export declare function accountInfoFromPublicKey(publicKey: AccountPublicKey): AccountInfo;
export declare function isNullCallback(callback: Function): boolean;
/**
 * Helper function to fetch Devnet chain id
 */
export declare const fetchDevnetChainId: () => Promise<number>;
//# sourceMappingURL=utils.d.ts.map