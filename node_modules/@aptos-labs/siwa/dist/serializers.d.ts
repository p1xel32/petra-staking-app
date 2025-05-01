import type { AptosSignInOutput } from "@aptos-labs/wallet-standard";
import type { PublicKey, Signature } from "@aptos-labs/ts-sdk";
export declare const SERIALIZATION_VERSION = "1";
export type SerializedAptosSignInOutput = {
    version: typeof SERIALIZATION_VERSION;
    type: string;
    signature: string;
    message: string;
    publicKey: string;
};
export type DeserializedAptosSignInOutput = {
    type: string;
    signature: Signature;
    message: string;
    publicKey: PublicKey;
};
export declare const serializeSignInOutput: (output: Pick<AptosSignInOutput, "type" | "signature" | "plainText" | "account">) => SerializedAptosSignInOutput;
export declare const deserializeSignInOutput: (serialized: SerializedAptosSignInOutput) => DeserializedAptosSignInOutput;
//# sourceMappingURL=serializers.d.ts.map