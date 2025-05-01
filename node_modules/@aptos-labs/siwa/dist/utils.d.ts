import { type PublicKey, SigningScheme, type HexInput, type Signature } from "@aptos-labs/ts-sdk";
/**
 * Check if the scheme is a valid public key scheme
 *
 * @param scheme The scheme to check.
 *
 * @returns True if the scheme is a valid public key scheme, false otherwise.
 */
export declare const isValidPublicKeyScheme: (scheme: string) => scheme is "ed25519" | "multi_ed25519" | "single_key" | "multi_key";
/**
 * Get the signing scheme of a public key.
 *
 * @param value The public key or signing scheme to get the scheme of.
 *
 * @returns The signing scheme of the public key.
 */
export declare function getSignInPublicKeyScheme(value: SigningScheme | PublicKey): string;
/**
 * Deserialize a public key from a hex string.
 *
 * @param scheme The signing scheme of the public key.
 * @param value The hex string to deserialize.
 *
 * @returns The deserialized public key.
 */
export declare function deserializeSignInPublicKey(scheme: SigningScheme | "ed25519" | "multi_ed25519" | "single_key" | "multi_key", value: HexInput): PublicKey;
export declare function deserializeSignInSignature(scheme: SigningScheme | "ed25519" | "multi_ed25519" | "single_key" | "multi_key", value: HexInput): Signature;
export declare function generateNonce(): string;
//# sourceMappingURL=utils.d.ts.map