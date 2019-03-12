importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.0.0-beta.0/workbox-sw.js');

workbox.precaching.precacheAndRoute([]);
workbox.skipWaiting();

// Adapted from https://github.com/11ty/eleventy/blob/512842d025af195fdd4631675dad465919220a34/src/Engines/JavaScriptTemplateLiteral.js#L31-L55
async function evaluate({context, templateString}) {
  let dataStr = "";
  for (const [key, value] of Object.entries(context)) {
    dataStr += `let ${key} = ${JSON.stringify(value)};\n`;
  }

  return eval(`${dataStr}\n${templateString};`);
}

const _data = {};
async function loadData(symbol) {
  if (!(symbol in _data)) {
    const jsonUrl = `_sw/_data/${symbol}.json`;
    const response = await caches.match(jsonUrl, {
      cacheName: workbox.core.cacheNames.precache,
    });

    if (response) {
      _data[symbol] = await response.json();
    } else {
      throw new Error(`Unable to load JSON data from cache: ${jsonUrl}`);
    }
  }

  return _data[symbol];
}

async function renderLayout({context, layout}) {
  
}

async function postHandler({params}) {
  // Load the site-wide configuration.
  const site = await loadData('site');

  // Load the post-specific configuration.
  const cachedResponse = await caches.match(`_sw/posts/${params[0]}.json`, {
    cacheName: workbox.core.cacheNames.precache,
  });
  const post = await cachedResponse.json();

  const context = {
    site,
    content: post.html,
  };

  const html = await renderLayout({
    context,
    layout: post.layout,
  });

  const headers = {
    'content-type': 'text/html',
  };

  return new Response(html, {
    headers,
  });
};

// Register a route for posts.
workbox.routing.registerRoute(
  new RegExp('/(\\d{4}/\\d{2}/\\d{2}/.+)\\.html'),
  postHandler
);

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

// If anything goes wrong when handling a route, return the network response.
workbox.routing.setCatchHandler(workbox.strategies.networkOnly());
