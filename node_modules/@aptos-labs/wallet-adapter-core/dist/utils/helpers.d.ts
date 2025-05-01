import { AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { NetworkInfo, NetworkInfo as StandardNetworkInfo } from "@aptos-labs/wallet-standard";
import { DappConfig } from "../WalletCore";
import { InputTransactionData } from "./types";
export declare function isMobile(): boolean;
export declare function isInAppBrowser(): boolean;
export declare function isRedirectable(): boolean;
export declare function generalizedErrorMessage(error: any): string;
/**
 * Helper function to get AptosConfig that supports Aptos and Custom networks
 *
 * @param networkInfo
 * @param dappConfig
 * @returns AptosConfig
 */
export declare const getAptosConfig: (networkInfo: NetworkInfo | null, dappConfig: DappConfig | undefined) => AptosConfig;
/**
 * Helper function to resolve if the current connected network is an Aptos network
 *
 * @param networkInfo
 * @returns boolean
 */
export declare const isAptosNetwork: (networkInfo: NetworkInfo | StandardNetworkInfo | null) => boolean;
export declare const isAptosLiveNetwork: (networkInfo: Network) => boolean;
/**
 * Helper function to fetch Devnet chain id
 */
export declare const fetchDevnetChainId: () => Promise<number>;
/**
 * A helper function to handle the publish package transaction.
 * The Aptos SDK expects the metadataBytes and byteCode to be Uint8Array, but in case the arguments are passed in
 * as a string, this function converts the string to Uint8Array.
 */
export declare const handlePublishPackageTransaction: (transactionInput: InputTransactionData) => {
    metadataBytes: number | bigint | boolean | Uint8Array | import("@aptos-labs/ts-sdk/dist/common/accountAddress-5ltp27oM").g | import("@aptos-labs/ts-sdk").Bool | import("@aptos-labs/ts-sdk").U8 | import("@aptos-labs/ts-sdk").U16 | import("@aptos-labs/ts-sdk").U32 | import("@aptos-labs/ts-sdk").U64 | import("@aptos-labs/ts-sdk").U128 | import("@aptos-labs/ts-sdk").U256 | import("@aptos-labs/ts-sdk").MoveVector<import("@aptos-labs/ts-sdk").EntryFunctionArgumentTypes> | import("@aptos-labs/ts-sdk").MoveOption<import("@aptos-labs/ts-sdk").EntryFunctionArgumentTypes> | import("@aptos-labs/ts-sdk").MoveString | import("@aptos-labs/ts-sdk").FixedBytes | ArrayBuffer | (import("@aptos-labs/ts-sdk").EntryFunctionArgumentTypes | import("@aptos-labs/ts-sdk").SimpleEntryFunctionArgumentTypes)[] | import("@aptos-labs/ts-sdk").MoveVector<import("@aptos-labs/ts-sdk").ScriptFunctionArgumentTypes> | import("@aptos-labs/ts-sdk").Serialized | null | undefined;
    byteCode: (import("@aptos-labs/ts-sdk").EntryFunctionArgumentTypes | import("@aptos-labs/ts-sdk").SimpleEntryFunctionArgumentTypes)[];
};
export declare function convertNetwork(networkInfo: NetworkInfo | null): Network;
//# sourceMappingURL=helpers.d.ts.map