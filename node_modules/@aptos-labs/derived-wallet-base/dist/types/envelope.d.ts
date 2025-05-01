import { AnyRawTransaction, TransactionPayload } from '@aptos-labs/ts-sdk';
import { StructuredMessage } from './StructuredMessage';
/**
 * Extract the fully-qualified entry function name from the transaction payload, when applicable
 */
export declare function getEntryFunctionName(payload: TransactionPayload): string | undefined;
/**
 * Create a human-readable statement for the specified Aptos message,
 * suitable to be included into a "Sign in with ..." envelope
 */
export declare function createStructuredMessageStatement({ message, chainId }: StructuredMessage): string;
/**
 * Create a human-readable statement for the specified Aptos transaction,
 * suitable to be included into a "Sign in with ..." envelope.
 */
export declare function createTransactionStatement(rawTransaction: AnyRawTransaction): string;
//# sourceMappingURL=envelope.d.ts.map