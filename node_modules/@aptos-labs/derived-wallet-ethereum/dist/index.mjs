// src/EIP1193DerivedPublicKey.ts
import { computeDerivableAuthenticationKey, parseAptosSigningMessage } from "@aptos-labs/derived-wallet-base";
import {
  AccountPublicKey,
  hashValues,
  Hex as Hex3,
  Serializer as Serializer2
} from "@aptos-labs/ts-sdk";
import { verifyMessage as verifyEthereumMessage } from "ethers";

// src/createSiweEnvelope.ts
import {
  createStructuredMessageStatement,
  createTransactionStatement
} from "@aptos-labs/derived-wallet-base";
import { Hex } from "@aptos-labs/ts-sdk";
import { createSiweMessage } from "viem/siwe";
function createSiweEnvelope(input) {
  const { ethereumAddress, chainId, signingMessageDigest, issuedAt, statement } = input;
  const digestHex = Hex.fromHexInput(signingMessageDigest).toString();
  return createSiweMessage({
    address: ethereumAddress,
    domain: window.location.host,
    uri: window.location.origin,
    chainId,
    nonce: digestHex,
    statement,
    version: "1",
    issuedAt
  });
}
function createSiweEnvelopeForAptosStructuredMessage(input) {
  const { structuredMessage, ...rest } = input;
  const statement = createStructuredMessageStatement(structuredMessage);
  return createSiweEnvelope({ ...rest, statement });
}
function createSiweEnvelopeForAptosTransaction(input) {
  const { rawTransaction, ...rest } = input;
  const statement = createTransactionStatement(rawTransaction);
  return createSiweEnvelope({ ...rest, statement });
}

// src/EIP1193DerivedSignature.ts
import { Hex as Hex2, Signature } from "@aptos-labs/ts-sdk";
var _EIP1193DerivedSignature = class _EIP1193DerivedSignature extends Signature {
  constructor(siweSignature, chainId, issuedAt) {
    super();
    this._siweSignature = Hex2.fromHexInput(siweSignature).toUint8Array();
    if (this._siweSignature.length !== _EIP1193DerivedSignature.LENGTH) {
      throw new Error("Expected signature length to be 65 bytes");
    }
    this.chainId = chainId;
    this.issuedAt = issuedAt;
  }
  get siweSignature() {
    return Hex2.fromHexInput(this._siweSignature).toString();
  }
  serialize(serializer) {
    serializer.serializeFixedBytes(this._siweSignature);
    serializer.serializeU32AsUleb128(this.chainId);
    serializer.serializeU64(this.issuedAt.getTime());
  }
  static deserialize(deserializer) {
    const siweSignature = deserializer.deserializeFixedBytes(_EIP1193DerivedSignature.LENGTH);
    const chainId = deserializer.deserializeUleb128AsU32();
    const issuedAt = new Date(Number(deserializer.deserializeU64()));
    return new _EIP1193DerivedSignature(siweSignature, chainId, issuedAt);
  }
};
_EIP1193DerivedSignature.LENGTH = 65;
var EIP1193DerivedSignature = _EIP1193DerivedSignature;

