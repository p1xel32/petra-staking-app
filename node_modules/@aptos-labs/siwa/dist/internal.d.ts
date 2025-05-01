/**
 * @internal
 *
 * Type with a numeric `length` and numerically indexed elements of a generic type `T`.
 *
 * For example, `Array<T>` and `Uint8Array`.
 *
 * @group Internal
 */
export interface Indexed<T> {
    length: number;
    [index: number]: T;
}
/**
 * @internal
 *
 * Efficiently compare {@link Indexed} arrays (e.g. `Array` and `Uint8Array`).
 *
 * @param a An array.
 * @param b Another array.
 * @param excludedValues Values to exclude from `a` the comparison.
 *
 * @return `true` if the arrays have the same length and elements, `false` otherwise.
 *
 * @group Internal
 */
export declare function arraysEqual<T>(a: Indexed<T>, b: Indexed<T>, excludedValues?: T[]): boolean;
/**
 * @internal
 *
 * Encode a `Uint8Array` to a base64 string.
 *
 * @param bytes A `Uint8Array` to encode.
 *
 * @returns A base64 encoded string.
 *
 * @group Internal
 */
export declare function encodeBase64(bytes: Uint8Array): string;
//# sourceMappingURL=internal.d.ts.map