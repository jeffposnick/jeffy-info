import jekyllBehavior from './lib/jekyll-behavior.js';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const path = url.pathname.substring(1);
  if (path.match(/^\d{4}\/\d{2}\/\d{2}\/.*\.html$/)) {
    const postUrl = `/_posts/${path.replace(/\//g, '-').replace('html', 'markdown')}`;
    event.respondWith(jekyllBehavior(postUrl));
  }
});
