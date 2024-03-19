import decryptManifest from 'lib/decrypt-manifest.node';
import StickersClientFactory from 'lib/stickers-client';


/**
 * Create the exports we will use for the Node client by passing the Node
 * implementation of decryptManifest and a Node-compatible base-64 encoding
 * function to StickersClientFactory.
 */
const {
  getStickerPackManifest,
  getStickerInPack,
  getEmojiForSticker
} = StickersClientFactory({
  decryptManifest,
  base64Encoder: input => Buffer.from(input).toString('base64')
});


export {
  getStickerPackManifest,
  getStickerInPack,
  getEmojiForSticker
};


export type { StickerPackManifest } from 'etc/types';
