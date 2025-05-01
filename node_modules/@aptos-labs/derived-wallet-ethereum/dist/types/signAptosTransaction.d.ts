import { AccountAuthenticator, AnyRawTransaction } from '@aptos-labs/ts-sdk';
import { UserResponse } from "@aptos-labs/wallet-standard";
import { BrowserProvider, Eip1193Provider } from 'ethers';
import { EthereumAddress } from './shared';
export interface SignAptosTransactionWithEthereumInput {
    eip1193Provider: Eip1193Provider | BrowserProvider;
    ethereumAddress?: EthereumAddress;
    authenticationFunction: string;
    rawTransaction: AnyRawTransaction;
}
export declare function signAptosTransactionWithEthereum(input: SignAptosTransactionWithEthereumInput): Promise<UserResponse<AccountAuthenticator>>;
//# sourceMappingURL=signAptosTransaction.d.ts.map