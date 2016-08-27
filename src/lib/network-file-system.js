import Liquid from 'liquid-node';

export default class NetworkFileSystem extends Liquid.BlankFileSystem {
  readTemplateFile(path) {
    return fetch(`_includes/${path}.html`).then(response => response.text());
  }
}
