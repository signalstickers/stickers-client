// ===== Signal Stickers Client ================================================

/**
 * This module exports a factory function with several methods that can be used
 * to query the Signal API for sticker packs.
 */
import axios from 'axios';
import protobuf from 'protobufjs';
import StickersProto from 'etc/stickers-proto';
import {StickerPackManifest, StickerPackClient, StickerPackClientOptions} from 'etc/types';


/**
 * Provided a StickerClientOptions object, returns a StickerClient.
 *
 * This is implemented as a factory function so that we can inject the correct
 * cryptography library for the browser or Node.
 */
export default function StickerPackClientFactory({decryptManifest}: StickerPackClientOptions): StickerPackClient {
  // ----- Members -------------------------------------------------------------

  /**
   * [private]
   *
   * gRPC type definition for Signal's sticker pack manifests.
   */
  const packMessage = protobuf.Root.fromJSON(StickersProto).root.lookupType('Pack');


  /**
   * @private
   *
   * In-memory cache of sticker pack manifests. Helps us avoid making un-necessary
   * network requests.
   */
  const stickerPackManifestCache = new Map<string, Promise<StickerPackManifest>>();


  /**
   * @private
   *
   * In-memory cache of sticker image data. Helps us avoid making un-necessary
   * network requests.
   */
  const stickerImageCache = new Map<string, Promise<Uint8Array>>();


  // ----- Methods -------------------------------------------------------------

  /**
   * @private
   *
   * Provided a key and an encrypted manifest from the Signal API, resolves with
   * a decrypted and parsed manifest.
   */
  async function parseManifest(key: string, rawManifest: any): Promise<StickerPackManifest> {
    try {
      const manifest = await decryptManifest(key, rawManifest);
      const manifestData = new Uint8Array(manifest, 0, manifest.byteLength);
      return packMessage.decode(manifestData) as unknown as StickerPackManifest;
    } catch (err) {
      const newErr = new Error(`[parseManifest] ${err.stack}`);
      err.code = 'MANIFEST_PARSE';
      throw newErr;
    }
  }


  /**
   * Provided a sticker pack ID and key, queries the Signal API and resolves
   * with a sticker pack manifest.
   */
  async function getStickerPackManifest(id: string, key: string): Promise<StickerPackManifest> {
    if (!stickerPackManifestCache.has(id)) {
      stickerPackManifestCache.set(id, new Promise(async (resolve, reject) => {
        try {
          const res = await axios({
            method: 'GET',
            responseType: 'arraybuffer',
            url: `https://cdn-ca.signal.org/stickers/${id}/manifest.proto`
          });

          const manifest = await parseManifest(key, res.data);

          resolve(manifest);
        } catch (err) {
          reject(err);
        }
      }));
    }

    return stickerPackManifestCache.get(id) as Promise<StickerPackManifest>;
  }


  /**
   * Provided a sticker pack ID, its key, and a sticker ID, queries the Signal
   * API and resolves with the raw WebP image data for the indicated sticker.
   *
   * An optional `encoding` parameter may be provided to indicate the desired
   * return type. The default value of `raw` will return raw WebP data as a
   * Uint8 Array. This is useful if further processing of the image data is
   * necessary. Alternatively, if this is set to `base64`, a data-URI string
   * will be returned instead. This string can be used directly as "src"
   * attribute in an <img> tag, for example.
   */
  async function getStickerInPack(id: string, key: string, stickerId: number, encoding?: 'raw'): Promise<Uint8Array>;
  async function getStickerInPack(id: string, key: string, stickerId: number, encoding?: 'base64'): Promise<string>;
  async function getStickerInPack(id: string, key: string, stickerId: number, encoding: 'raw' | 'base64' = 'raw') {
    const cacheKey = `${id}-${stickerId}`;

    if (!stickerImageCache.has(cacheKey)) {
      stickerImageCache.set(cacheKey, new Promise(async (resolve, reject) => {
        try {
          const res = await axios({
            method: 'GET',
            responseType: 'arraybuffer',
            url: `https://cdn-ca.signal.org/stickers/${id}/full/${stickerId}`
          });

          const stickerManifest = await decryptManifest(key, res.data);
          const rawWebpData = new Uint8Array(stickerManifest, 0, stickerManifest.byteLength);

          resolve(rawWebpData);
        } catch (err) {
          reject(err);
        }
      }));
    }

    const rawImageData = await stickerImageCache.get(cacheKey);

    if (encoding === 'raw') {
      return rawImageData;
    }

    const base64Data = btoa(String.fromCharCode.apply(undefined, rawImageData));
    return `data:image/webp;base64,${base64Data}`;
  }


  /**
   * Provided a sticker pack ID, key, and sticker ID, returns the emoji
   * associated with the sticker.
   */
  async function getEmojiForSticker(id: string, key: string, stickerId: number): Promise<string> {
    const packManifest = await getStickerPackManifest(id, key);

    const sticker = packManifest.stickers.find(curSticker => curSticker.id === stickerId);

    if (!sticker) {
      throw new Error(`Sticker pack ${id} has no sticker with ID ${stickerId}.`);
    }

    return sticker.emoji;
  }


  return {
    getStickerPackManifest,
    getStickerInPack,
    getEmojiForSticker
  };
}
