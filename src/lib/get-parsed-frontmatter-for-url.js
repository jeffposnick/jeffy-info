import frontmatter from 'frontmatter';
import urlToCacheKey from './url-to-cache-key.js';

let parsedFrontmatterCache = {};

export default async url => {
  if (!(url in parsedFrontmatterCache)) {
    const response = (await caches.match(urlToCacheKey(url))) ||
      (await fetch(url));
    const text = await response.text();
    parsedFrontmatterCache[url] = frontmatter(text);
  }

  return parsedFrontmatterCache[url];
};
