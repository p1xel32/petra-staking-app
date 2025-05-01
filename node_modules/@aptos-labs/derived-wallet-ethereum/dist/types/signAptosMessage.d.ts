import { StructuredMessageInput } from '@aptos-labs/derived-wallet-base';
import { AptosSignMessageOutput, UserResponse } from "@aptos-labs/wallet-standard";
import { BrowserProvider, Eip1193Provider } from 'ethers';
import { EthereumAddress } from './shared';
export interface StructuredMessageInputWithChainId extends StructuredMessageInput {
    chainId: number;
}
export interface SignAptosMessageWithEthereumInput {
    eip1193Provider: Eip1193Provider | BrowserProvider;
    ethereumAddress?: EthereumAddress;
    authenticationFunction: string;
    messageInput: StructuredMessageInputWithChainId;
}
export declare function signAptosMessageWithEthereum(input: SignAptosMessageWithEthereumInput): Promise<UserResponse<AptosSignMessageOutput>>;
//# sourceMappingURL=signAptosMessage.d.ts.map