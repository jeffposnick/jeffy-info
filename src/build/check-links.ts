import globby from 'globby';
import plc from 'page-link-checker';
import fse from 'fs-extra';

import {log} from './lib';
import {Post} from '../shared/types';

interface LinkCheckerResponse {
  link: {
    href: string;
    text: string;
  };
  request: {
    failed: boolean,
    statusCode: number;
  };
}

function checkLinkPromise(html: string) {
  return new Promise<Array<LinkCheckerResponse>>((resolve, reject) => {
    plc.check(html, 'https://jeffy.info/', (err: string, responses: Array<LinkCheckerResponse>) => {
      if (err) {
        reject(err);
      } else {
        resolve(responses);
      }
    });
  });
}

async function main() {
  const files = await globby('dist/static/*/**/*.json');
  for (const file of files) {
    log(`Checking ${file} for broken links...`);
    const post: Post = await fse.readJSON(file);
    const responses = await checkLinkPromise(post.content);
    for (const response of responses) {
      if (response.request.failed || response.request.statusCode !== 200) {
        log(`- ${response.link.href} (${response.request.statusCode})`);
      }
    }
  }
}

// @ts-ignore
await main();
