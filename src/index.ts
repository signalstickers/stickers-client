import StickerClientFactory from 'lib/stickers-client';
import decryptManifest from 'lib/decrypt-manifest.node';

export * from 'etc/types';

const {
  getStickerPackManifest,
  getStickerInPack,
  getEmojiForSticker
} = StickerClientFactory({decryptManifest});

export {
  getStickerPackManifest,
  getStickerInPack,
  getEmojiForSticker
};
