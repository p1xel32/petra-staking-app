import { AnyRawTransaction, HexInput, RawTransaction, RawTransactionWithData } from '@aptos-labs/ts-sdk';
import { StructuredMessage } from './StructuredMessage';
export declare function parseRawTransaction(message: Uint8Array): RawTransaction | RawTransactionWithData | undefined;
export interface ParseSigningMessageTransactionResult {
    type: 'transaction';
    rawTransaction: AnyRawTransaction;
}
export interface ParseSigningMessageStructuredMessageResult {
    type: 'structuredMessage';
    structuredMessage: StructuredMessage;
}
export type ParseSigningMessageResult = ParseSigningMessageTransactionResult | ParseSigningMessageStructuredMessageResult;
export declare function parseAptosSigningMessage(message: HexInput): ParseSigningMessageResult | undefined;
//# sourceMappingURL=parseAptosSigningMessage.d.ts.map