let parsedJsonCache = {};

export default async url => {
  if (!(url in parsedJsonCache)) {
    const response = await caches.match(urlsToCacheKeys.get(url)) || await fetch(url);
    const json = await response.json();
    parsedJsonCache[url] = json;
  }

  return parsedJsonCache[url];
}
