/// <reference lib="webworker"/>

import '@worker-tools/location-polyfill';
import { getAssetFromKV, mapRequestToAsset, NotFoundError } from '@cloudflare/kv-asset-handler';

import { registerRoutes, StaticLoader } from './common';

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
