import StickerClientFactory from 'lib/stickers-client';
import decryptManifest from 'lib/decrypt-manifest.browser';

export * from 'etc/types';

const {
  getStickerPackManifest,
  getStickerInPack,
  getEmojiForSticker
} = StickerClientFactory({
  decryptManifest,
  base64Encoder: btoa
});

export {
  getStickerPackManifest,
  getStickerInPack,
  getEmojiForSticker
};
