/// <reference lib="webworker"/>
declare const self: ServiceWorkerGlobalScope;

import { precache, matchPrecache } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

import { URLPatternMatcher } from './URLPatternMatcher';
import { registerRoutes, StaticLoader } from './common';

precache(self.__WB_MANIFEST || []);

self.addEventListener('install', () => {
  self.skipWaiting();
});

const loadStatic: StaticLoader = async (event, urlOverride) => {
  const url = urlOverride || (event as FetchEvent).request.url;
  const response = await matchPrecache(url);
  if (response) {
    return response;
  } else {
    const networkResponse = await fetch(url);
    return networkResponse;
  }
};

// The browser service worker doesn't precache images, so set up runtime
// caching for those.
registerRoute(
  new URLPatternMatcher({ pathname: '/*/images/*' }).matcher,
  new StaleWhileRevalidate({
    cacheName: 'images',
  }),
);

// The browser service worker doesn't precache all JSON files either.
registerRoute(
  new URLPatternMatcher({ pathname: '/*.json' }).matcher,
  new StaleWhileRevalidate({
    cacheName: 'json',
  }),
);

registerRoutes(loadStatic);
