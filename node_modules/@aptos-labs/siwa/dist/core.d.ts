import type { PublicKey, Signature } from "@aptos-labs/ts-sdk";
import type { AptosSignInInput, AptosSignInRequiredFields } from "@aptos-labs/wallet-standard";
import type { VerificationResult } from "./types.js";
/**
 * Create a SignIn message text from the input following the ABNF format defined in the Sign in with Aptos
 * specifications.
 *
 * @param input The input to create the SignIn message text from.
 *
 * @returns The SignIn message text.
 */
export declare function createSignInMessageText(input: AptosSignInInput & AptosSignInRequiredFields): string;
export declare function parseSignInMessageText(text: string): VerificationResult<AptosSignInInput & AptosSignInRequiredFields>;
/**
 * Verifies an input SignIn message against expected fields.
 *
 * @param input The input to verify the message against.
 * @param expected The expected message to verify against the input.
 *
 * @returns The verification result.
 */
export declare function verifySignInMessage(input: AptosSignInInput, expected: string, options?: {
    excludedResources?: string[];
}): VerificationResult<AptosSignInInput & AptosSignInRequiredFields>;
/**
 * Verifies outputs from a `signIn` method response against input fields.
 *
 * @param input The input to verify the output against.
 * @param output The output to verify against the input.
 *
 * @returns The verification result.
 */
export declare function verifySignIn(input: AptosSignInInput & {
    domain: string;
}, output: {
    publicKey: PublicKey;
    signature: Signature;
    message: string;
}, options?: {
    excludedResources?: string[];
}): VerificationResult<AptosSignInInput & AptosSignInRequiredFields>;
/**
 * Generate a signing message using the Sign in with Aptos signing algorithm.
 * sha3_256( sha3_256(b"SIGN_IN_WITH_APTOS::" ) || <message> )
 *
 * @param message The SIWA message to sign.
 *
 * @returns The signing message.
 */
export declare function generateSignInSigningMessage(message: string): Uint8Array;
//# sourceMappingURL=core.d.ts.map