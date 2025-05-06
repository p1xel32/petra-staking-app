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
  SIGNATURE_TYPE: () => SIGNATURE_TYPE,
  SolanaDerivedPublicKey: () => SolanaDerivedPublicKey,
  SolanaDerivedWallet: () => SolanaDerivedWallet,
  setupAutomaticSolanaWalletDerivation: () => setupAutomaticSolanaWalletDerivation,
  signAptosMessageWithSolana: () => signAptosMessageWithSolana,
  signAptosTransactionWithSolana: () => signAptosTransactionWithSolana
});
module.exports = __toCommonJS(index_exports);

// src/setupAutomaticDerivation.ts
var import_wallet_adapter_base2 = require("@solana/wallet-adapter-base");
var import_wallet_standard_wallet_adapter_base = require("@solana/wallet-standard-wallet-adapter-base");
var import_app = require("@wallet-standard/app");

// src/SolanaDerivedWallet.ts
var import_derived_wallet_base6 = require("@aptos-labs/derived-wallet-base");
var import_ts_sdk5 = require("@aptos-labs/ts-sdk");
var import_wallet_standard = require("@aptos-labs/wallet-standard");

// src/shared.ts
var import_derived_wallet_base = require("@aptos-labs/derived-wallet-base");
var import_wallet_adapter_base = require("@solana/wallet-adapter-base");
var defaultAuthenticationFunction = "0x1::solana_derivable_account::authenticate";
async function wrapSolanaUserResponse(promise) {
  try {
    const response = await promise;
    return (0, import_derived_wallet_base.makeUserApproval)(response);
  } catch (err) {
    if (err instanceof import_wallet_adapter_base.WalletError && err.message === "User rejected the request.") {
      return (0, import_derived_wallet_base.makeUserRejection)();
    }
    throw err;
  }
}

// src/signAptosMessage.ts
var import_derived_wallet_base4 = require("@aptos-labs/derived-wallet-base");
var import_ts_sdk3 = require("@aptos-labs/ts-sdk");

// src/createSiwsEnvelope.ts
var import_derived_wallet_base2 = require("@aptos-labs/derived-wallet-base");
var import_ts_sdk = require("@aptos-labs/ts-sdk");
function createSiwsEnvelope(input) {
  const { solanaPublicKey, signingMessageDigest, statement, domain } = input;
  const digestHex = import_ts_sdk.Hex.fromHexInput(signingMessageDigest).toString();
  return {
    address: solanaPublicKey.toString(),
    domain,
    nonce: digestHex,
    statement
  };
}
function createSiwsEnvelopeForAptosStructuredMessage(input) {
  const { structuredMessage, ...rest } = input;
  const statement = (0, import_derived_wallet_base2.createStructuredMessageStatement)(structuredMessage);
  return createSiwsEnvelope({ ...rest, statement });
}
function createSiwsEnvelopeForAptosTransaction(input) {
  const { rawTransaction, ...rest } = input;
  const statement = (0, import_derived_wallet_base2.createTransactionStatement)(rawTransaction);
  return createSiwsEnvelope({ ...rest, statement });
}

