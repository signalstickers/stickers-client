import axios, {AxiosRequestConfig} from 'axios';
import {v4 as uuid} from 'uuid';

import StickersClientFactory, {StickersClient} from './stickers-client';


jest.mock('axios', () => jest.fn(async (requestConfig: AxiosRequestConfig) => {
  if (requestConfig.url?.match(/manifest\.proto/g)) {
    return Promise.resolve({data: '___RAW_MANIFEST___'});
  }

  if (requestConfig.url?.match(/\/full\//g)) {
    return Promise.resolve({data: '___RAW_STICKER_DATA___'});
  }

  return Promise.reject();
}));


describe('Stickers Client (Node)', () => {
  const decryptManifest = jest.fn(async () => '___DECRYPTED_MANIFEST___');
  let client: StickersClient;

  beforeEach(() => {
    client = StickersClientFactory({
      decryptManifest,
      base64Encoder:  input => Buffer.from(input).toString('base64')
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStickerPackManifest', () => {
    const PACK_ID = uuid();
    const PACK_KEY = uuid();

    it('should query Signal and use the platform-specific decryptManifest implementation', async () => {
      const result = await client.getStickerPackManifest(PACK_ID, PACK_KEY);

      expect(axios).toHaveBeenCalledWith({
        method: 'GET',
        responseType: 'arraybuffer',
        url: `https://cdn-ca.signal.org/stickers/${PACK_ID}/manifest.proto`
      });

      expect(decryptManifest).toHaveBeenCalledWith(PACK_KEY, '___RAW_MANIFEST___');

      expect(result).toEqual({stickers: []});
    });

    it('should cache results based on provided parameters', async () => {
      expect(axios).not.toHaveBeenCalled();

      await client.getStickerPackManifest(PACK_ID, PACK_KEY);
      expect(axios).toHaveBeenCalledTimes(1);

      await client.getStickerPackManifest(PACK_ID, '___NEW_PACK_KEY___');
      expect(axios).toHaveBeenCalledTimes(2);

      await client.getStickerPackManifest('___OTHER_PACK_ID___', PACK_KEY);
      expect(axios).toHaveBeenCalledTimes(3);
    });
  });

  describe('getStickerInPack', () => {
    const PACK_ID = uuid();
    const PACK_KEY = uuid();
    const STICKER_ID = 42;

    it('should query Signal and use the platform-specific decryptManifest implementation', async () => {
      const result = await client.getStickerInPack(PACK_ID, PACK_KEY, STICKER_ID, 'raw');

      expect(axios).toHaveBeenCalledWith({
        method: 'GET',
        responseType: 'arraybuffer',
        url: `https://cdn-ca.signal.org/stickers/${PACK_ID}/full/${STICKER_ID}`
      });

      expect(decryptManifest).toHaveBeenCalledWith(PACK_KEY, '___RAW_STICKER_DATA___');

      expect(result instanceof Uint8Array).toBe(true);
    });

    it('should cache results based on provided parameters', async () => {
      expect(axios).not.toHaveBeenCalled();

      await client.getStickerInPack(PACK_ID, PACK_KEY, STICKER_ID);
      expect(axios).toHaveBeenCalledTimes(1);

      await client.getStickerInPack(PACK_ID, PACK_KEY, STICKER_ID);
      expect(axios).toHaveBeenCalledTimes(1);

      await client.getStickerInPack('___OTHER_PACK_ID___', PACK_KEY, STICKER_ID);
      expect(axios).toHaveBeenCalledTimes(2);

      await client.getStickerInPack(PACK_ID, '___OTHER_PACK_KEY___', STICKER_ID);
      expect(axios).toHaveBeenCalledTimes(3);

      await client.getStickerInPack(PACK_ID, PACK_KEY, 1);
      expect(axios).toHaveBeenCalledTimes(4);
    });
  });

  describe('getEmojiForSticker', () => {
    const PACK_ID = uuid();
    const PACK_KEY = uuid();
    const STICKER_ID = 42;

    it('should query Signal', async () => {
      try {
        await client.getEmojiForSticker(PACK_ID, PACK_KEY, STICKER_ID);
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
