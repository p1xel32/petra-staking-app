import {
  AccountAddress,
  AccountAuthenticator,
  AnyRawTransaction,
  Ed25519PublicKey,
  Hex,
  InputGenerateTransactionOptions,
  InputSubmitTransactionData,
  Network,
  PendingTransactionResponse,
  Serializer,
  SigningScheme,
  SimpleTransaction
} from '@aptos-labs/ts-sdk'
import {
  InputTransactionData,
  Types,
  Wallet,
  WalletName,
  WalletReadyState
} from '@aptos-labs/wallet-adapter-core'
import {
  APTOS_CHAINS,
  AccountInfo,
  AptosChangeNetworkMethod,
  AptosConnectMethod,
  AptosConnectOutput,
  AptosDisconnectMethod,
  AptosFeatures,
  AptosGetAccountMethod,
  AptosGetNetworkMethod,
  AptosOnAccountChangeInput,
  AptosOnAccountChangeMethod,
  AptosOnNetworkChangeInput,
  AptosOnNetworkChangeMethod,
  AptosSignAndSubmitTransactionInput,
  AptosSignAndSubmitTransactionOutput,
  AptosSignMessageInput,
  AptosSignMessageMethod,
  AptosSignMessageOutput,
  AptosSignTransactionMethod,
  AptosSignTransactionOutput,
  AptosWallet,
  AptosWalletAccount,
  IdentifierArray,
  NetworkInfo,
  UserResponse,
  UserResponseStatus
} from '@aptos-labs/wallet-standard'
import { Bellhop } from './Bellhop'

export const MSafeWalletName = 'MSafe' as WalletName<'MSafe'>

export function inMSafeWallet(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    typeof parent !== 'undefined' &&
    typeof parent.window !== 'undefined' &&
    parent.window !== window
  )
}

export interface ConnectResponse {
  address: string
}

export interface MSafeWalletServerApi {
  connect: () => Promise<string>
  signTransaction: AptosSignTransactionMethod
  signMessage: AptosSignMessageMethod
  signAndSubmitTransaction: (
    transaction:
      | Types.TransactionPayload
      | InputTransactionData
      | AnyRawTransaction
      | AptosSignAndSubmitTransactionInput,
    options?: InputGenerateTransactionOptions
  ) => Promise<UserResponse<AptosSignAndSubmitTransactionOutput>>
  submitTransaction(transaction: InputSubmitTransactionData): Promise<PendingTransactionResponse>
}

export class MSafeWalletAccount implements AptosWalletAccount {
  address: string
  publicKey: Uint8Array
  chains: IdentifierArray = APTOS_CHAINS
  features: IdentifierArray = []
  signingScheme: SigningScheme
  label?: string
  icon?:
    | `data:image/svg+xml;base64,${string}`
    | `data:image/webp;base64,${string}`
    | `data:image/png;base64,${string}`
    | `data:image/gif;base64,${string}`
    | undefined
  constructor(address: AccountAddress) {
    this.address = address.toString()
    this.publicKey = new Uint8Array()
    this.chains = APTOS_CHAINS
    this.signingScheme = SigningScheme.MultiEd25519
  }
}

export class MSafeWalletServer {
  private bellhop = new Bellhop()

  constructor(private iframe: HTMLIFrameElement, private api: MSafeWalletServerApi) {}

  connect() {
    this.bellhop.connect(this.iframe)

    this.bellhop.on('connect', async () => {
      const address = await this.api.connect()
      console.log('🚀 ~ MSafeWalletServer ~ on ~ connect:', address)
      this.bellhop.respond('connectResponse', { address })
    })

    this.bellhop.on('signMessage', async (input: any) => {
      const result = await this.api.signMessage(input)
      console.log('🚀 ~ MSafeWalletServer ~ on ~ signMessage:', result)
      this.bellhop.respond('signMessageResponse', result)
    })

    this.bellhop.on('signTransaction', async (input: any) => {
      const result = await this.api.signTransaction(input)
      console.log('🚀 ~ MSafeWalletServer ~ on ~ signTransaction:', result)
      this.bellhop.respond('signTransactionResponse', result)
    })

    this.bellhop.on('submitTransaction', async (input: any) => {
      const result = await this.api.submitTransaction(input)
      console.log('🚀 ~ MSafeWalletServer ~ on ~ submitTransaction:', result)
      this.bellhop.respond('submitTransactionResponse', result)
    })

    this.bellhop.on('signAndSubmitTransaction', async (input: any) => {
      const result = await this.api.signAndSubmitTransaction(input)
      console.log('🚀 ~ MSafeWalletServer ~ on ~ signAndSubmitTransaction:', result)
      this.bellhop.respond('signAndSubmitTransactionResponse', result)
    })
  }

