import StickerClientFactory from 'lib/stickers-client';
import decryptManifest from 'lib/decrypt-manifest.node';

export * from 'etc/types';
export default StickerClientFactory({decryptManifest});