// src/EIP1193DerivedPublicKey.ts
var EIP1193DerivedPublicKey = class _EIP1193DerivedPublicKey extends AccountPublicKey {
  constructor({ domain, ethereumAddress, authenticationFunction }) {
    super();
    this.domain = domain;
    this.ethereumAddress = ethereumAddress;
    this.authenticationFunction = authenticationFunction;
    const utf8EncodedDomain = new TextEncoder().encode(domain);
    const ethereumAddressBytes = Hex3.fromHexInput(ethereumAddress).toUint8Array();
    const serializer = new Serializer2();
    serializer.serializeBytes(utf8EncodedDomain);
    serializer.serializeBytes(ethereumAddressBytes);
    const accountIdentifier = hashValues([serializer.toUint8Array()]);
    this._authKey = computeDerivableAuthenticationKey(
      authenticationFunction,
      ethereumAddress,
      domain
    );
  }
  authKey() {
    return this._authKey;
  }
  verifySignature({ message, signature }) {
    const parsedSigningMessage = parseAptosSigningMessage(message);
    if (!parsedSigningMessage || !(signature instanceof EIP1193DerivedSignature)) {
      return false;
    }
    const { chainId, issuedAt, siweSignature } = signature;
    const signingMessageDigest = hashValues([message]);
    const envelopeInput = {
      ethereumAddress: this.ethereumAddress,
      chainId,
      signingMessageDigest,
      issuedAt
    };
    const siweMessage = parsedSigningMessage.type === "structuredMessage" ? createSiweEnvelopeForAptosStructuredMessage({
      ...parsedSigningMessage,
      ...envelopeInput
    }) : createSiweEnvelopeForAptosTransaction({
      ...parsedSigningMessage,
      ...envelopeInput
    });
    const recoveredAddress = verifyEthereumMessage(siweMessage, siweSignature);
    return recoveredAddress === this.ethereumAddress;
  }
  async verifySignatureAsync(args) {
    return this.verifySignature({ message: args.message, signature: args.signature });
  }
  // region Serialization
  serialize(serializer) {
    serializer.serializeStr(this.domain);
    serializer.serializeFixedBytes(Hex3.fromHexInput(this.ethereumAddress).toUint8Array());
    serializer.serializeStr(this.authenticationFunction);
  }
  static deserialize(deserializer) {
    const domain = deserializer.deserializeStr();
    const ethereumAddressBytes = deserializer.deserializeFixedBytes(20);
    const ethereumAddress = Hex3.fromHexInput(ethereumAddressBytes).toString();
    const authenticationFunction = deserializer.deserializeStr();
    return new _EIP1193DerivedPublicKey({ domain, ethereumAddress, authenticationFunction });
  }
  // endregion
};

// src/EIP1193DerivedWallet.ts
import { fetchDevnetChainId, isNullCallback, mapUserResponse as mapUserResponse3 } from "@aptos-labs/derived-wallet-base";
import {
  Network,
  NetworkToChainId,
  NetworkToNodeAPI
} from "@aptos-labs/ts-sdk";
import {
  AccountInfo,
  APTOS_CHAINS,
  UserResponseStatus
} from "@aptos-labs/wallet-standard";
import { BrowserProvider as BrowserProvider3 } from "ethers";

// src/shared.ts
import { makeUserApproval, makeUserRejection } from "@aptos-labs/derived-wallet-base";
import { isError as isEthersError } from "ethers";
async function wrapEthersUserResponse(promise) {
  try {
    const response = await promise;
    return makeUserApproval(response);
  } catch (err) {
    if (isEthersError(err, "ACTION_REJECTED")) {
      return makeUserRejection();
    }
    throw err;
  }
}

// src/signAptosMessage.ts
import {
  encodeStructuredMessage,
  mapUserResponse
} from "@aptos-labs/derived-wallet-base";
import { hashValues as hashValues2 } from "@aptos-labs/ts-sdk";
import { BrowserProvider } from "ethers";
async function signAptosMessageWithEthereum(input) {
  const { authenticationFunction, messageInput } = input;
  const eip1193Provider = input.eip1193Provider instanceof BrowserProvider ? input.eip1193Provider : new BrowserProvider(input.eip1193Provider);
  const accounts = await eip1193Provider.listAccounts();
  const ethereumAccount = input.ethereumAddress ? accounts.find((account) => account.address === input.ethereumAddress) : accounts[0];
  if (!ethereumAccount) {
    throw new Error("Account not connected");
  }
  const ethereumAddress = ethereumAccount.address;
  const aptosPublicKey = new EIP1193DerivedPublicKey({
    domain: window.location.origin,
    ethereumAddress,
    authenticationFunction
  });
  const { message, nonce, chainId, ...flags } = messageInput;
  const aptosAddress = flags.address ? aptosPublicKey.authKey().derivedAddress() : void 0;
  const application = flags.application ? window.location.origin : void 0;
  const structuredMessage = {
    address: aptosAddress?.toString(),
    application,
    chainId,
    message,
    nonce
  };
  const signingMessage = encodeStructuredMessage(structuredMessage);
  const signingMessageDigest = hashValues2([signingMessage]);
  const issuedAt = /* @__PURE__ */ new Date();
  const siweMessage = createSiweEnvelopeForAptosStructuredMessage({
    ethereumAddress,
    chainId,
    structuredMessage,
    signingMessageDigest,
    issuedAt
  });
  const response = await wrapEthersUserResponse(ethereumAccount.signMessage(siweMessage));
  return mapUserResponse(response, (siweSignature) => {
    const signature = new EIP1193DerivedSignature(siweSignature, chainId, issuedAt);
    const fullMessage = new TextDecoder().decode(signingMessage);
    return {
      prefix: "APTOS",
      fullMessage,
      message,
      nonce,
      signature
    };
  });
}

