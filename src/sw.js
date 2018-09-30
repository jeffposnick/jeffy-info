importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.6.2/workbox-sw.js');
importScripts('https://mozilla.github.io/nunjucks/files/nunjucks.min.js');

workbox.precaching.precacheAndRoute([]);

const CacheStorageLoader = nunjucks.Loader.extend({
  async: true,

  getSource: async function(name, callback) {
    try {
      const path = `_includes/${name}`;
      const cachedResponse = await caches.match(path, {
        cacheName: workbox.core.cacheNames.precache,
      });
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

const postRegExp = new RegExp('/(\\d{4})/(\\d{2})/(\\d{2})/(.+)\\.html');

let _site;
async function initSiteData() {
  if (!_site) {
    const siteDataResponse = await caches.match('_data/site.json', {
      cacheName: workbox.core.cacheNames.precache,
    });
    _site = await siteDataResponse.json();
  }

  return _site;
}

const postHandler = async ({params}) => {
  const site = await initSiteData();

  const cachedResponse = await caches.match(`/${params.join('-')}.json`, {
    cacheName: workbox.core.cacheNames.precache,
  });
  const json = await cachedResponse.json();

  const context = {
    site,
    page: json,
    content: json.html,
  };

  const html = await new Promise((resolve, reject) => {
    nunjucksEnv.render(
      json.layout,
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

workbox.routing.registerRoute(postRegExp, postHandler);

workbox.routing.registerRoute(
  new RegExp('/assets/images/'),
  workbox.strategies.cacheFirst({
    cacheName: 'images',
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 20,
      }),
    ],
  })
);

workbox.googleAnalytics.initialize();

workbox.skipWaiting();
