import StickersClientFactory from 'lib/stickers-client';
import decryptManifest from 'lib/decrypt-manifest.browser';

/**
 * Create the exports we will use for the browser client by passing the browser
 * implementation of decryptManifest and the browser's native btoa base-64
 * encoding function to StickersClientFactory.
 */
const {
  getStickerPackManifest,
  getStickerInPack,
  getEmojiForSticker
} = StickersClientFactory({
  decryptManifest,
  base64Encoder: btoa
});

export {
  getStickerPackManifest,
  getStickerInPack,
  getEmojiForSticker
};
