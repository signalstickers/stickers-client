// ===== Crypto Utilities ======================================================

/**
 * This module contains various functions that aid in the decryption of sticker
 * pack data from Signal. Browser detection for browser support of the
 * SubtleCrypto API should probably be added at some point.
 *
 * TODO: This module, along with signal.ts, should be refactored-out into a
 * separate NPM package with separate browser/Node imports, which will allow us
 * to make this code a bit cleaner. For now, this let's us use a consistent API
 * for both environments.
 *
 * See: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto
 */
import crypto from 'crypto';
import hkdf from 'js-crypto-hkdf';


/**
 * [private]
 *
 * See: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey
 */
async function deriveKeys(encodedKey: string) {
  const hash = 'SHA-256';
  const length = 512;
  const salt = new ArrayBuffer(32);
  const info = 'Sticker Pack';

  const masterKey = Buffer.from(encodedKey, 'hex');
  const derivedKey = (await hkdf.compute(masterKey, hash, length, info, salt as Uint8Array)).key;
  return [derivedKey.slice(0, 32), derivedKey.slice(32, 64)];
}


/**
 * Decrypts a manifest returned from the Signal API using a sticker pack's
 * pack key, provided from stickers.yml.
 */
export default async function decryptManifest(encodedKey: string, rawManifest: any) {
  const [aesKey, hmacKey] = await deriveKeys(encodedKey);

  const theirIv = rawManifest.slice(0, 16);
  const cipherTextBody = rawManifest.slice(16, rawManifest.length - 32);
  const theirMac = rawManifest.slice(rawManifest.byteLength - 32, rawManifest.byteLength).toString('hex');
  const combinedCipherText = rawManifest.slice(0, rawManifest.byteLength - 32);


  const computedMac = crypto.createHmac('sha256', hmacKey as any).update(combinedCipherText).digest('hex');

  if (theirMac !== computedMac) {
    throw new Error('MAC verification failed.');
  }

  const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey as any, theirIv);

  return Buffer.concat([decipher.update(cipherTextBody), decipher.final()]);
}
