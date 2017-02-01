import Liquid from 'liquid-node';
import urlToCacheKey from './url-to-cache-key.js';

export default class NetworkFileSystem extends Liquid.BlankFileSystem {
  readTemplateFile(path) {
    const url = `_includes/${path}.html`;
    return caches
      .match(urlToCacheKey(url))
      .then(response => response || fetch(url))
      .then(response => response.text());
  }
}
