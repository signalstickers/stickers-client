/**
 * @jest-environment jsdom
 */
import axios, {AxiosRequestConfig} from 'axios';
import {v4 as uuid} from 'uuid';

import {
  getStickerPackManifest,
  getStickerInPack,
  getEmojiForSticker
} from '../index';

import decryptManifest from 'lib/decrypt-manifest.node';

jest.mock('axios', () => {
  return jest.fn(async (requestConfig: AxiosRequestConfig) => {
    if (requestConfig.url?.match(/manifest\.proto/g)) {
      return Promise.resolve({data: '___RAW_MANIFEST___'});
    }

    if (requestConfig.url?.match(/\/full\//g)) {
      return Promise.resolve({data: '___RAW_STICKER_DATA___'});
    }

    return Promise.reject();
  });
});

jest.mock('lib/decrypt-manifest.node', () => {
  return jest.fn((decodeKey: string, rawManifest: string) => {
    return '___DECRYPTED_MANIFEST___';
  });
});

describe('Stickers Client (Node)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStickerPackManifest', () => {
    const PACK_ID = uuid();
    const PACK_KEY = uuid();

    it('should query Signal and use the platform-specific decryptManifest implementation', async () => {
      const result = await getStickerPackManifest(PACK_ID, PACK_KEY);

      expect(axios).toHaveBeenCalledWith({
        method: 'GET',
        responseType: 'arraybuffer',
        url: `https://cdn-ca.signal.org/stickers/${PACK_ID}/manifest.proto`,
      });

      expect(decryptManifest).toHaveBeenCalledWith(PACK_KEY, '___RAW_MANIFEST___');

      expect(result).toEqual({stickers: []});
    });

    it('should cache results based on provided parameters', async () => {
      await getStickerPackManifest(PACK_ID, PACK_KEY);
      expect(axios).not.toHaveBeenCalled();

      await getStickerPackManifest(PACK_ID, '___NEW_PACK_KEY___');
      expect(axios).toHaveBeenCalledTimes(1);

      await getStickerPackManifest('___OTHER_PACK_ID___', PACK_KEY);
      expect(axios).toHaveBeenCalledTimes(2);
    });
  });

  describe('getStickerInPack', () => {
    const PACK_ID = uuid();
    const PACK_KEY = uuid();
    const STICKER_ID = 42;

    it('should query Signal and use the platform-specific decryptManifest implementation', async () => {
      const result = await getStickerInPack(PACK_ID, PACK_KEY, STICKER_ID, 'raw');

      expect(axios).toHaveBeenCalledWith({
        method: 'GET',
        responseType: 'arraybuffer',
        url: `https://cdn-ca.signal.org/stickers/${PACK_ID}/full/${STICKER_ID}`
      });

      expect(decryptManifest).toHaveBeenCalledWith(PACK_KEY, '___RAW_STICKER_DATA___');

      expect(result instanceof Uint8Array).toBe(true);
    });

    it('should cache results based on provided parameters', async () => {
      await getStickerInPack(PACK_ID, PACK_KEY, STICKER_ID);
      expect(axios).not.toHaveBeenCalled();

      await getStickerInPack('___OTHER_PACK_ID___', PACK_KEY, STICKER_ID);
      expect(axios).toHaveBeenCalledTimes(1);

      await getStickerInPack(PACK_ID, '___OTHER_PACK_KEY___', STICKER_ID);
      expect(axios).toHaveBeenCalledTimes(2);

      await getStickerInPack(PACK_ID, PACK_KEY, 1);
      expect(axios).toHaveBeenCalledTimes(3);
    });
  });

  describe('getEmojiForSticker', () => {
    const PACK_ID = uuid();
    const PACK_KEY = uuid();
    const STICKER_ID = 42;

    it('should query Signal', async () => {
      try {
        await getEmojiForSticker(PACK_ID, PACK_KEY, STICKER_ID);
      } catch (err) {
        // We're going to encounter an error here because we're returning an
        // empty sticker pack.
        expect(err.message).toMatch(`Sticker pack ${PACK_ID} has no sticker with ID ${STICKER_ID}.`);
      }

      expect(axios).toHaveBeenCalledWith({
        method: 'GET',
        responseType: 'arraybuffer',
        url: `https://cdn-ca.signal.org/stickers/${PACK_ID}/manifest.proto`
      });
    });
  });
});
