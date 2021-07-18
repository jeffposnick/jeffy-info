import globby from 'globby';
import prettyBytes from 'pretty-bytes';

import {
  bundleSWJS,
  bundleWindowJS,
  clean,
  copyStatic,
  generateRSS,
  log,
  PAGES_DIR,
  processMarkdown,
  SW_SRC_DIR,
  WINDOW_SRC_DIR,
  writeCollections,
} from './utils.mjs';

async function main() {
  await clean();
  log('Cleaned up previous build.');

  await copyStatic();
  log('Copied static files.');

  const posts = [];
  const pages = await globby([`${PAGES_DIR}/**/*.md`]);
  for (const page of pages) {
    const { data, jsonFile } = await processMarkdown(page);
    log(`Wrote ${jsonFile}.`);

    const { date, excerpt, title, url } = data;
    posts.push({ date, excerpt, title, url });
  }

  await writeCollections(posts);
  log(`Wrote metadata about ${posts.length} posts in the collection.`);

  const rssFile = await generateRSS(posts);
  log(`Wrote RSS feed to ${rssFile}.`);

  const windowTSFiles = await globby([`${WINDOW_SRC_DIR}/*.ts`]);
  for (const windowTSFile of windowTSFiles) {
    const bundledFile = await bundleWindowJS(windowTSFile);
    log(`Wrote ${bundledFile}.`);
  }

  const swSFiles = await globby([`${SW_SRC_DIR}/*.ts`]);
  for (const swSFile of swSFiles) {
    const bundledFile = await bundleSWJS(swSFile);
    log(`Wrote ${bundledFile}.`);
  }
}

await main();
