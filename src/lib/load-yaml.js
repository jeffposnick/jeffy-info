import jsYaml from 'js-yaml';
import urlToCacheKey from './url-to-cache-key.js';

let parsedYamlCache = {};

export default async url => {
  if (!(url in parsedYamlCache)) {
    const response = (await caches.match(urlToCacheKey(url))) ||
      (await fetch(url));
    const text = await response.text();
    parsedYamlCache[url] = jsYaml.load(text);
  }

  return parsedYamlCache[url];
};
