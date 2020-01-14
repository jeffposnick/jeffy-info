declare const self: ServiceWorkerGlobalScope;

import {CacheFirst} from 'workbox-strategies';
import {precacheAndRoute} from 'workbox-precaching';
import {ExpirationPlugin} from 'workbox-expiration';
import {initialize as initializeOfflineAnalytics} from 'workbox-google-analytics';
import {registerRoute} from 'workbox-routing';
import {skipWaiting} from 'workbox-core';

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  new RegExp('/assets/images/'),
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
      }),
    ],
  })
);

initializeOfflineAnalytics();

skipWaiting();