// src/SolanaDerivedPublicKey.ts
var import_derived_wallet_base3 = require("@aptos-labs/derived-wallet-base");
var import_ts_sdk2 = require("@aptos-labs/ts-sdk");
var import_wallet_standard_util = require("@solana/wallet-standard-util");
var import_web3 = require("@solana/web3.js");
var SolanaDerivedPublicKey = class _SolanaDerivedPublicKey extends import_ts_sdk2.AccountPublicKey {
  constructor(params) {
    super();
    const { domain, solanaPublicKey, authenticationFunction } = params;
    this.domain = domain;
    this.solanaPublicKey = solanaPublicKey;
    this.authenticationFunction = authenticationFunction;
    this._authKey = (0, import_derived_wallet_base3.computeDerivableAuthenticationKey)(
      authenticationFunction,
      solanaPublicKey.toBase58(),
      domain
    );
  }
  authKey() {
    return this._authKey;
  }
  verifySignature({ message, signature }) {
    const parsedSigningMessage = (0, import_derived_wallet_base3.parseAptosSigningMessage)(message);
    if (!parsedSigningMessage || !(signature instanceof import_ts_sdk2.Ed25519Signature)) {
      return false;
    }
    const commonInput = {
      solanaPublicKey: this.solanaPublicKey,
      signingMessageDigest: (0, import_ts_sdk2.hashValues)([message])
    };
    const siwsEnvelopeInput = parsedSigningMessage.type === "structuredMessage" ? createSiwsEnvelopeForAptosStructuredMessage({
      ...parsedSigningMessage,
      ...commonInput,
      domain: this.domain
    }) : createSiwsEnvelopeForAptosTransaction({
      ...parsedSigningMessage,
      ...commonInput,
      domain: this.domain
    });
    const siwsEnvelopeBytes = (0, import_wallet_standard_util.createSignInMessage)(siwsEnvelopeInput);
    const ed25519PublicKey = new import_ts_sdk2.Ed25519PublicKey(this.solanaPublicKey.toBytes());
    return ed25519PublicKey.verifySignature({ message: siwsEnvelopeBytes, signature });
  }
  async verifySignatureAsync(args) {
    return this.verifySignature({ message: args.message, signature: args.signature });
  }
  serialize(serializer) {
    serializer.serializeStr(this.domain);
    serializer.serializeFixedBytes(this.solanaPublicKey.toBytes());
    serializer.serializeStr(this.authenticationFunction);
  }
  static deserialize(deserializer) {
    const domain = deserializer.deserializeStr();
    const solanaPublicKeyBytes = deserializer.deserializeFixedBytes(32);
    const solanaPublicKey = new import_web3.PublicKey(solanaPublicKeyBytes);
    const authenticationFunction = deserializer.deserializeStr();
    return new _SolanaDerivedPublicKey({ domain, solanaPublicKey, authenticationFunction });
  }
};

