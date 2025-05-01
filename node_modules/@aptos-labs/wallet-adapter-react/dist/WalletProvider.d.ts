import { AvailableWallets, DappConfig, AccountInfo, AdapterWallet, WalletCore, AnyPublicKey as AptosAnyPublicKey, AccountAddress } from "@aptos-labs/wallet-adapter-core";
import { ReactNode, FC } from "react";
import { SolanaPublicKey } from "@aptos-labs/derived-wallet-solana";
export interface AptosWalletProviderProps {
    children: ReactNode;
    optInWallets?: ReadonlyArray<AvailableWallets>;
    autoConnect?: boolean | ((core: WalletCore, adapter: AdapterWallet) => Promise<boolean>);
    dappConfig?: DappConfig;
    disableTelemetry?: boolean;
    onError?: (error: any) => void;
}
export type OriginWalletDetails = {
    address: string | AccountAddress;
    publicKey?: SolanaPublicKey | AptosAnyPublicKey | undefined;
} | AccountInfo | null;
export declare const AptosWalletAdapterProvider: FC<AptosWalletProviderProps>;
//# sourceMappingURL=WalletProvider.d.ts.map