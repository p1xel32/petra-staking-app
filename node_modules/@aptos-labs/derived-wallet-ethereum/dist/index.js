"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  EIP1193DerivedPublicKey: () => EIP1193DerivedPublicKey,
  EIP1193DerivedSignature: () => EIP1193DerivedSignature,
  EIP1193DerivedWallet: () => EIP1193DerivedWallet,
  setupAutomaticEthereumWalletDerivation: () => setupAutomaticEthereumWalletDerivation,
  wrapEthersUserResponse: () => wrapEthersUserResponse
});
module.exports = __toCommonJS(index_exports);

// src/EIP1193DerivedPublicKey.ts
var import_derived_wallet_base2 = require("@aptos-labs/derived-wallet-base");
var import_ts_sdk3 = require("@aptos-labs/ts-sdk");
var import_ethers = require("ethers");

// src/createSiweEnvelope.ts
var import_derived_wallet_base = require("@aptos-labs/derived-wallet-base");
var import_ts_sdk = require("@aptos-labs/ts-sdk");
var import_siwe = require("viem/siwe");
function createSiweEnvelope(input) {
  const { ethereumAddress, chainId, signingMessageDigest, issuedAt, statement } = input;
  const digestHex = import_ts_sdk.Hex.fromHexInput(signingMessageDigest).toString();
  return (0, import_siwe.createSiweMessage)({
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
  const statement = (0, import_derived_wallet_base.createStructuredMessageStatement)(structuredMessage);
  return createSiweEnvelope({ ...rest, statement });
}
function createSiweEnvelopeForAptosTransaction(input) {
  const { rawTransaction, ...rest } = input;
  const statement = (0, import_derived_wallet_base.createTransactionStatement)(rawTransaction);
  return createSiweEnvelope({ ...rest, statement });
}

// src/EIP1193DerivedSignature.ts
var import_ts_sdk2 = require("@aptos-labs/ts-sdk");
var _EIP1193DerivedSignature = class _EIP1193DerivedSignature extends import_ts_sdk2.Signature {
  constructor(siweSignature, chainId, issuedAt) {
    super();
    this._siweSignature = import_ts_sdk2.Hex.fromHexInput(siweSignature).toUint8Array();
    if (this._siweSignature.length !== _EIP1193DerivedSignature.LENGTH) {
      throw new Error("Expected signature length to be 65 bytes");
    }
    this.chainId = chainId;
    this.issuedAt = issuedAt;
  }
  get siweSignature() {
    return import_ts_sdk2.Hex.fromHexInput(this._siweSignature).toString();
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
var EIP1193DerivedPublicKey = class _EIP1193DerivedPublicKey extends import_ts_sdk3.AccountPublicKey {
  constructor({ domain, ethereumAddress, authenticationFunction }) {
    super();
    this.domain = domain;
    this.ethereumAddress = ethereumAddress;
    this.authenticationFunction = authenticationFunction;
    const utf8EncodedDomain = new TextEncoder().encode(domain);
    const ethereumAddressBytes = import_ts_sdk3.Hex.fromHexInput(ethereumAddress).toUint8Array();
    const serializer = new import_ts_sdk3.Serializer();
    serializer.serializeBytes(utf8EncodedDomain);
    serializer.serializeBytes(ethereumAddressBytes);
    const accountIdentifier = (0, import_ts_sdk3.hashValues)([serializer.toUint8Array()]);
    this._authKey = (0, import_derived_wallet_base2.computeDerivableAuthenticationKey)(
      authenticationFunction,
      ethereumAddress,
      domain
    );
  }
  authKey() {
    return this._authKey;
  }
  verifySignature({ message, signature }) {
    const parsedSigningMessage = (0, import_derived_wallet_base2.parseAptosSigningMessage)(message);
    if (!parsedSigningMessage || !(signature instanceof EIP1193DerivedSignature)) {
      return false;
    }
    const { chainId, issuedAt, siweSignature } = signature;
    const signingMessageDigest = (0, import_ts_sdk3.hashValues)([message]);
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
    const recoveredAddress = (0, import_ethers.verifyMessage)(siweMessage, siweSignature);
    return recoveredAddress === this.ethereumAddress;
  }
  async verifySignatureAsync(args) {
    return this.verifySignature({ message: args.message, signature: args.signature });
  }
  // region Serialization
  serialize(serializer) {
    serializer.serializeStr(this.domain);
    serializer.serializeFixedBytes(import_ts_sdk3.Hex.fromHexInput(this.ethereumAddress).toUint8Array());
    serializer.serializeStr(this.authenticationFunction);
  }
  static deserialize(deserializer) {
    const domain = deserializer.deserializeStr();
    const ethereumAddressBytes = deserializer.deserializeFixedBytes(20);
    const ethereumAddress = import_ts_sdk3.Hex.fromHexInput(ethereumAddressBytes).toString();
    const authenticationFunction = deserializer.deserializeStr();
    return new _EIP1193DerivedPublicKey({ domain, ethereumAddress, authenticationFunction });
  }
  // endregion
};

// src/EIP1193DerivedWallet.ts
var import_derived_wallet_base6 = require("@aptos-labs/derived-wallet-base");
var import_ts_sdk6 = require("@aptos-labs/ts-sdk");
var import_wallet_standard = require("@aptos-labs/wallet-standard");
var import_ethers5 = require("ethers");

// src/shared.ts
var import_derived_wallet_base3 = require("@aptos-labs/derived-wallet-base");
var import_ethers2 = require("ethers");
async function wrapEthersUserResponse(promise) {
  try {
    const response = await promise;
    return (0, import_derived_wallet_base3.makeUserApproval)(response);
  } catch (err) {
    if ((0, import_ethers2.isError)(err, "ACTION_REJECTED")) {
      return (0, import_derived_wallet_base3.makeUserRejection)();
    }
    throw err;
  }
}

// src/signAptosMessage.ts
var import_derived_wallet_base4 = require("@aptos-labs/derived-wallet-base");
var import_ts_sdk4 = require("@aptos-labs/ts-sdk");
var import_ethers3 = require("ethers");
async function signAptosMessageWithEthereum(input) {
  const { authenticationFunction, messageInput } = input;
  const eip1193Provider = input.eip1193Provider instanceof import_ethers3.BrowserProvider ? input.eip1193Provider : new import_ethers3.BrowserProvider(input.eip1193Provider);
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
  const signingMessage = (0, import_derived_wallet_base4.encodeStructuredMessage)(structuredMessage);
  const signingMessageDigest = (0, import_ts_sdk4.hashValues)([signingMessage]);
  const issuedAt = /* @__PURE__ */ new Date();
  const siweMessage = createSiweEnvelopeForAptosStructuredMessage({
    ethereumAddress,
    chainId,
    structuredMessage,
    signingMessageDigest,
    issuedAt
  });
  const response = await wrapEthersUserResponse(ethereumAccount.signMessage(siweMessage));
  return (0, import_derived_wallet_base4.mapUserResponse)(response, (siweSignature) => {
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
var import_derived_wallet_base5 = require("@aptos-labs/derived-wallet-base");
var import_ts_sdk5 = require("@aptos-labs/ts-sdk");
var import_ethers4 = require("ethers");
async function signAptosTransactionWithEthereum(input) {
  const { authenticationFunction, rawTransaction } = input;
  const eip1193Provider = input.eip1193Provider instanceof import_ethers4.BrowserProvider ? input.eip1193Provider : new import_ethers4.BrowserProvider(input.eip1193Provider);
  const accounts = await eip1193Provider.listAccounts();
  const ethereumAccount = input.ethereumAddress ? accounts.find((account) => account.address === input.ethereumAddress) : accounts[0];
  if (!ethereumAccount) {
    throw new Error("Account not connected");
  }
  const ethereumAddress = ethereumAccount.address;
  const signingMessage = (0, import_ts_sdk5.generateSigningMessageForTransaction)(rawTransaction);
  const signingMessageDigest = (0, import_ts_sdk5.hashValues)([signingMessage]);
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
  return (0, import_derived_wallet_base5.mapUserResponse)(response, (siweSignature) => {
    const signature = new EIP1193DerivedSignature(siweSignature, chainId, issuedAt);
    const authenticator = signature.bcsToBytes();
    return new import_ts_sdk5.AccountAuthenticatorAbstraction(
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
    this.chains = import_wallet_standard.APTOS_CHAINS;
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
      defaultNetwork = import_ts_sdk6.Network.MAINNET
    } = options;
    this.eip1193Provider = provider;
    this.eip1193Ethers = new import_ethers5.BrowserProvider(provider);
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
    return (0, import_derived_wallet_base6.mapUserResponse)(response, (account) => {
      const publicKey = this.derivePublicKey(account.address);
      const aptosAddress = publicKey.authKey().derivedAddress();
      return new import_wallet_standard.AccountInfo({ publicKey, address: aptosAddress });
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
    return new import_wallet_standard.AccountInfo({ publicKey, address: aptosAddress });
  }
  onActiveAccountChange(callback) {
    if ((0, import_derived_wallet_base6.isNullCallback)(callback)) {
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
        const account = new import_wallet_standard.AccountInfo({ publicKey, address: aptosAddress });
        callback(account);
      };
      this.onAccountsChangedListeners.push(listener);
      this.eip1193Provider.on("accountsChanged", listener);
    }
  }
  async getActiveNetwork() {
    const chainId = import_ts_sdk6.NetworkToChainId[this.defaultNetwork];
    const url = import_ts_sdk6.NetworkToNodeAPI[this.defaultNetwork];
    return {
      name: this.defaultNetwork,
      chainId,
      url
    };
  }
  async changeNetwork(newNetwork) {
    const { name, chainId, url } = newNetwork;
    if (name === import_ts_sdk6.Network.CUSTOM) {
      throw new Error("Custom network not currently supported");
    }
    this.defaultNetwork = name;
    for (const listener of this.onActiveNetworkChangeListeners) {
      listener({
        name,
        chainId: chainId ?? import_ts_sdk6.NetworkToChainId[name],
        url: url ?? import_ts_sdk6.NetworkToNodeAPI[name]
      });
    }
    return {
      status: import_wallet_standard.UserResponseStatus.APPROVED,
      args: { success: true }
    };
  }
  onActiveNetworkChange(callback) {
    if ((0, import_derived_wallet_base6.isNullCallback)(callback)) {
      this.onActiveNetworkChangeListeners = [];
    } else {
      this.onActiveNetworkChangeListeners.push(callback);
    }
  }
  // endregion
  // region Signatures
  async signMessage(input) {
    const chainId = this.defaultNetwork === import_ts_sdk6.Network.DEVNET ? await (0, import_derived_wallet_base6.fetchDevnetChainId)() : import_ts_sdk6.NetworkToChainId[this.defaultNetwork];
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
var import_app = require("@wallet-standard/app");
var import_mipd = require("mipd");
function setupAutomaticEthereumWalletDerivation(options = {}) {
  const walletsApi = (0, import_app.getWallets)();
  const eip6963Store = (0, import_mipd.createStore)();
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EIP1193DerivedPublicKey,
  EIP1193DerivedSignature,
  EIP1193DerivedWallet,
  setupAutomaticEthereumWalletDerivation,
  wrapEthersUserResponse
});
//# sourceMappingURL=index.js.map