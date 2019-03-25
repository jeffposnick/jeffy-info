importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.1.1/workbox-sw.js');
importScripts('https://cdn.jsdelivr.net/npm/nunjucks@3.2.0/browser/nunjucks.min.js');

workbox.precaching.precacheAndRoute([]);
workbox.precaching.cleanupOutdatedCaches();

const CacheStorageLoader = nunjucks.Loader.extend({
  async: true,

  getSource: async function(name, callback) {
    try {
      const path = `/_posts/_includes/${name}`;
      const cachedResponse = await caches.match(
        workbox.precaching.getCacheKeyForURL(path), {
          cacheName: workbox.core.cacheNames.precache,
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
      workbox.precaching.getCacheKeyForURL('/_posts/_data/site.json'), {
        cacheName: workbox.core.cacheNames.precache,
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
    workbox.precaching.getCacheKeyForURL(`/_posts/${params[3]}.json`), {
      cacheName: workbox.core.cacheNames.precache,
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

workbox.routing.registerRoute(
  new RegExp('/(\\d{4})/(\\d{2})/(\\d{2})/(.+)\\.html'),
  postHandler
);

workbox.routing.registerRoute(
  new RegExp('/assets/images/'),
  new workbox.strategies.CacheFirst({
    cacheName: 'images',
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 20,
      }),
    ],
  })
);

workbox.routing.registerRoute(
  new RegExp('https://storage\\.googleapis\\.com/workbox-cdn/releases/.+/workbox-window\\.prod\\.mjs'),
  new workbox.strategies.CacheFirst()
);

// If anything goes wrong when handling a route, return the network response.
workbox.routing.setCatchHandler(new workbox.strategies.NetworkOnly());

workbox.googleAnalytics.initialize();

workbox.core.skipWaiting();
