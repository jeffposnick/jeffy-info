declare const self: ServiceWorkerGlobalScope;

import {indexOfflineContent} from './content-indexing';

import {CacheFirst, NetworkOnly} from 'workbox-strategies';
import {cleanupOutdatedCaches, matchPrecache, precacheAndRoute} from 'workbox-precaching';
import {ExpirationPlugin} from 'workbox-expiration';
import {initialize as initializeOfflineAnalytics} from 'workbox-google-analytics';
import {registerRoute, setCatchHandler} from 'workbox-routing';
import {RouteHandlerCallbackOptions} from 'workbox-core/types';
import {setCacheNameDetails, skipWaiting} from 'workbox-core';
import nunjucks from 'nunjucks/browser/nunjucks';

setCacheNameDetails({precache: 'precache-bug-fix'});
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

const CacheStorageLoader = nunjucks.Loader.extend({
  async: true,

  getSource: async function(name: string, callback: Function) {
    try {
      const path = `/_posts/_includes/${name}`;
      const cachedResponse = await matchPrecache(path);
      if (!cachedResponse) {
        throw new Error(`Unable to find precacahed response for ${path}.`);
      }
      const src = await cachedResponse.text();
      callback(null, {src, path, noCache: false});
    } catch(error) {
      callback(error);
    }
  }
});

const nunjucksEnv = new nunjucks.Environment(
  new CacheStorageLoader()
);

let _site: {string: any};
async function getSiteData() {
  if (!_site) {
    const cacheKey = '/_posts/_data/site.json';
    const siteDataResponse = await matchPrecache(cacheKey);
    if (!siteDataResponse) {
      throw new Error(`Unable to find precacahed response for ${cacheKey}.`);
    }
    _site = await siteDataResponse.json();
  }

  return _site;
}

const postHandler = async (options: RouteHandlerCallbackOptions) => {
  const {params} = options;
  if (!(params && Array.isArray(params))) {
    throw new Error(`Couldn't get parameters from router.`);
  }

  const site = await getSiteData();

  // params[3] corresponds to post.fileSlug in 11ty.
  const cacheKey = `/_posts/${params[3]}.json`;
  const cachedResponse = await matchPrecache(cacheKey);
  if (!cachedResponse) {
    throw new Error(`Unable to find precacahed response for ${cacheKey}.`);
  }

  const context = await cachedResponse.json();
  context.site = site;
  context.content = context.html;

  const renderedTemplate: string = await new Promise((resolve, reject) => {
    nunjucksEnv.render(
      context.layout,
      context,
      (error: Error | undefined, result: string) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
  });

  const headers = {
    'content-type': 'text/html',
  };
  return new Response(renderedTemplate, {headers});
};

registerRoute(
  new RegExp('/(\\d{4})/(\\d{2})/(\\d{2})/(.+)\\.html'),
  postHandler
);

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
