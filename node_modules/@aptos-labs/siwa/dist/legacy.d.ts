import { type PublicKey, type Signature } from "@aptos-labs/ts-sdk";
import type { AptosSignInInput, AptosSignInRequiredFields } from "@aptos-labs/wallet-standard";
import type { VerificationError } from "./types.js";
export type VerificationFullMessageError = "invalid_full_message";
type LegacyVerificationError = VerificationError | VerificationFullMessageError;
export type LegacyVerificationResult<T> = {
    valid: true;
    data: T;
} | {
    valid: false;
    errors: LegacyVerificationError[];
};
export declare const createLegacySignInMessage: (input: AptosSignInInput & AptosSignInRequiredFields) => string;
export declare const verifyLegacySignIn: (input: AptosSignInInput & AptosSignInRequiredFields, output: {
    publicKey: PublicKey;
    signature: Signature;
    message: string;
}) => LegacyVerificationResult<AptosSignInInput & AptosSignInRequiredFields>;
export {};
//# sourceMappingURL=legacy.d.ts.map