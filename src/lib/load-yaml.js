import jsYaml from 'js-yaml';

let parsedYamlCache = {};

export default async url => {
  if (!(url in parsedYamlCache)) {
    const response = await caches.match(urlsToCacheKeys.get(url)) || await fetch(url);
    const text = await response.text();
    parsedYamlCache[url] = jsYaml.load(text);
  }

  return parsedYamlCache[url];
}
