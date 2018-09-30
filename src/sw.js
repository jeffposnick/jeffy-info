importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.6.2/workbox-sw.js');
importScripts('https://mozilla.github.io/nunjucks/files/nunjucks.js');

const CacheStorageLoader = nunjucks.Loader.extend({
  async: true,

  getSource: async function(name, callback) {
    try {
      const cachedResponse = await caches.match(`_includes/${name}`);
      const template = await cachedResponse.text();
      callback(null, template);
    } catch(error) {
      callback(error);
    }
  }
});

const nunjucksEnv = new nunjucks.Environment(
  new CacheStorageLoader()
);

workbox.precaching.precache([]);

const postRegExp = new RegExp('/(\\d{4})/(\\d{2})/(\\d{2})/(.+)\\.html');

const postHandler = async ({params}) => {
  const cachedResponse = await caches.match(`/${params.join('-')}.json`);
  const json = await cachedResponse.json();
  const html = await new Promise((resolve, reject) => {
    nunjucksEnv.render(
      json.layout,
      {content: json.html},
      (error, html) => {
        if (error) {
          return reject(error);
        }
        return resolve(html);
      }
    );
  }); 

  return new Response('hi' + html);
};

workbox.routing.registerRoute(postRegExp, postHandler);

workbox.skipWaiting();
