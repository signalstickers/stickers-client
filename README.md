<a href="#top" id="top">
  <img src="https://user-images.githubusercontent.com/441546/104589390-a6a87e80-561e-11eb-9bd1-278d46d48b74.png" style="max-width: 100%;"></<img>
</a>
<p align="center">
  <a href="https://www.npmjs.com/package/@signalstickers/stickers-client"><img src="https://img.shields.io/npm/v/@signalstickers/stickers-client.svg?style=flat-square"></a>
  <a href="https://github.com/signalstickers/stickers-client/actions"><img src="https://img.shields.io/endpoint.svg?url=https%3A%2F%2Factions-badge.atrox.dev%2Fsignalstickers%2Fstickers-client%2Fbadge%3Fref%3Dmaster&style=flat-square&label=build&logo=none"></a>
  <a href="https://david-dm.org/signalstickers/stickers-client"><img src="https://img.shields.io/david/signalstickers/stickers-client.svg?style=flat-square"></a>
  <a href="https://conventionalcommits.org"><img src="https://img.shields.io/badge/conventional%20commits-1.0.0-027dc6.svg?style=flat-square"></a>
</p>

## Rationale

Communicating with Signal's Sticker API can be somewhat non-trivial because it uses encrypted
[protocol buffers](https://en.wikipedia.org/wiki/Protocol_Buffers). Raw responses must be decrypted
using some rather esoteric cryptography, resulting in a high-friction experience for the average
developer. This package aims to make using the Stickers API as straightforward as possible by providing
a small set of utility functions that work in both the browser and Node.

## Install

```
npm i @signalstickers/stickers-client
```

## Use

It is assumed that users of this package have a general understanding of how stickers work in Signal.
For more information on that topic, see [this article](https://support.signal.org/hc/en-us/articles/360031836512-Stickers).

This package can be used in both browser and Node. If you plan to use it in the browser, make sure you
are using a bundler that supports the [`browser` `package.json` field](https://github.com/defunctzombie/package-browser-field-spec).

Because sticker packs in Signal are [immutable](https://en.wikipedia.org/wiki/Immutable_object),
a response from Signal (be it for a sticker pack or an individual sticker) can be safely cached
indefinitely. As such, this package implements a basic in-memory cache. This means your application can
invoke these functions without any consideration for performance, and the library will ensure that no
superfluous network requests are made.

### API

This package has the following named exports:

```ts
async getStickerPackManifest(
  id: string,
  key: string
) => Promise<StickerPackManifest>
```

Provided a sticker pack ID and its key, returns a promise that resolves with the sticker pack's
decrypted manifest.

<a href="#top"><img src="https://user-images.githubusercontent.com/441546/72722991-8988bf00-3b34-11ea-8fff-b9b1dfaa0a53.png"></a>

```ts
async getStickerInPack(
  id: string,
  key: string,
  stickerId: number,
  encoding? = 'raw' | 'base64'
) => Promise<Uint8Array | string>
```

Provided a sticker pack ID, its key, and a sticker ID, returns a promise that resolves with the raw WebP
image data for the indicated sticker.

An optional `encoding` parameter may be provided to indicate the desired return type. The default value
of `raw` will return raw WebP data as a `Uint8` Array. This is useful if further processing of the image
data is necessary. Alternatively, if `base64` is provided, a data-URI `string` will be returned instead.
This string can be used directly as the `src` attribute in an `<img>` tag, for example.

<a href="#top"><img src="https://user-images.githubusercontent.com/441546/72722991-8988bf00-3b34-11ea-8fff-b9b1dfaa0a53.png"></a>

```ts
async getEmojiForSticker(
  id: string,
  key: string,
  stickerId: number
) => Promise<string>
```

Provided a sticker pack ID, its key, and sticker ID, returns the emoji associated with the sticker.

### Example

In this example, we'll create a simple React component that will render a single sticker. It will accept
a sticker pack's ID and key as well as the ID of the sticker to render as props. We will use a one-time
effect when the component mounts to fetch the image.

Note that this package caches responses from Signal, so we don't need to add any additional logic to
store the result of `getStickerInPack` outside the component's state. If it is ever dismounted and
remounted in the future with the same props, no additional network requests will be made.

```tsx
import React from 'react';
import { getStickerInPack, getEmojiForSticker } from '@signalstickers/stickers-client';

export interface Props {
  packId: string;
  packKey: string;
  stickerId: number;
}

const Sticker: React.FunctionComponent<Props> = ({ packId, packKey, stickerId }) => {
  const [stickerData, setStickerData] = React.useState();
  const [stickerEmoji, setStickerEmoji] = React.useState();

  React.useEffect(() => {
    getStickerInPack(packId, packKey, stickerId, 'base64').then(setStickerData);
    getEmojiForSticker(packId, packKey, stickerId).then(setStickerEmoji);
  }, []);

  if (!stickerData || !stickerEmoji) {
    return null;
  }

  return (
    <img src={stickerData} alt={stickerEmoji} />
  );
};

export default Sticker;
```

This component could then be used thusly:

```tsx
import Sticker from './Sticker';


export default () => {
  // This will render an image tag containing the indicated sticker.
  return (
    <Sticker
      packId="7be8291c4007cc73868818992596cc24"
      packKey="ca808607b39f0f1d860a8460128d3ba4022fb0536ddadf58f7e8ff8ac7ddaf56"
      stickerId={1}
    >
  )
}
```
