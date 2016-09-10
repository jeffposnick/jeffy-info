import Liquid from 'liquid-node';

export default class NetworkFileSystem extends Liquid.BlankFileSystem {
  readTemplateFile(path) {
    const url = `_includes/${path}.html`;
    return caches.match(urlsToCacheKeys.get(url))
      .then(response => response || fetch(url))
      .then(response => response.text());
  }
}