  disconnect() {
    console.log('🚀 ~ MSafeWalletServer ~ disconnect:')
    this.bellhop.disconnect()
  }

  changeAccount(address: string) {
    console.log('🚀 ~ MSafeWalletServer ~ changeAccount:', address)
    this.bellhop.send('changeAccount', { address })
  }
}

export interface MSafeConfig {
  network: Network
  appId?: string // for registered app id
  appUrl?: string // app url
}

/**
 * For 3rd party dApp
 */
export class MSafeWallet implements AptosWallet, Wallet {
  readonly url: string
  readonly isAIP62Standard = true
  readonly version = '1.0.0'
  readonly name = MSafeWalletName
  readonly providerName = MSafeWalletName
  readonly provider = null
  // readonly readyState: WalletReadyState
  readonly icon =
    'data:image/png;base64,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'
  chains = APTOS_CHAINS
  accounts: MSafeWalletAccount[] = []
  onAccountChangeInput?: AptosOnAccountChangeInput
  onNetworkChangeInput?: AptosOnNetworkChangeInput

  private bellhop = new Bellhop()

  get features(): AptosFeatures {
    return {
      'aptos:connect': {
        version: '1.0.0',
        connect: this.connect
      },
      'aptos:network': {
        version: '1.0.0',
        network: this.network
      },
      'aptos:disconnect': {
        version: '1.0.0',
        disconnect: this.disconnect
      },
      'aptos:signTransaction': {
        version: '1.0.0',
        signTransaction: this.signTransaction
      },
      'aptos:signMessage': {
        version: '1.0.0',
        signMessage: this.signMessage
      },
      'aptos:onAccountChange': {
        version: '1.0.0',
        onAccountChange: this.onAccountChange
      },
      'aptos:onNetworkChange': {
        version: '1.0.0',
        onNetworkChange: this.onNetworkChange
      },
      'aptos:account': {
        version: '1.0.0',
        account: this.account
      }
    }
  }

  constructor(private config: MSafeConfig) {
    const { network, appId, appUrl } = this.config

    let url = 'https://aptos-testnet.m-safe.io/'

    if (network !== Network.TESTNET) {
      url = 'https://aptos.m-safe.io/'
    }

    if (appId) {
      this.url = `${url}/store/${appId}`
    } else {
      this.url = `${url}/store/0?url=${appUrl}`
    }

    // this.readyState = inMSafeWallet() ? WalletReadyState.Installed : WalletReadyState.NotDetected

    this.bellhop.connect()

    this.bellhop.on('changeAccount', async (input: any) => {
      console.log('🚀 ~ MSafeWallet ~ on ~ changeAccount:', input, this.onAccountChangeInput)
      if (this.onAccountChangeInput) {
        const address = input.data.address
        this.onAccountChangeInput(
          new AccountInfo({
            address: AccountAddress.fromString(address),
            publicKey: new Ed25519PublicKey(address)
          })
        )
      }
    })
  }
  deeplinkProvider?: ((data: { url: string }) => string) | undefined
  openInMobileApp?: (() => void) | undefined
  changeNetwork?: AptosChangeNetworkMethod | undefined

  account: AptosGetAccountMethod = async (): Promise<AccountInfo> => {
    console.log('🚀 ~ MSafeWallet ~ AptosGetAccountMethod:')
    return this.getCurrentAccountInfo()
  }

