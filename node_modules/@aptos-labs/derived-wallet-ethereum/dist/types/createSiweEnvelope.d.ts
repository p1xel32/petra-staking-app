import { StructuredMessage } from '@aptos-labs/derived-wallet-base';
import { AnyRawTransaction, HexInput } from '@aptos-labs/ts-sdk';
import { EthereumAddress } from './shared';
export interface CreateSiweEnvelopeInput {
    ethereumAddress: EthereumAddress;
    chainId: number;
    signingMessageDigest: HexInput;
    issuedAt: Date;
}
export declare function createSiweEnvelopeForAptosStructuredMessage(input: CreateSiweEnvelopeInput & {
    structuredMessage: StructuredMessage;
}): string;
export declare function createSiweEnvelopeForAptosTransaction(input: CreateSiweEnvelopeInput & {
    rawTransaction: AnyRawTransaction;
}): string;
//# sourceMappingURL=createSiweEnvelope.d.ts.map