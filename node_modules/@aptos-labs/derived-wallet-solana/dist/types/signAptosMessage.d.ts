import { StructuredMessageInput } from '@aptos-labs/derived-wallet-base';
import { AptosSignMessageOutput } from '@aptos-labs/wallet-standard';
import { StandardWalletAdapter as SolanaWalletAdapter } from "@solana/wallet-standard-wallet-adapter-base";
export interface StructuredMessageInputWithChainId extends StructuredMessageInput {
    chainId?: number;
}
export interface SignAptosMessageWithSolanaInput {
    solanaWallet: SolanaWalletAdapter;
    authenticationFunction: string;
    messageInput: StructuredMessageInputWithChainId;
    domain: string;
}
export declare function signAptosMessageWithSolana(input: SignAptosMessageWithSolanaInput): Promise<import("@aptos-labs/wallet-standard").UserResponse<AptosSignMessageOutput>>;
//# sourceMappingURL=signAptosMessage.d.ts.map