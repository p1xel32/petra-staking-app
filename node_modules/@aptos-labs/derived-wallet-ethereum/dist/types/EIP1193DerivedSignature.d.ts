import { Deserializer, HexInput, Serializer, Signature } from '@aptos-labs/ts-sdk';
export declare class EIP1193DerivedSignature extends Signature {
    static readonly LENGTH = 65;
    private readonly _siweSignature;
    readonly chainId: number;
    readonly issuedAt: Date;
    constructor(siweSignature: HexInput, chainId: number, issuedAt: Date);
    get siweSignature(): string;
    serialize(serializer: Serializer): void;
    static deserialize(deserializer: Deserializer): EIP1193DerivedSignature;
}
//# sourceMappingURL=EIP1193DerivedSignature.d.ts.map