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
  ADDRESS_DOMAIN_SEPARATOR: () => ADDRESS_DOMAIN_SEPARATOR,
  DerivableAbstractPublicKey: () => DerivableAbstractPublicKey,
  accountInfoFromPublicKey: () => accountInfoFromPublicKey,
  computeDerivableAuthenticationKey: () => computeDerivableAuthenticationKey,
  createStructuredMessageStatement: () => createStructuredMessageStatement,
  createTransactionStatement: () => createTransactionStatement,
  decodeStructuredMessage: () => decodeStructuredMessage,
  encodeStructuredMessage: () => encodeStructuredMessage,
  fetchDevnetChainId: () => fetchDevnetChainId,
  getEntryFunctionName: () => getEntryFunctionName,
  isNullCallback: () => isNullCallback,
  makeUserApproval: () => makeUserApproval,
  makeUserRejection: () => makeUserRejection,
  mapUserResponse: () => mapUserResponse,
  parseAptosSigningMessage: () => parseAptosSigningMessage,
  parseRawTransaction: () => parseRawTransaction,
  structuredMessagePrefix: () => structuredMessagePrefix
});
module.exports = __toCommonJS(index_exports);

// src/abstraction.ts
var import_ts_sdk = require("@aptos-labs/ts-sdk");
var ADDRESS_DOMAIN_SEPARATOR = 5;
function computeDerivableAuthenticationKey(functionInfo, identity, domain) {
  try {
    if (!(0, import_ts_sdk.isValidFunctionInfo)(functionInfo)) {
      throw new Error(`Invalid authentication function ${functionInfo}`);
    }
    const [moduleAddress, moduleName, functionName] = functionInfo.split("::");
    const serializer = new import_ts_sdk.Serializer();
    import_ts_sdk.AccountAddress.fromString(moduleAddress).serialize(serializer);
    serializer.serializeStr(moduleName);
    serializer.serializeStr(functionName);
    const s2 = new import_ts_sdk.Serializer();
    const abstractPublicKey = new DerivableAbstractPublicKey(identity, domain);
    s2.serializeBytes(abstractPublicKey.bcsToBytes());
    const domainSeparator = new Uint8Array([ADDRESS_DOMAIN_SEPARATOR]);
    const data = (0, import_ts_sdk.hashValues)([
      serializer.toUint8Array(),
      s2.toUint8Array(),
      domainSeparator
    ]);
    return new import_ts_sdk.AuthenticationKey({ data });
  } catch (e) {
    throw `Error computing domain authentication key: ${e}`;
  }
}
var DerivableAbstractPublicKey = class _DerivableAbstractPublicKey extends import_ts_sdk.Serializable {
  constructor(identity, domain) {
    super();
    this.identity = identity;
    this.domain = domain;
  }
  serialize(serializer) {
    serializer.serializeStr(this.identity);
    serializer.serializeStr(this.domain);
  }
  static deserialize(deserializer) {
    const identity = deserializer.deserializeStr();
    const domain = deserializer.deserializeStr();
    return new _DerivableAbstractPublicKey(identity, domain);
  }
};