// src/signAptosTransaction.ts
import { mapUserResponse as mapUserResponse2 } from "@aptos-labs/derived-wallet-base";
import {
  AccountAuthenticatorAbstraction,
  generateSigningMessageForTransaction,
  hashValues as hashValues3
} from "@aptos-labs/ts-sdk";
import { BrowserProvider as BrowserProvider2 } from "ethers";
async function signAptosTransactionWithEthereum(input) {
  const { authenticationFunction, rawTransaction } = input;
  const eip1193Provider = input.eip1193Provider instanceof BrowserProvider2 ? input.eip1193Provider : new BrowserProvider2(input.eip1193Provider);
  const accounts = await eip1193Provider.listAccounts();
  const ethereumAccount = input.ethereumAddress ? accounts.find((account) => account.address === input.ethereumAddress) : accounts[0];
  if (!ethereumAccount) {
    throw new Error("Account not connected");
  }
  const ethereumAddress = ethereumAccount.address;
  const signingMessage = generateSigningMessageForTransaction(rawTransaction);
  const signingMessageDigest = hashValues3([signingMessage]);
  const chainId = rawTransaction.rawTransaction.chain_id.chainId;
  const issuedAt = /* @__PURE__ */ new Date();
  const siweMessage = createSiweEnvelopeForAptosTransaction({
    ethereumAddress,
    chainId,
    rawTransaction,
    signingMessageDigest,
    issuedAt
  });
  const response = await wrapEthersUserResponse(ethereumAccount.signMessage(siweMessage));
  return mapUserResponse2(response, (siweSignature) => {
    const signature = new EIP1193DerivedSignature(siweSignature, chainId, issuedAt);
    const authenticator = signature.bcsToBytes();
    return new AccountAuthenticatorAbstraction(
      authenticationFunction,
      signingMessageDigest,
      authenticator
    );
  });
}

