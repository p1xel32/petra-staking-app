import { Deserializer, Serializer } from '@aptos-labs/ts-sdk';
export declare function serializeStr(serializer: Serializer, value: string): void;
export declare function deserializeStr(deserializer: Deserializer): string;
export declare function serializeOptionalStr(serializer: Serializer, value?: string): void;
export declare function deserializeOptionalStr(deserializer: Deserializer): string | undefined;
//# sourceMappingURL=string.d.ts.map