// src/signAptosMessage.ts
async function signAptosMessageWithSolana(input) {
  const { solanaWallet, authenticationFunction, messageInput, domain } = input;
  if (!solanaWallet.signIn) {
    throw new Error("solana:signIn not available");
  }
  const solanaPublicKey = solanaWallet.publicKey;
  if (!solanaPublicKey) {
    throw new Error("Account not connected");
  }
  const aptosPublicKey = new SolanaDerivedPublicKey({
    domain,
    solanaPublicKey,
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
  const signingMessageDigest = (0, import_ts_sdk3.hashValues)([signingMessage]);
  const siwsInput = createSiwsEnvelopeForAptosStructuredMessage({
    solanaPublicKey: aptosPublicKey.solanaPublicKey,
    structuredMessage,
    signingMessageDigest,
    domain
  });
  const response = await wrapSolanaUserResponse(solanaWallet.signIn(siwsInput));
  return (0, import_derived_wallet_base4.mapUserResponse)(response, (output) => {
    if (output.signatureType && output.signatureType !== "ed25519") {
      throw new Error("Unsupported signature type");
    }
    const signature = new import_ts_sdk3.Ed25519Signature(output.signature);
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
var import_wallet_standard_util2 = require("@solana/wallet-standard-util");
var import_derived_wallet_base5 = require("@aptos-labs/derived-wallet-base");
var import_ts_sdk4 = require("@aptos-labs/ts-sdk");
var SIGNATURE_TYPE = 0;
async function signAptosTransactionWithSolana(input) {
  const { solanaWallet, authenticationFunction, rawTransaction, domain } = input;
  const solanaPublicKey = solanaWallet.publicKey;
  if (!solanaPublicKey) {
    throw new Error("Account not connected");
  }
  const signingMessage = (0, import_ts_sdk4.generateSigningMessageForTransaction)(rawTransaction);
  const signingMessageDigest = (0, import_ts_sdk4.hashValues)([signingMessage]);
  const siwsInput = createSiwsEnvelopeForAptosTransaction({
    solanaPublicKey,
    rawTransaction,
    signingMessageDigest,
    domain
  });
  if (solanaWallet.signIn) {
    const response = await wrapSolanaUserResponse(solanaWallet.signIn(siwsInput));
    return (0, import_derived_wallet_base5.mapUserResponse)(response, (output) => {
      if (output.signatureType && output.signatureType !== "ed25519") {
        throw new Error("Unsupported signature type");
      }
      const signature = new import_ts_sdk4.Ed25519Signature(output.signature);
      return createAccountAuthenticatorForSolanaTransaction(signature, solanaPublicKey, domain, authenticationFunction, signingMessageDigest);
    });
  } else if (solanaWallet.signMessage) {
    const response = await wrapSolanaUserResponse(solanaWallet.signMessage((0, import_wallet_standard_util2.createSignInMessage)(siwsInput)));
    return (0, import_derived_wallet_base5.mapUserResponse)(response, (output) => {
      const signature = new import_ts_sdk4.Ed25519Signature(output);
      return createAccountAuthenticatorForSolanaTransaction(signature, solanaPublicKey, domain, authenticationFunction, signingMessageDigest);
    });
  } else {
    throw new Error(`${solanaWallet.name} does not support SIWS or signMessage`);
  }
}
function createAccountAuthenticatorForSolanaTransaction(signature, solanaPublicKey, domain, authenticationFunction, signingMessageDigest) {
  const serializer = new import_ts_sdk4.Serializer();
  serializer.serializeU8(SIGNATURE_TYPE);
  serializer.serializeBytes(signature.toUint8Array());
  const abstractSignature = serializer.toUint8Array();
  const abstractPublicKey = new import_derived_wallet_base5.DerivableAbstractPublicKey(solanaPublicKey.toBase58(), domain);
  return new import_ts_sdk4.AccountAuthenticatorAbstraction(
    authenticationFunction,
    signingMessageDigest,
    abstractSignature,
    abstractPublicKey.bcsToBytes()
  );
}

// src/SolanaDerivedWallet.ts
var SolanaDerivedWallet = class {
  constructor(solanaWallet, options = {}) {
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
    // endregion
    // region Networks
    this.onActiveNetworkChangeListeners = /* @__PURE__ */ new Set();
    const {
      authenticationFunction = defaultAuthenticationFunction,
      defaultNetwork = import_ts_sdk5.Network.MAINNET
    } = options;
    this.solanaWallet = solanaWallet;
    this.domain = window.location.host;
    this.authenticationFunction = authenticationFunction;
    this.defaultNetwork = defaultNetwork;
    this.name = `${solanaWallet.name} (Solana)`;
    this.icon = solanaWallet.icon;
    this.url = solanaWallet.url;
  }
  derivePublicKey(solanaPublicKey) {
    return new SolanaDerivedPublicKey({
      domain: this.domain,
      solanaPublicKey,
      authenticationFunction: this.authenticationFunction
    });
  }
  // region Connection
  async connect() {
    await this.solanaWallet.connect();
    if (!this.solanaWallet.publicKey) {
      return { status: import_wallet_standard.UserResponseStatus.REJECTED };
    }
    const aptosPublicKey = this.derivePublicKey(this.solanaWallet.publicKey);
    return {
      args: (0, import_derived_wallet_base6.accountInfoFromPublicKey)(aptosPublicKey),
      status: import_wallet_standard.UserResponseStatus.APPROVED
    };
  }
  async disconnect() {
    await this.solanaWallet.disconnect();
  }
  // endregion
  // region Accounts
  getActivePublicKey() {
    if (!this.solanaWallet.publicKey) {
      throw new Error("Account not connected");
    }
    return this.derivePublicKey(this.solanaWallet.publicKey);
  }
  async getActiveAccount() {
    const aptosPublicKey = this.getActivePublicKey();
    return (0, import_derived_wallet_base6.accountInfoFromPublicKey)(aptosPublicKey);
  }
  onActiveAccountChange(callback) {
    if ((0, import_derived_wallet_base6.isNullCallback)(callback)) {
      this.solanaWallet.off("connect");
    } else {
      this.solanaWallet.on("connect", (newSolanaPublicKey) => {
        const aptosPublicKey = this.derivePublicKey(newSolanaPublicKey);
        const newAptosAccount = (0, import_derived_wallet_base6.accountInfoFromPublicKey)(aptosPublicKey);
        callback(newAptosAccount);
      });
    }
  }
  async getActiveNetwork() {
    const chainId = import_ts_sdk5.NetworkToChainId[this.defaultNetwork];
    const url = import_ts_sdk5.NetworkToNodeAPI[this.defaultNetwork];
    return {
      name: this.defaultNetwork,
      chainId,
      url
    };
  }
  async changeNetwork(newNetwork) {
    const { name, chainId, url } = newNetwork;
    if (name === import_ts_sdk5.Network.CUSTOM) {
      throw new Error("Custom network not currently supported");
    }
    this.defaultNetwork = name;
    for (const listener of this.onActiveNetworkChangeListeners) {
      listener({
        name,
        chainId: chainId ?? import_ts_sdk5.NetworkToChainId[name],
        url: url ?? import_ts_sdk5.NetworkToNodeAPI[name]
      });
    }
    return {
      status: import_wallet_standard.UserResponseStatus.APPROVED,
      args: { success: true }
    };
  }
  onActiveNetworkChange(callback) {
    if ((0, import_derived_wallet_base6.isNullCallback)(callback)) {
      this.onActiveNetworkChangeListeners.clear();
    } else {
      this.onActiveNetworkChangeListeners.add(callback);
    }
  }
  // endregion
  // region Signatures
  async signMessage(input) {
    const chainId = input.chainId ? this.defaultNetwork === import_ts_sdk5.Network.DEVNET ? await (0, import_derived_wallet_base6.fetchDevnetChainId)() : import_ts_sdk5.NetworkToChainId[this.defaultNetwork] : void 0;
    return signAptosMessageWithSolana({
      solanaWallet: this.solanaWallet,
      authenticationFunction: this.authenticationFunction,
      messageInput: {
        ...input,
        chainId
      },
      domain: this.domain
    });
  }
  async signTransaction(rawTransaction, _asFeePayer) {
    return signAptosTransactionWithSolana({
      solanaWallet: this.solanaWallet,
      authenticationFunction: this.authenticationFunction,
      rawTransaction,
      domain: this.domain
    });
  }
  // endregion
};

// src/setupAutomaticDerivation.ts
function setupAutomaticSolanaWalletDerivation(options = {}) {
  const api = (0, import_app.getWallets)();
  let registrations = {};
  const isWhitelisted = (wallet) => {
    return true;
  };
  const deriveAndRegisterWallet = (wallet) => {
    const adapter = new import_wallet_standard_wallet_adapter_base.StandardWalletAdapter({ wallet });
    const derivedWallet = new SolanaDerivedWallet(adapter, options);
    registrations[wallet.name] = api.register(derivedWallet);
  };
  for (const wallet of api.get()) {
    if ((0, import_wallet_adapter_base2.isWalletAdapterCompatibleStandardWallet)(wallet) && isWhitelisted(wallet)) {
      deriveAndRegisterWallet(wallet);
    }
  }
  const offRegister = api.on("register", (wallet) => {
    if ((0, import_wallet_adapter_base2.isWalletAdapterCompatibleStandardWallet)(wallet) && isWhitelisted(wallet)) {
      deriveAndRegisterWallet(wallet);
    }
  });
  const offUnregister = api.on("unregister", (wallet) => {
    if ((0, import_wallet_adapter_base2.isWalletAdapterCompatibleStandardWallet)(wallet)) {
      const unregisterWallet = registrations[wallet.name];
      if (unregisterWallet) {
        unregisterWallet();
        delete registrations[wallet.name];
      }
    }
  });
  return () => {
    offRegister();
    offUnregister();
    for (const unregisterWallet of Object.values(registrations)) {
      unregisterWallet();
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SIGNATURE_TYPE,
  SolanaDerivedPublicKey,
  SolanaDerivedWallet,
  setupAutomaticSolanaWalletDerivation,
  signAptosMessageWithSolana,
  signAptosTransactionWithSolana
});
//# sourceMappingURL=index.js.map