import fse from 'fs-extra';
import {globby} from 'globby';
import got from 'got';
import parser from 'node-html-parser';
import {URL} from 'url';

import {log} from './lib';
import {Post, Site} from '../shared/types';

async function main() {
  const site: Site = await fse.readJSON('site/site.json');
  const files = await globby('dist/static/*/**/*.json');
  for (const file of files) {
    let shouldLog = true;

    const post: Post = await fse.readJSON(file);
    const root = parser.parse(post.content);

    const urls: Set<string> = new Set();
    const hrefEls = root.querySelectorAll('[href]');
    for (const hrefEl of hrefEls) {
      const url = new URL(hrefEl.getAttribute('href'), site.url + site.baseurl);
      if (url.origin !== site.url) {
        urls.add(url.href);
      }
    }
    const srcEls = root.querySelectorAll('[src]');
    for (const srcEl of srcEls) {
      const url = new URL(srcEl.getAttribute('src'), site.url + site.baseurl);
      if (url.origin !== site.url) {
        urls.add(url.href);
      }
    }

    for (const url of urls) {
      try {
        await got.head(url);
      } catch (error) {
        if (shouldLog) {
          shouldLog = false;
          log(`${file} has broken links:`);
        }
        log(`- ${url} [${error}]`);
      }
    }
  }
}

// @ts-ignore
await main();
