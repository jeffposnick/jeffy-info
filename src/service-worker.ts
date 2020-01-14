declare const self: ServiceWorkerGlobalScope;

import {CacheFirst, StaleWhileRevalidate} from 'workbox-strategies';
import {ExpirationPlugin} from 'workbox-expiration';
import {initialize as initializeOfflineAnalytics} from 'workbox-google-analytics';
import {registerRoute, NavigationRoute} from 'workbox-routing';
import {skipWaiting} from 'workbox-core';

const navigationRoute = new NavigationRoute(
  new StaleWhileRevalidate({
    cacheName: 'html-pages',
  })
);
registerRoute(navigationRoute);

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
