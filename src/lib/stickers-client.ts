// ===== Signal Stickers Client ================================================

/**
 * This module exports a factory function with several methods that can be used
 * to query the Signal API for sticker packs.
 */
import axios from 'axios';
import protobuf from 'protobufjs';
import StickersProto from 'etc/stickers-proto';
import {StickerPackManifest} from 'etc/types';


/**
 * Options object accepted by StickersClientFactory.
 */
export interface StickersClientOptions {
  decryptManifest(key: string, encryptedManifest: string): Promise<any>;
  base64Encoder(input: string): string;
}


/**
 * Object returned by StickersClientFactory.
 */
export interface StickersClient {
  /**
   * Provided a sticker pack ID and key, queries the Signal API and resolves
   * with a sticker pack manifest.
   */
  getStickerPackManifest(id: string, key: string): Promise<StickerPackManifest>;

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
  getStickerInPack(id: string, key: string, stickerId: number, encoding?: 'raw'): Promise<Uint8Array>;
  getStickerInPack(id: string, key: string, stickerId: number, encoding: 'base64'): Promise<string>;

  /**
   * Provided a sticker pack ID, key, and sticker ID, returns the emoji
   * associated with the sticker.
   */
  getEmojiForSticker(id: string, key: string, stickerId: number): Promise<string>;
}


/**
 * Provided a StickersClientOptions object, returns a StickersClient.
 *
 * The options for this factory constitute functionality that diverges between
 * Node and the browser, and is provided by each entrypoint accordingly.
 */
export default function StickersClientFactory(options: StickersClientOptions): StickersClient {
  const {decryptManifest, base64Encoder} = options;


  // ----- Private Members -----------------------------------------------------

  /**
   * @private
   *
   * gRPC type definition for Signal's sticker pack manifests.
   */
  const packMessage = protobuf.Root.fromJSON(StickersProto).root.lookupType('Pack');


  /**
   * @private
   *
   * In-memory cache of sticker pack manifests. Helps us avoid making
   * un-necessary network requests.
   */
  const stickerPackManifestCache = new Map<string, Promise<StickerPackManifest>>();


  /**
   * @private
   *
   * In-memory cache of sticker image data. Helps us avoid making un-necessary
   * network requests.
   */
  const stickerImageCache = new Map<string, Promise<Uint8Array>>();


  // ----- Private Methods -----------------------------------------------------

  /**
   * @private
   *
   * Provided a key and an encrypted manifest from the Signal API, resolves with
   * a decrypted and parsed manifest.
   */
  const parseManifest = async (key: string, rawManifest: any): Promise<StickerPackManifest> => {
    try {
      const manifest = await decryptManifest(key, rawManifest);
      const manifestData = new Uint8Array(manifest, 0, manifest.byteLength);
      return packMessage.decode(manifestData) as unknown as StickerPackManifest;
    } catch (err) {
      const newErr = new Error(`[parseManifest] ${err.stack}`);
      err.code = 'MANIFEST_PARSE';
      throw newErr;
    }
  };


  // ----- Public Methods ------------------------------------------------------

  const getStickerPackManifest: StickersClient['getStickerPackManifest'] = async (id, key) => {
    const cacheKey = `${id}-${key}`;

    if (!stickerPackManifestCache.has(cacheKey)) {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      stickerPackManifestCache.set(cacheKey, new Promise(async (resolve, reject) => {
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

    return stickerPackManifestCache.get(cacheKey) as Promise<StickerPackManifest>;
  };

  // N.B. We need to explicitly type this function's signature because it has
  // overloads in the StickersClient definition.
  const getStickerInPack: StickersClient['getStickerInPack'] = async (
    id: string,
    key: string,
    stickerId: number,
    encoding: 'raw' | 'base64' = 'raw'
  ): Promise<any> => {
    const cacheKey = `${id}-${key}-${stickerId}`;

    if (!stickerImageCache.has(cacheKey)) {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
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

    const rawImageData = await stickerImageCache.get(cacheKey) as Uint8Array;

    if (encoding === 'raw') {
      return rawImageData;
    }

    const base64Data = base64Encoder(String.fromCharCode(...rawImageData));
    return `data:image/webp;base64,${base64Data}`;
  };

  const getEmojiForSticker: StickersClient['getEmojiForSticker'] = async (id, key, stickerId) => {
    const packManifest = await getStickerPackManifest(id, key);

    const sticker = packManifest.stickers.find(curSticker => curSticker.id === stickerId);

    if (!sticker) {
      throw new Error(`Sticker pack ${id} has no sticker with ID ${stickerId}.`);
    }

    return sticker.emoji;
  };


  return {
    getStickerPackManifest,
    getStickerInPack,
    getEmojiForSticker
  };
}