// src/EIP1193DerivedWallet.ts
var defaultAuthenticationFunction = "0x7::eip1193::authenticate";
var EIP1193DerivedWallet = class {
  constructor(providerDetail, options = {}) {
    this.version = "1.0.0";
    this.accounts = [];
    this.chains = APTOS_CHAINS;
    this.features = {
      "aptos:connect": {
        version: "1.0.0",
        connect: () => this.connect()
      },
      "aptos:disconnect": {
        version: "1.0.0",
        disconnect: () => this.disconnect()
      },
      "aptos:account": {
        version: "1.0.0",
        account: () => this.getActiveAccount()
      },
      "aptos:onAccountChange": {
        version: "1.0.0",
        onAccountChange: async (callback) => this.onActiveAccountChange(callback)
      },
      "aptos:network": {
        version: "1.0.0",
        network: () => this.getActiveNetwork()
      },
      "aptos:changeNetwork": {
        version: "1.0.0",
        changeNetwork: (newNetwork) => this.changeNetwork(newNetwork)
      },
      "aptos:onNetworkChange": {
        version: "1.0.0",
        onNetworkChange: async (callback) => this.onActiveNetworkChange(callback)
      },
      "aptos:signMessage": {
        version: "1.0.0",
        signMessage: (args) => this.signMessage(args)
      },
      "aptos:signTransaction": {
        version: "1.0.0",
        signTransaction: (...args) => this.signTransaction(...args)
      }
    };
    this.onAccountsChangedListeners = [];
    // endregion
    // region Networks
    this.onActiveNetworkChangeListeners = [];
    const { info, provider } = providerDetail;
    const {
      authenticationFunction = defaultAuthenticationFunction,
      defaultNetwork = Network.MAINNET
    } = options;
    this.eip1193Provider = provider;
    this.eip1193Ethers = new BrowserProvider3(provider);
    this.domain = window.location.origin;
    this.authenticationFunction = authenticationFunction;
    this.defaultNetwork = defaultNetwork;
    this.name = `${info.name} (Ethereum)`;
    this.icon = info.icon.trim();
    this.url = info.rdns;
  }
  derivePublicKey(ethereumAddress) {
    return new EIP1193DerivedPublicKey({
      domain: this.domain,
      ethereumAddress,
      authenticationFunction: this.authenticationFunction
    });
  }
  // region Connection
  async connect() {
    const response = await wrapEthersUserResponse(this.eip1193Ethers.getSigner());
    return mapUserResponse3(response, (account) => {
      const publicKey = this.derivePublicKey(account.address);
      const aptosAddress = publicKey.authKey().derivedAddress();
      return new AccountInfo({ publicKey, address: aptosAddress });
    });
  }
  async disconnect() {
  }
  // endregion
  // region Accounts
  async getActiveAccount() {
    const [activeAccount] = await this.eip1193Ethers.listAccounts();
    if (!activeAccount) {
      throw new Error("Account not connected");
    }
    const publicKey = this.derivePublicKey(activeAccount.address);
    const aptosAddress = publicKey.authKey().derivedAddress();
    return new AccountInfo({ publicKey, address: aptosAddress });
  }
  onActiveAccountChange(callback) {
    if (isNullCallback(callback)) {
      for (const listener of this.onAccountsChangedListeners) {
        this.eip1193Provider.removeListener("accountsChanged", listener);
      }
      this.onAccountsChangedListeners = [];
    } else {
      const listener = ([ethereumAddress]) => {
        if (!ethereumAddress) {
          callback(void 0);
          return;
        }
        const publicKey = this.derivePublicKey(ethereumAddress);
        const aptosAddress = publicKey.authKey().derivedAddress();
        const account = new AccountInfo({ publicKey, address: aptosAddress });
        callback(account);
      };
      this.onAccountsChangedListeners.push(listener);
      this.eip1193Provider.on("accountsChanged", listener);
    }
  }
  async getActiveNetwork() {
    const chainId = NetworkToChainId[this.defaultNetwork];
    const url = NetworkToNodeAPI[this.defaultNetwork];
    return {
      name: this.defaultNetwork,
      chainId,
      url
    };
  }
  async changeNetwork(newNetwork) {
    const { name, chainId, url } = newNetwork;
    if (name === Network.CUSTOM) {
      throw new Error("Custom network not currently supported");
    }
    this.defaultNetwork = name;
    for (const listener of this.onActiveNetworkChangeListeners) {
      listener({
        name,
        chainId: chainId ?? NetworkToChainId[name],
        url: url ?? NetworkToNodeAPI[name]
      });
    }
    return {
      status: UserResponseStatus.APPROVED,
      args: { success: true }
    };
  }
  onActiveNetworkChange(callback) {
    if (isNullCallback(callback)) {
      this.onActiveNetworkChangeListeners = [];
    } else {
      this.onActiveNetworkChangeListeners.push(callback);
    }
  }
  // endregion
  // region Signatures
  async signMessage(input) {
    const chainId = this.defaultNetwork === Network.DEVNET ? await fetchDevnetChainId() : NetworkToChainId[this.defaultNetwork];
    return signAptosMessageWithEthereum({
      eip1193Provider: this.eip1193Provider,
      authenticationFunction: this.authenticationFunction,
      messageInput: {
        ...input,
        chainId
      }
    });
  }
  async signTransaction(rawTransaction, _asFeePayer) {
    return signAptosTransactionWithEthereum({
      eip1193Provider: this.eip1193Provider,
      authenticationFunction: this.authenticationFunction,
      rawTransaction
    });
  }
  // endregion
};

// src/setupAutomaticDerivation.ts
import { getWallets } from "@wallet-standard/app";
import { createStore } from "mipd";
function setupAutomaticEthereumWalletDerivation(options = {}) {
  const walletsApi = getWallets();
  const eip6963Store = createStore();
  let registrations = {};
  const deriveAndRegisterWallet = (detail) => {
    const derivedWallet = new EIP1193DerivedWallet(detail, options);
    registrations[detail.info.rdns] = walletsApi.register(derivedWallet);
  };
  const initialProviders = eip6963Store.getProviders();
  for (const detail of initialProviders) {
    deriveAndRegisterWallet(detail);
  }
  eip6963Store.subscribe((details) => {
    for (const detail of details) {
      deriveAndRegisterWallet(detail);
    }
  });
  return () => {
    eip6963Store.destroy();
    for (const unregisterWallet of Object.values(registrations)) {
      unregisterWallet();
    }
  };
}
export {
  EIP1193DerivedPublicKey,
  EIP1193DerivedSignature,
  EIP1193DerivedWallet,
  setupAutomaticEthereumWalletDerivation,
  wrapEthersUserResponse
};
//# sourceMappingURL=index.mjs.map