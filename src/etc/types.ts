// ----- Signal API Responses --------------------------------------------------

/**
 * Shape of an individual sticker in a sticker pack response.
 */
export interface Sticker {
  id: number;
  emoji: string;
}


/**
 * Response from the Signal CDN when requesting a sticker pack.
 */
export interface StickerPackManifest {
  /**
   * Title of the sticker pack.
   */
  title: string;

  /**
   * Author of the sticker pack.
   */
  author: string;

  /**
   * Sticker that serves as the cover/primary sticker for the sticker pack.
   */
  cover: Sticker;

  /**
   * List of all stickers in the sticker pack.
   */
  stickers: Array<Sticker>;
}


// ----- Sticker Pack Client ---------------------------------------------------

/**
 * Options object accepted by StickerClientFactory.
 */
export interface StickerPackClientOptions {
  decryptManifest(key: string, encryptedManifest: string): Promise<any>;
  base64Encoder(input: string): string;
}

export interface StickerPackClient {
  /**
   * Provided a sticker pack ID and key, queries the Signal API and resolves
   * with a sticker pack manifest.
   */
  getStickerPackManifest(id: string, key: string): Promise<StickerPackManifest>;

  /**
   * Provided a sticker pack ID and a sticker ID (or 'cover' for the pack's
   * cover sticker) queries the Signal API and resolves with the raw WebP image
   * data for the indicated sticker.
   *
   * Note: Web users who want to use this data to render an image will need to
   * prefix this string with "data:image/webp;base64,".
   */
  getStickerInPack(id: string, key: string, stickerId: number): Promise<Uint8Array>;

  /**
   * Provided a sticker pack ID, key, and sticker ID, returns the emoji
   * associated with the sticker.
   */
  getEmojiForSticker(id: string, key: string, stickerId: number): Promise<string>;
}
