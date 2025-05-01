import { StructuredMessage } from '@aptos-labs/derived-wallet-base';
import { AnyRawTransaction, HexInput } from '@aptos-labs/ts-sdk';
import { SolanaSignInInputWithRequiredFields } from '@solana/wallet-standard-util';
import { PublicKey as SolanaPublicKey } from '@solana/web3.js';
export interface CreateSiwsEnvelopeInput {
    solanaPublicKey: SolanaPublicKey;
    signingMessageDigest: HexInput;
    domain: string;
}
/**
 * Create a SIWS envelope for an Aptos structured message.
 * A signature on the Solana blockchain by `solanaPublicKey` will be
 * considered as valid signature on the Aptos blockchain for the provided message.
 */
export declare function createSiwsEnvelopeForAptosStructuredMessage(input: CreateSiwsEnvelopeInput & {
    structuredMessage: StructuredMessage;
}): SolanaSignInInputWithRequiredFields;
/**
 * Create a SIWS envelope for an Aptos transaction.
 * A signature on the Solana blockchain by `solanaPublicKey` will be
 * considered as valid signature on the Aptos blockchain for the provided transaction.
 */
export declare function createSiwsEnvelopeForAptosTransaction(input: CreateSiwsEnvelopeInput & {
    rawTransaction: AnyRawTransaction;
}): SolanaSignInInputWithRequiredFields;
//# sourceMappingURL=createSiwsEnvelope.d.ts.map