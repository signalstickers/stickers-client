/**
 * ===== Manifest Decryption (Browser) =========================================
 *
 * This module is responsible for decrypting protocol buffer responses from
 * Signal in the browser using the SubtleCrypto API.
 *
 * See: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto
 */


/**
 * @private
 *
 * Converts the provided string to a Uint8Array.
 */
function hexToArrayBuffer(hexString: string) {
  const result = [];
  let tmpHexString = hexString;

  while (tmpHexString.length >= 2) {
    result.push(parseInt(tmpHexString.substring(0, 2), 16));
    tmpHexString = tmpHexString.substring(2, tmpHexString.length);
  }

  return new Uint8Array(result);
}


/**
 * @private
 *
 * See: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey
 */
async function deriveKeys(encodedKey: string) {
  if (!window?.crypto?.subtle) {
    throw new Error('Environment does not support the SubtleCrypto API.');
  }

  const hash = 'SHA-256';
  const length = 512;
  const salt = new ArrayBuffer(32);
  const info = 'Sticker Pack';

  const masterKey = await window.crypto.subtle.importKey('raw', hexToArrayBuffer(encodedKey), 'HKDF', false, ['deriveKey']);

  const algorithm: HkdfParams = {
    name: 'HKDF',
    hash,
    salt,
    info: new TextEncoder().encode(info)
  };

  const derivedKeyAlgorithm = {
    name: 'HMAC',
    hash,
    length
  };

  // @ts-ignore (The typedef for the SubtleCrypto API incorrectly states that
  // we need an HkdfCtrParams object as our first param when in fact we need a
  // HkdfParams object.)
  const derivedKeys = await window.crypto.subtle.deriveKey(algorithm, masterKey, derivedKeyAlgorithm, true, ['verify']);

  const derivedKeyBytes = await window.crypto.subtle.exportKey('raw', derivedKeys);
  return [derivedKeyBytes.slice(0, 32), derivedKeyBytes.slice(32, 64)];
}


/**
 * Decrypts a manifest returned from the Signal API using a sticker pack's
 * key.
 */
export default async function decryptManifest(encodedKey: string, rawManifest: any) {
  if (!window?.crypto?.subtle) {
    throw new Error('Environment does not support the SubtleCrypto API.');
  }

  const keys = await deriveKeys(encodedKey);
  const encryptedManifest = new Uint8Array(rawManifest);
  const theirIv = encryptedManifest.slice(0, 16);
  const cipherTextBody = encryptedManifest.slice(16, encryptedManifest.byteLength - 32);
  const theirMac = encryptedManifest.slice(encryptedManifest.byteLength - 32, encryptedManifest.byteLength);
  const combinedCipherText = encryptedManifest.slice(0, encryptedManifest.byteLength - 32);
  const macKey = await window.crypto.subtle.importKey('raw', keys[1], {name: 'HMAC', hash: {name: 'SHA-256'}}, false, ['verify', 'sign']);
  const isValid = await window.crypto.subtle.verify('HMAC', macKey, theirMac, combinedCipherText);

  if (!isValid) {
    throw new Error('MAC verification failed.');
  }

  const cipherKey = await window.crypto.subtle.importKey('raw', keys[0], 'AES-CBC', false, ['decrypt']);
  return window.crypto.subtle.decrypt({name: 'AES-CBC', iv: theirIv}, cipherKey, cipherTextBody);
}
