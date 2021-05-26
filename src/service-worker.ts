declare const self: ServiceWorkerGlobalScope;

import {indexOfflineContent} from './content-indexing';
import {PostStrategy} from './PostStrategy';

import {CacheFirst, NetworkOnly} from 'workbox-strategies';
import {cleanupOutdatedCaches, precacheAndRoute} from 'workbox-precaching';
import {ExpirationPlugin} from 'workbox-expiration';
import {initialize as initializeOfflineAnalytics} from 'workbox-google-analytics';
import {registerRoute, setCatchHandler} from 'workbox-routing';
import {setCacheNameDetails, skipWaiting} from 'workbox-core';
import {URLPattern} from 'urlpattern-polyfill';

setCacheNameDetails({precache: 'precache-bug-fix'});
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

registerRoute(
  ({request}) => new URLPattern({
    pathname: '/(\d{4})/(\d{2})/(\d{2})/:slug.html',
  }).exec(request.url),
  new PostStrategy()
);

registerRoute(
  ({request}) => new URLPattern({
    pathname: '/assets/images/(.*)',
  }).exec(request.url),
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
      }),
    ],
  })
);

// If anything goes wrong when handling a route, return the network response.
setCatchHandler(new NetworkOnly());

initializeOfflineAnalytics();

skipWaiting();

if ('index' in self.registration) {
  // Our service worker caches all pages on installation; add those pages to the
  // content index in an activate handler, after installation is complete.
  self.addEventListener('activate', (event) => {
    event.waitUntil(indexOfflineContent());
  });
}
