import Liquid from 'liquid-node';

export default class NetworkFileSystem extends Liquid.BlankFileSystem {
  readTemplateFile(path) {
    const url = `http://localhost:8000/_includes/${path}.html`;//`https://raw.githubusercontent.com/jeffposnick/jeffposnick.github.io/sw-jekyll/_includes/${path}.html`;
    return caches.match(url)
      .then(response => response || fetch(url))
      .then(response => response.text());
  }
}
