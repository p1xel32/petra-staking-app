import { AccountPublicKey, AptosConfig, AuthenticationKey, Deserializer, HexInput, Serializer, Signature, VerifySignatureArgs } from '@aptos-labs/ts-sdk';
import { PublicKey as SolanaPublicKey } from '@solana/web3.js';
export interface SolanaDerivedPublicKeyParams {
    domain: string;
    solanaPublicKey: SolanaPublicKey;
    authenticationFunction: string;
}
export declare class SolanaDerivedPublicKey extends AccountPublicKey {
    readonly domain: string;
    readonly solanaPublicKey: SolanaPublicKey;
    readonly authenticationFunction: string;
    readonly _authKey: AuthenticationKey;
    constructor(params: SolanaDerivedPublicKeyParams);
    authKey(): AuthenticationKey;
    verifySignature({ message, signature }: VerifySignatureArgs): boolean;
    verifySignatureAsync(args: {
        aptosConfig: AptosConfig;
        message: HexInput;
        signature: Signature;
    }): Promise<boolean>;
    serialize(serializer: Serializer): void;
    static deserialize(deserializer: Deserializer): SolanaDerivedPublicKey;
}
//# sourceMappingURL=SolanaDerivedPublicKey.d.ts.map