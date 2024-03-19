<p align="center">
  <picture>
    <source
      media="(prefers-color-scheme: dark)"
      srcset="https://github.com/signalstickers/stickers-client/assets/441546/d74bbce3-5306-4c82-900f-78b8dd9bfa38"
      width="100%"
    >
    <img
      src="https://github.com/signalstickers/stickers-client/assets/441546/5d991acd-46a2-4a49-9871-d5bbe565c0c8"
      width="100%"
    >
  </picture>
</p>
<p align="center">
  <a
    href="https://www.npmjs.com/package/@signalstickers/stickers-client"
  ><img
    src="https://img.shields.io/npm/v/@signalstickers/stickers-client.svg?style=flat-square"
  ></a>
  <a
    href="https://github.com/signalstickers/stickers-client/actions?query=workflow%3Aci"
  ><img
    src="https://img.shields.io/github/actions/workflow/status/signalstickers/stickers-client/ci.yml?style=flat-square"
  ></a>
  <a
    href="https://depfu.com/repos/github/signalstickers/stickers-client"
  ><img
    src="https://img.shields.io/depfu/signalstickers/stickers-client?style=flat-square"
  ></a>
  <a
    href="https://conventionalcommits.org"
  ><img
    src="https://img.shields.io/static/v1?label=commits&message=conventional&style=flat-square&color=398AFB"
  ></a>
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
indefinitely. As such, this package implements a basic in-memory cache, so you should not need to
implement caching or memoization yourself. ✨

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

export default function Sticker({ packId, packKey, stickerId }: Props) {
  const [stickerData, setStickerData] = React.useState();
  const [stickerEmoji, setStickerEmoji] = React.useState();

  React.useEffect(() => {
    getStickerInPack(packId, packKey, stickerId, 'base64').then(setStickerData);
    getEmojiForSticker(packId, packKey, stickerId).then(setStickerEmoji);
  }, [packId, packKey, stickerId]);

  if (!stickerData || !stickerEmoji) return null;

  return (
    <img src={stickerData} alt={stickerEmoji} />
  );
};
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
