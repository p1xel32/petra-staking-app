import { AccountAddressInput, InputGenerateTransactionOptions } from "@aptos-labs/ts-sdk";
import { InputGenerateTransactionPayloadData } from "@aptos-labs/ts-sdk";
import { WalletReadyState } from "../constants";
export interface AptosStandardSupportedWallet {
    name: string;
    url: string;
    icon: `data:image/${"svg+xml" | "webp" | "png" | "gif"};base64,${string}`;
    readyState: WalletReadyState.NotDetected;
    isAIP62Standard: true;
    deeplinkProvider?: string;
}
export type AvailableWallets = "Continue with Apple" | "Continue with Google" | "MSafe" | "Mizu Wallet" | "Nightly" | "OKX Wallet" | "Petra" | "Pontem Wallet" | "Rimosafe" | "T wallet";
export type InputTransactionData = {
    sender?: AccountAddressInput;
    data: InputGenerateTransactionPayloadData;
    options?: InputGenerateTransactionOptions & {
        expirationSecondsFromNow?: number;
        expirationTimestamp?: number;
    };
    withFeePayer?: boolean;
};
export type WalletInfo = {
    name: string;
    icon: string;
    url: string;
};
//# sourceMappingURL=types.d.ts.map