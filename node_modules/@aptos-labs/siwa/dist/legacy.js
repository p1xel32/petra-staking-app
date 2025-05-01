import{Hex as _}from"@aptos-labs/ts-sdk";import{sha3_256 as S}from"@noble/hashes/sha3";import{sha3_256 as v}from"@noble/hashes/sha3";function n(e){let i=`${e.domain} wants you to sign in with your Aptos account:
`;i+=`${e.address}`,e.statement&&(i+=`

${e.statement}`);let s=[];if(e.uri&&s.push(`URI: ${e.uri}`),e.version&&s.push(`Version: ${e.version}`),e.nonce&&s.push(`Nonce: ${e.nonce}`),e.issuedAt&&s.push(`Issued At: ${e.issuedAt}`),e.expirationTime&&s.push(`Expiration Time: ${e.expirationTime}`),e.notBefore&&s.push(`Not Before: ${e.notBefore}`),e.requestId&&s.push(`Request ID: ${e.requestId}`),e.chainId&&s.push(`Chain ID: ${e.chainId}`),e.resources){s.push("Resources:");for(let r of e.resources)s.push(`- ${r}`)}return s.length&&(i+=`

${s.join(`
`)}`),i}var a="(?<domain>[^\\n]+?) wants you to sign in with your Aptos account:\\n",t="(?<address>[^\\n]+)(?:\\n|$)",o="(?:\\n(?<statement>[\\S\\s]*?)(?:\\n|$))??",d="(?:\\nURI: (?<uri>[^\\n]+))?",c="(?:\\nVersion: (?<version>[^\\n]+))?",u="(?:\\nNonce: (?<nonce>[^\\n]+))?",g="(?:\\nIssued At: (?<issuedAt>[^\\n]+))?",m="(?:\\nExpiration Time: (?<expirationTime>[^\\n]+))?",f="(?:\\nNot Before: (?<notBefore>[^\\n]+))?",l="(?:\\nRequest ID: (?<requestId>[^\\n]+))?",I="(?:\\nChain ID: (?<chainId>[^\\n]+))?",p="(?:\\nResources:(?<resources>(?:\\n- [^\\n]+)*))?",h=`${d}${c}${u}${g}${m}${f}${l}${I}${p}`,R=new RegExp(`^${a}${t}${o}${h}\\n*$`);var A=e=>{let i=n(e);return i+=`

Hash: ${_.fromHexInput(S(i)).toString()}`,i},V=(e,i)=>{let s=A(e);return i.message.includes(s)?i.publicKey.verifySignature(i)?{valid:!0,data:e}:{valid:!1,errors:["invalid_signature"]}:{valid:!1,errors:["invalid_full_message"]}};export{A as createLegacySignInMessage,V as verifyLegacySignIn};
//# sourceMappingURL=legacy.js.map