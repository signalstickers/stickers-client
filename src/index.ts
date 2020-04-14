import StickerClientFactory from 'lib/stickers-client';
import decryptManifest from 'lib/decrypt-manifest.node';

/**
 * Create the exports we will use for the Node client by passing the Node
 * implementation of decryptManifest and a Node-compatible base-64 encoding
 * function to StickerClientFactory.
 */
const {
  getStickerPackManifest,
  getStickerInPack,
  getEmojiForSticker
} = StickerClientFactory({
  decryptManifest,
  base64Encoder: input => Buffer.from(input).toString('base64')
});

// Re-export all types.
export * from 'etc/types';

export {
  getStickerPackManifest,
  getStickerInPack,
  getEmojiForSticker
};
