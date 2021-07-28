/// <reference lib="webworker"/>

import {
  getAssetFromKV,
  mapRequestToAsset,
  NotFoundError,
} from '@cloudflare/kv-asset-handler';

import {registerRoutes, StaticLoader} from './shared/common';

// self.location is referenced a few places in Workbox, but it's not required
// to be set to anything meaningful for this use case.
if (!('location' in self)) {
  Object.defineProperty(self, 'location', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: {
      hostname: 'example.com',
      href: 'https://example.com/',
      origin: 'https://example.com',
    },
  });
}

const loadStatic: StaticLoader = async (event, urlOverride) => {
  const options = urlOverride
    ? {
        mapRequestToAsset: (request: Request) => {
          const absoluteURLString = new URL(urlOverride, request.url).href;
          return mapRequestToAsset(new Request(absoluteURLString, request));
        },
      }
    : {};

  try {
    return await getAssetFromKV(event, options);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return new Response('', {
        status: 404,
        statusText: 'Not Found',
      });
    }
    throw err;
  }
};

registerRoutes(loadStatic);