  connect: AptosConnectMethod = async (): Promise<UserResponse<AptosConnectOutput>> => {
    console.log('🚀 ~ MSafeWallet ~ AptosConnectMethod:')
    return this.getCurrentAccountInfo().then((accountInfo) => {
      return {
        status: UserResponseStatus.APPROVED,
        args: accountInfo
      }
    })
  }

  network: AptosGetNetworkMethod = async (): Promise<NetworkInfo> => {
    return {
      name: this.config.network,
      chainId: this.config.network === Network.MAINNET ? 1 : 2
    }
  }

  disconnect: AptosDisconnectMethod = async (): Promise<void> => {
    console.log('🚀 ~ MSafeWallet ~ disconnect:')
    return Promise.resolve()
  }

  signMessage: AptosSignMessageMethod = async (
    input: AptosSignMessageInput
  ): Promise<UserResponse<AptosSignMessageOutput>> => {
    console.log('🚀 ~ MSafeWallet ~ signMessage:')
    this.bellhop.send('signMessage', input)
    return this.fetch<UserResponse<AptosSignMessageOutput>>('signMessageResponse')
  }

  signTransaction: AptosSignTransactionMethod = async (
    transaction: AnyRawTransaction,
    asFeePayer?: boolean
  ): Promise<UserResponse<AccountAuthenticator>> => {
    console.log('🚀 ~ MSafeWallet ~ signTransaction:')
    this.bellhop.send('signTransaction', { transaction, asFeePayer })
    return this.fetch<UserResponse<AptosSignTransactionOutput>>('signTransactionResponse')
  }

  async submitTransaction(
    transaction: InputSubmitTransactionData
  ): Promise<PendingTransactionResponse> {
    console.log('🚀 ~ MSafeWallet ~ submitTransaction:')
    this.bellhop.send('submitTransaction', { transaction })
    return this.fetch<PendingTransactionResponse>('submitTransactionResponse')
  }

  async signAndSubmitTransaction(
    transaction:
      | Types.TransactionPayload
      | InputTransactionData
      | AnyRawTransaction
      | AptosSignAndSubmitTransactionInput,
    options?: InputGenerateTransactionOptions
  ): Promise<UserResponse<AptosSignAndSubmitTransactionOutput>> {
    console.log('🚀 ~ MSafeWallet ~ signAndSubmitTransaction:', transaction)

    if (transaction.rawTransaction) {
      const simpleTransaction: SimpleTransaction = transaction
      const serializer = new Serializer()
      simpleTransaction.rawTransaction.serialize(serializer)
      const content = Hex.fromHexInput(serializer.toUint8Array()).toString()
      this.bellhop.send('signAndSubmitTransaction', { transaction, options, content })
    } else {
      this.bellhop.send('signAndSubmitTransaction', { transaction, options })
    }

    const response = await this.fetch<UserResponse<AptosSignAndSubmitTransactionOutput>>(
      'signAndSubmitTransactionResponse'
    )
    return response
  }

  onAccountChange: AptosOnAccountChangeMethod = async (listener): Promise<void> => {
    console.log('🚀 ~ MSafeWallet ~ onAccountChange ~ listener:', listener)
    this.onAccountChangeInput = listener
  }

  onNetworkChange: AptosOnNetworkChangeMethod = async (listener): Promise<void> => {
    console.log('🚀 ~ MSafeWallet ~ onNetworkChange ~ listener:', listener)
    this.onNetworkChangeInput = listener
  }

  private async getCurrentAccountInfo(): Promise<AccountInfo> {
    this.bellhop.send('connect')
    const { address } = await this.fetch<{ address: string }>('connectResponse')
    console.log('🚀 ~ MSafeWallet ~ getCurrentAccountInfo ~ address:', address)
    return new AccountInfo({
      address: AccountAddress.fromString(address),
      publicKey: new Ed25519PublicKey(address)
    })
  }

  private async fetch<T>(name: string) {
    return new Promise<T>((resolve) => {
      this.bellhop.fetch(name, (data: any) => {
        resolve(data.data)
      })
    })
  }
}