// src/envelope.ts
var import_ts_sdk2 = require("@aptos-labs/ts-sdk");
function getChainName(chainId) {
  for (const [network, otherChainId] of Object.entries(import_ts_sdk2.NetworkToChainId)) {
    if (otherChainId === chainId) {
      return network;
    }
  }
  return `custom network: ${chainId}`;
}
function getEntryFunctionName(payload) {
  if (!(payload instanceof import_ts_sdk2.TransactionPayloadEntryFunction)) {
    return void 0;
  }
  const moduleAddress = payload.entryFunction.module_name.address.toString();
  const moduleName = payload.entryFunction.module_name.name.identifier;
  const functionName = payload.entryFunction.function_name.identifier;
  return `${moduleAddress}::${moduleName}::${functionName}`;
}
function createStructuredMessageStatement({ message, chainId }) {
  const escapedMessage = message.replaceAll("\n", "\\n");
  const onAptosChainSuffix = chainId ? ` (${getChainName(chainId)})` : "";
  const onAptosChain = ` on Aptos blockchain${onAptosChainSuffix}`;
  return `To sign the following message${onAptosChain}: ${escapedMessage}`;
}
function createTransactionStatement(rawTransaction) {
  const entryFunctionName = getEntryFunctionName(rawTransaction.rawTransaction.payload);
  const humanReadableEntryFunction = entryFunctionName ? ` ${entryFunctionName}` : "";
  const chainId = rawTransaction.rawTransaction.chain_id.chainId;
  const chainName = getChainName(chainId);
  const onAptosChain = ` on Aptos blockchain (${chainName})`;
  return `Please confirm you explicitly initiated this request from ${window.location.host}. You are approving to execute transaction${humanReadableEntryFunction}${onAptosChain}.`;
}

// src/parseAptosSigningMessage.ts
var import_ts_sdk3 = require("@aptos-labs/ts-sdk");

// src/StructuredMessage.ts
var structuredMessagePrefix = "APTOS";
function encodeStructuredMessage(structuredMessage) {
  const { address, application, chainId, message, nonce } = structuredMessage;
  const optionalParts = [];
  if (address !== void 0) {
    optionalParts.push(`address: ${address}`);
  }
  if (application !== void 0) {
    optionalParts.push(`application: ${application}`);
  }
  if (chainId !== void 0) {
    optionalParts.push(`chainId: ${chainId}`);
  }
  const parts = [
    structuredMessagePrefix,
    ...optionalParts,
    `message: ${message}`,
    `nonce: ${nonce}`
  ];
  const input = parts.join("\n");
  return new TextEncoder().encode(input);
}
function parsePart(part, name) {
  const partPrefix = `${name}: `;
  return part.startsWith(partPrefix) ? part.slice(partPrefix.length) : void 0;
}
function decodeStructuredMessage(encoded) {
  const utf8Decoded = new TextDecoder().decode(encoded);
  const [prefix, ...parts] = utf8Decoded.split("\n");
  if (prefix !== structuredMessagePrefix) {
    throw new Error("Invalid message prefix");
  }
  let i = 0;
  const address = parsePart(parts[i], "address");
  if (address !== void 0) {
    i += 1;
  }
  const application = parsePart(parts[i], "application");
  if (application !== void 0) {
    i += 1;
  }
  const chainIdStr = parsePart(parts[i], "chainId");
  if (chainIdStr !== void 0) {
    i += 1;
  }
  const nonce = parsePart(parts[parts.length - 1], "nonce");
  if (!nonce) {
    throw new Error("Expected nonce");
  }
  const messageParts = parts.slice(i, parts.length - 1).join("\n");
  const message = parsePart(messageParts, "message");
  if (!message) {
    throw new Error("Expected message");
  }
  return {
    address,
    application,
    chainId: chainIdStr ? Number(chainIdStr) : void 0,
    message,
    nonce
  };
}

