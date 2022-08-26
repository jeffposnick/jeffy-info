/// <reference lib="webworker"/>
declare const self: ServiceWorkerGlobalScope;

import {BASE64_URL_CHARACTER_CLASS} from 'remove-filename-hash';
import {BroadcastUpdatePlugin} from 'workbox-broadcast-update';
import {CacheFirst, StaleWhileRevalidate} from 'workbox-strategies';

import {registerRoutes, StaticLoader} from './shared/common';
import {
  HASH_CHARS,
  HASHED_STATIC_CACHE_NAME,
  STATIC_CACHE_NAME,
} from '../shared/constants';
import {revisionedAssetsPlugin} from './shared/revisionedAssetsPlugin';

const hashedURLPattern = new RegExp(
  `/${BASE64_URL_CHARACTER_CLASS}{${HASH_CHARS}}~`,
);

self.addEventListener('install', () => {
  self.skipWaiting();
});

// Use a s-w-r strategy, along with broadcasting updates, to load static JSON
// assets inside of streaming HTML response generation.
const swrStrategy = new StaleWhileRevalidate({
  cacheName: STATIC_CACHE_NAME,
  plugins: [new BroadcastUpdatePlugin()],
});

// Anything with a hash in its URL can be safely loaded cache-first.
const cacheFirstStrategy = new CacheFirst({
  cacheName: HASHED_STATIC_CACHE_NAME,
  plugins: [revisionedAssetsPlugin],
});

const loadStatic: StaticLoader = async (event, urlOverride) => {
  const url = urlOverride || event.request.url;

  if (hashedURLPattern.test(url)) {
    return await cacheFirstStrategy.handle({
      event,
      request: url,
    });
  }

  return await swrStrategy.handle({
    event,
    request: url,
  });
};

registerRoutes(loadStatic);
