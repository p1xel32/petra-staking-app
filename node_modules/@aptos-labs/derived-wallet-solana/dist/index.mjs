// src/setupAutomaticDerivation.ts
import {
  isWalletAdapterCompatibleStandardWallet
} from "@solana/wallet-adapter-base";
import { StandardWalletAdapter } from "@solana/wallet-standard-wallet-adapter-base";
import { getWallets } from "@wallet-standard/app";

// src/SolanaDerivedWallet.ts
import { accountInfoFromPublicKey, fetchDevnetChainId, isNullCallback } from "@aptos-labs/derived-wallet-base";
import {
  Network,
  NetworkToChainId,
  NetworkToNodeAPI
} from "@aptos-labs/ts-sdk";
import {
  APTOS_CHAINS,
  UserResponseStatus
} from "@aptos-labs/wallet-standard";

// src/shared.ts
import { makeUserApproval, makeUserRejection } from "@aptos-labs/derived-wallet-base";
import { WalletError } from "@solana/wallet-adapter-base";
var defaultAuthenticationFunction = "0x1::solana_derivable_account::authenticate";
async function wrapSolanaUserResponse(promise) {
  try {
    const response = await promise;
    return makeUserApproval(response);
  } catch (err) {
    if (err instanceof WalletError && err.message === "User rejected the request.") {
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
import { Ed25519Signature as Ed25519Signature2, hashValues as hashValues2 } from "@aptos-labs/ts-sdk";

// src/createSiwsEnvelope.ts
import {
  createStructuredMessageStatement,
  createTransactionStatement
} from "@aptos-labs/derived-wallet-base";
import { Hex } from "@aptos-labs/ts-sdk";
function createSiwsEnvelope(input) {
  const { solanaPublicKey, signingMessageDigest, statement, domain } = input;
  const digestHex = Hex.fromHexInput(signingMessageDigest).toString();
  return {
    address: solanaPublicKey.toString(),
    domain,
    nonce: digestHex,
    statement
  };
}
function createSiwsEnvelopeForAptosStructuredMessage(input) {
  const { structuredMessage, ...rest } = input;
  const statement = createStructuredMessageStatement(structuredMessage);
  return createSiwsEnvelope({ ...rest, statement });
}
function createSiwsEnvelopeForAptosTransaction(input) {
  const { rawTransaction, ...rest } = input;
  const statement = createTransactionStatement(rawTransaction);
  return createSiwsEnvelope({ ...rest, statement });
}

// src/SolanaDerivedPublicKey.ts
import { computeDerivableAuthenticationKey, parseAptosSigningMessage } from "@aptos-labs/derived-wallet-base";
import {
  AccountPublicKey,
  Ed25519PublicKey,
  Ed25519Signature,
  hashValues
} from "@aptos-labs/ts-sdk";
import { createSignInMessage as createSolanaSignInMessage } from "@solana/wallet-standard-util";
import { PublicKey as SolanaPublicKey } from "@solana/web3.js";
var SolanaDerivedPublicKey = class _SolanaDerivedPublicKey extends AccountPublicKey {
  constructor(params) {
    super();
    const { domain, solanaPublicKey, authenticationFunction } = params;
    this.domain = domain;
    this.solanaPublicKey = solanaPublicKey;
    this.authenticationFunction = authenticationFunction;
    this._authKey = computeDerivableAuthenticationKey(
      authenticationFunction,
      solanaPublicKey.toBase58(),
      domain
    );
  }
  authKey() {
    return this._authKey;
  }
  verifySignature({ message, signature }) {
    const parsedSigningMessage = parseAptosSigningMessage(message);
    if (!parsedSigningMessage || !(signature instanceof Ed25519Signature)) {
      return false;
    }
    const commonInput = {
      solanaPublicKey: this.solanaPublicKey,
      signingMessageDigest: hashValues([message])
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
    const siwsEnvelopeBytes = createSolanaSignInMessage(siwsEnvelopeInput);
    const ed25519PublicKey = new Ed25519PublicKey(this.solanaPublicKey.toBytes());
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
    const solanaPublicKey = new SolanaPublicKey(solanaPublicKeyBytes);
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
  const signingMessage = encodeStructuredMessage(structuredMessage);
  const signingMessageDigest = hashValues2([signingMessage]);
  const siwsInput = createSiwsEnvelopeForAptosStructuredMessage({
    solanaPublicKey: aptosPublicKey.solanaPublicKey,
    structuredMessage,
    signingMessageDigest,
    domain
  });
  const response = await wrapSolanaUserResponse(solanaWallet.signIn(siwsInput));
  return mapUserResponse(response, (output) => {
    if (output.signatureType && output.signatureType !== "ed25519") {
      throw new Error("Unsupported signature type");
    }
    const signature = new Ed25519Signature2(output.signature);
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
import { createSignInMessage } from "@solana/wallet-standard-util";
import { mapUserResponse as mapUserResponse2, DerivableAbstractPublicKey } from "@aptos-labs/derived-wallet-base";
import {
  AccountAuthenticatorAbstraction,
  Ed25519Signature as Ed25519Signature3,
  generateSigningMessageForTransaction,
  hashValues as hashValues3,
  Serializer as Serializer2
} from "@aptos-labs/ts-sdk";
var SIGNATURE_TYPE = 0;
async function signAptosTransactionWithSolana(input) {
  const { solanaWallet, authenticationFunction, rawTransaction, domain } = input;
  const solanaPublicKey = solanaWallet.publicKey;
  if (!solanaPublicKey) {
    throw new Error("Account not connected");
  }
  const signingMessage = generateSigningMessageForTransaction(rawTransaction);
  const signingMessageDigest = hashValues3([signingMessage]);
  const siwsInput = createSiwsEnvelopeForAptosTransaction({
    solanaPublicKey,
    rawTransaction,
    signingMessageDigest,
    domain
  });
  if (solanaWallet.signIn) {
    const response = await wrapSolanaUserResponse(solanaWallet.signIn(siwsInput));
    return mapUserResponse2(response, (output) => {
      if (output.signatureType && output.signatureType !== "ed25519") {
        throw new Error("Unsupported signature type");
      }
      const signature = new Ed25519Signature3(output.signature);
      return createAccountAuthenticatorForSolanaTransaction(signature, solanaPublicKey, domain, authenticationFunction, signingMessageDigest);
    });
  } else if (solanaWallet.signMessage) {
    const response = await wrapSolanaUserResponse(solanaWallet.signMessage(createSignInMessage(siwsInput)));
    return mapUserResponse2(response, (output) => {
      const signature = new Ed25519Signature3(output);
      return createAccountAuthenticatorForSolanaTransaction(signature, solanaPublicKey, domain, authenticationFunction, signingMessageDigest);
    });
  } else {
    throw new Error(`${solanaWallet.name} does not support SIWS or signMessage`);
  }
}
function createAccountAuthenticatorForSolanaTransaction(signature, solanaPublicKey, domain, authenticationFunction, signingMessageDigest) {
  const serializer = new Serializer2();
  serializer.serializeU8(SIGNATURE_TYPE);
  serializer.serializeBytes(signature.toUint8Array());
  const abstractSignature = serializer.toUint8Array();
  const abstractPublicKey = new DerivableAbstractPublicKey(solanaPublicKey.toBase58(), domain);
  return new AccountAuthenticatorAbstraction(
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
    // endregion
    // region Networks
    this.onActiveNetworkChangeListeners = /* @__PURE__ */ new Set();
    const {
      authenticationFunction = defaultAuthenticationFunction,
      defaultNetwork = Network.MAINNET
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
      return { status: UserResponseStatus.REJECTED };
    }
    const aptosPublicKey = this.derivePublicKey(this.solanaWallet.publicKey);
    return {
      args: accountInfoFromPublicKey(aptosPublicKey),
      status: UserResponseStatus.APPROVED
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
    return accountInfoFromPublicKey(aptosPublicKey);
  }
  onActiveAccountChange(callback) {
    if (isNullCallback(callback)) {
      this.solanaWallet.off("connect");
    } else {
      this.solanaWallet.on("connect", (newSolanaPublicKey) => {
        const aptosPublicKey = this.derivePublicKey(newSolanaPublicKey);
        const newAptosAccount = accountInfoFromPublicKey(aptosPublicKey);
        callback(newAptosAccount);
      });
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
      this.onActiveNetworkChangeListeners.clear();
    } else {
      this.onActiveNetworkChangeListeners.add(callback);
    }
  }
  // endregion
  // region Signatures
  async signMessage(input) {
    const chainId = input.chainId ? this.defaultNetwork === Network.DEVNET ? await fetchDevnetChainId() : NetworkToChainId[this.defaultNetwork] : void 0;
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
  const api = getWallets();
  let registrations = {};
  const isWhitelisted = (wallet) => {
    return true;
  };
  const deriveAndRegisterWallet = (wallet) => {
    const adapter = new StandardWalletAdapter({ wallet });
    const derivedWallet = new SolanaDerivedWallet(adapter, options);
    registrations[wallet.name] = api.register(derivedWallet);
  };
  for (const wallet of api.get()) {
    if (isWalletAdapterCompatibleStandardWallet(wallet) && isWhitelisted(wallet)) {
      deriveAndRegisterWallet(wallet);
    }
  }
  const offRegister = api.on("register", (wallet) => {
    if (isWalletAdapterCompatibleStandardWallet(wallet) && isWhitelisted(wallet)) {
      deriveAndRegisterWallet(wallet);
    }
  });
  const offUnregister = api.on("unregister", (wallet) => {
    if (isWalletAdapterCompatibleStandardWallet(wallet)) {
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
export {
  SIGNATURE_TYPE,
  SolanaDerivedPublicKey,
  SolanaDerivedWallet,
  setupAutomaticSolanaWalletDerivation,
  signAptosMessageWithSolana,
  signAptosTransactionWithSolana
};
//# sourceMappingURL=index.mjs.map