// src/parseAptosSigningMessage.ts
function bufferStartsWith(buffer, search) {
  return buffer.slice(0, search.length) === search;
}
var transactionSigningMessagePrefix = (0, import_ts_sdk3.hashValues)([import_ts_sdk3.RAW_TRANSACTION_SALT]);
var transactionWithDataSigningMessagePrefix = (0, import_ts_sdk3.hashValues)([import_ts_sdk3.RAW_TRANSACTION_WITH_DATA_SALT]);
function parseRawTransaction(message) {
  if (bufferStartsWith(message, transactionSigningMessagePrefix)) {
    const serialized = message.slice(transactionSigningMessagePrefix.length);
    const deserializer = new import_ts_sdk3.Deserializer(serialized);
    return import_ts_sdk3.RawTransaction.deserialize(deserializer);
  } else if (bufferStartsWith(message, transactionWithDataSigningMessagePrefix)) {
    const serialized = message.slice(transactionWithDataSigningMessagePrefix.length);
    const deserializer = new import_ts_sdk3.Deserializer(serialized);
    return import_ts_sdk3.RawTransactionWithData.deserialize(deserializer);
  }
  return void 0;
}
function parseAptosSigningMessage(message) {
  const messageBytes = import_ts_sdk3.Hex.fromHexInput(message).toUint8Array();
  const parsedRawTransaction = parseRawTransaction(messageBytes);
  if (parsedRawTransaction) {
    let rawTransaction;
    if (parsedRawTransaction instanceof import_ts_sdk3.RawTransaction) {
      rawTransaction = new import_ts_sdk3.SimpleTransaction(parsedRawTransaction);
    } else if (parsedRawTransaction instanceof import_ts_sdk3.MultiAgentRawTransaction) {
      rawTransaction = new import_ts_sdk3.MultiAgentTransaction(
        parsedRawTransaction.raw_txn,
        parsedRawTransaction.secondary_signer_addresses
      );
    } else if (parsedRawTransaction instanceof import_ts_sdk3.FeePayerRawTransaction) {
      const { raw_txn, secondary_signer_addresses, fee_payer_address } = parsedRawTransaction;
      rawTransaction = secondary_signer_addresses.length > 0 ? new import_ts_sdk3.MultiAgentTransaction(raw_txn, secondary_signer_addresses, fee_payer_address) : new import_ts_sdk3.SimpleTransaction(raw_txn, fee_payer_address);
    } else {
      throw new Error("Unsupported raw transaction");
    }
    return {
      type: "transaction",
      rawTransaction
    };
  }
  try {
    const structuredMessage = decodeStructuredMessage(messageBytes);
    return {
      type: "structuredMessage",
      structuredMessage
    };
  } catch (err) {
    return void 0;
  }
}

// src/UserResponse.ts
var import_wallet_standard = require("@aptos-labs/wallet-standard");
function makeUserApproval(args) {
  return {
    status: import_wallet_standard.UserResponseStatus.APPROVED,
    args
  };
}
function makeUserRejection() {
  return { status: import_wallet_standard.UserResponseStatus.REJECTED };
}
function mapUserResponse(response, mapFn) {
  if (response.status === import_wallet_standard.UserResponseStatus.REJECTED) {
    return makeUserRejection();
  }
  const mappedResponse = mapFn(response.args);
  return mappedResponse instanceof Promise ? mappedResponse.then((args) => makeUserApproval(args)) : makeUserApproval(mappedResponse);
}

// src/utils.ts
var import_ts_sdk4 = require("@aptos-labs/ts-sdk");
var import_wallet_standard2 = require("@aptos-labs/wallet-standard");
function accountInfoFromPublicKey(publicKey) {
  return new import_wallet_standard2.AccountInfo({
    publicKey,
    address: publicKey.authKey().derivedAddress()
  });
}
function isNullCallback(callback) {
  return "_isNull" in callback && callback._isNull === true;
}
var fetchDevnetChainId = async () => {
  const aptos = new import_ts_sdk4.Aptos();
  return await aptos.getChainId();
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ADDRESS_DOMAIN_SEPARATOR,
  DerivableAbstractPublicKey,
  accountInfoFromPublicKey,
  computeDerivableAuthenticationKey,
  createStructuredMessageStatement,
  createTransactionStatement,
  decodeStructuredMessage,
  encodeStructuredMessage,
  fetchDevnetChainId,
  getEntryFunctionName,
  isNullCallback,
  makeUserApproval,
  makeUserRejection,
  mapUserResponse,
  parseAptosSigningMessage,
  parseRawTransaction,
  structuredMessagePrefix
});
//# sourceMappingURL=index.js.map