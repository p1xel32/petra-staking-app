import { AccountAddressInput } from '@aptos-labs/ts-sdk';
export declare const structuredMessagePrefix: "APTOS";
export interface StructuredMessageInput {
    message: string;
    nonce: string;
    application?: boolean;
    chainId?: number | boolean;
    address?: AccountAddressInput | boolean;
}
export interface StructuredMessage {
    message: string;
    nonce: string;
    application?: string;
    chainId?: number;
    address?: string;
}
export declare function encodeStructuredMessage(structuredMessage: StructuredMessage): Uint8Array;
export declare function decodeStructuredMessage(encoded: Uint8Array): StructuredMessage;
//# sourceMappingURL=StructuredMessage.d.ts.map