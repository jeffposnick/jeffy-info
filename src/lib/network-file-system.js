import Liquid from 'liquid-node';

export default class NetworkFileSystem extends Liquid.BlankFileSystem {
  readTemplateFile(path) {
    const url = `https://raw.githubusercontent.com/jeffposnick/jeffposnick.github.io/master/_includes/${path}.html`;//`http://localhost:8000/_includes/${path}.html`;
    return caches.match(urlsToCacheKeys.get(url))
      .then(response => response || fetch(url))
      .then(response => response.text());
  }
}
