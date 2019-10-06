import {CacheFirst, NetworkOnly} from 'workbox-strategies';
import {cacheNames} from 'workbox-core';
import {cleanupOutdatedCaches, getCacheKeyForURL, precacheAndRoute} from 'workbox-precaching';
import {ExpirationPlugin} from 'workbox-expiration';
import {initialize as initializeOfflineAnalytics} from 'workbox-google-analytics';
import {registerRoute, setCatchHandler} from 'workbox-routing';
import {skipWaiting} from 'workbox-core';
import nunjucks from 'nunjucks/browser/nunjucks';

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

const CacheStorageLoader = nunjucks.Loader.extend({
  async: true,

  getSource: async function(name, callback) {
    try {
      const path = `/_posts/_includes/${name}`;
      const cachedResponse = await caches.match(
        getCacheKeyForURL(path), {
          cacheName: cacheNames.precache,
        }
      );
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

let _site;
async function initSiteData() {
  if (!_site) {
    const siteDataResponse = await caches.match(
      getCacheKeyForURL('/_posts/_data/site.json'), {
        cacheName: cacheNames.precache,
      }
    );
    _site = await siteDataResponse.json();
  }

  return _site;
}

const postHandler = async ({params}) => {
  const site = await initSiteData();

  // params[3] corresponds to post.fileSlug in 11ty.
  const cachedResponse = await caches.match(
    getCacheKeyForURL(`/_posts/${params[3]}.json`), {
      cacheName: cacheNames.precache,
    }
  );

  const context = await cachedResponse.json();
  context.site = site;
  context.content = context.html;

  const html = await new Promise((resolve, reject) => {
    nunjucksEnv.render(
      context.layout,
      context,
      (error, html) => {
        if (error) {
          return reject(error);
        }
        return resolve(html);
      }
    );
  }); 

  const headers = {
    'content-type': 'text/html',
  };
  return new Response(html, {headers});
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
