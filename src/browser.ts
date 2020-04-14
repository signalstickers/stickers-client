import StickerClientFactory from 'lib/stickers-client';
import decryptManifest from 'lib/decrypt-manifest.browser';

/**
 * Create the exports we will use for the browser client by passing the browser
 * implementation of decryptManifest and the browser's native btoa base-64
 * encoding function to StickerClientFactory.
 */
const {
  getStickerPackManifest,
  getStickerInPack,
  getEmojiForSticker
} = StickerClientFactory({
  decryptManifest,
  base64Encoder: btoa
});

// Re-export all types.
export * from 'etc/types';

export {
  getStickerPackManifest,
  getStickerInPack,
  getEmojiForSticker
};
