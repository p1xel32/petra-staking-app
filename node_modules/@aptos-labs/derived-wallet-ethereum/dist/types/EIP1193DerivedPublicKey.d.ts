import { AccountPublicKey, AptosConfig, AuthenticationKey, Deserializer, HexInput, Serializer, Signature, VerifySignatureArgs } from '@aptos-labs/ts-sdk';
import { EthereumAddress } from './shared';
export interface EIP1193DerivedPublicKeyParams {
    domain: string;
    ethereumAddress: EthereumAddress;
    authenticationFunction: string;
}
export declare class EIP1193DerivedPublicKey extends AccountPublicKey {
    readonly domain: string;
    readonly ethereumAddress: EthereumAddress;
    readonly authenticationFunction: string;
    private readonly _authKey;
    constructor({ domain, ethereumAddress, authenticationFunction }: EIP1193DerivedPublicKeyParams);
    authKey(): AuthenticationKey;
    verifySignature({ message, signature }: VerifySignatureArgs): boolean;
    verifySignatureAsync(args: {
        aptosConfig: AptosConfig;
        message: HexInput;
        signature: Signature;
    }): Promise<boolean>;
    serialize(serializer: Serializer): void;
    static deserialize(deserializer: Deserializer): EIP1193DerivedPublicKey;
}
//# sourceMappingURL=EIP1193DerivedPublicKey.d.ts.map