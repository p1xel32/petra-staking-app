import { AuthenticationKey, Deserializer, Serializable, Serializer } from "@aptos-labs/ts-sdk";
/**
 * The domain separator used to calculate the DAA account address.
 */
export declare const ADDRESS_DOMAIN_SEPARATOR = 5;
/**
 * @param functionInfo - The authentication function
 * @param identity - The account identity. Typically it is the wallet public key or account address
 * @param domain - The dapp domain
 * @returns The account address authentication key
 */
export declare function computeDerivableAuthenticationKey(functionInfo: string, identity: string, domain: string): AuthenticationKey;
/**
 * The derivable abstract public key of the DAA account.
 *
 * @param identity - The identity of the account. Typically it is the wallet public key or account address
 * @param domain - The dapp domain
 */
export declare class DerivableAbstractPublicKey extends Serializable {
    identity: string;
    domain: string;
    constructor(identity: string, domain: string);
    serialize(serializer: Serializer): void;
    static deserialize(deserializer: Deserializer): DerivableAbstractPublicKey;
}
//# sourceMappingURL=abstraction.d.ts.map