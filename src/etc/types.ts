// ----- Signal API Responses --------------------------------------------------

/**
 * Shape of an individual sticker in a sticker pack manifest response.
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
