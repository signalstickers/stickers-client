import StickerClientFactory from 'lib/stickers-client';
import decryptManifest from 'lib/decrypt-manifest.node';

export * from 'etc/types';

const {
  getStickerPackManifest,
  getStickerInPack,
  getEmojiForSticker
} = StickerClientFactory({
  decryptManifest,
  base64Encoder: input => Buffer.from(input).toString('base64')
});

export {
  getStickerPackManifest,
  getStickerInPack,
  getEmojiForSticker
};
