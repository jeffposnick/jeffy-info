import {globby} from 'globby';

import {
  BUILD_DIR,
  bundleSWJS,
  bundleWindowJS,
  clean,
  copyStatic,
  generateRSS,
  hashFiles,
  log,
  minifyCSS,
  PAGES_DIR,
  processMarkdown,
  sortPosts,
  STATIC_DIR,
  SW_SRC_DIR,
  WINDOW_SRC_DIR,
  writeCollections,
  writeManifest,
} from './lib';

import {RSSItem} from '../shared/types';

async function main(): Promise<void> {
  await clean();
  log('Cleaned up previous build.');

  await copyStatic();
  log('Copied static files.');

  const posts: Array<RSSItem> = [];
  const pages = await globby([`${PAGES_DIR}/**/*.md`]);
  for (const page of pages) {
    const {html, data, jsonFile} = await processMarkdown(page);
    log(`Wrote ${jsonFile}.`);

    const {date, excerpt, title, url} = data;
    posts.push({html, date, excerpt, title, url});
  }

  sortPosts(posts);

  const rssFile = await generateRSS(posts);
  log(`Wrote RSS feed to ${rssFile}.`);

  await writeCollections(posts);
  log(`Wrote metadata about ${posts.length} posts in the collection.`);

  const windowTSFiles = await globby([`${WINDOW_SRC_DIR}/*.ts`]);
  for (const windowTSFile of windowTSFiles) {
    const bundledFile = await bundleWindowJS(windowTSFile);
    log(`Wrote ${bundledFile}.`);
  }

  const cssFiles = await globby([`site/**/*.css`]);
  for (const cssFile of cssFiles) {
    const minifiedFile = await minifyCSS(cssFile);
    log(`Wrote ${minifiedFile}.`);
  }

  const filesToHash = await globby([
    `${BUILD_DIR}/${STATIC_DIR}/**/*.{css,js}`,
  ]);
  await hashFiles(filesToHash);
  log(`Renamed ${filesToHash.length} files with hashes.`);

  const assetManifestFile = await writeManifest();
  log(`Wrote ${assetManifestFile}.`);

  const swSFiles = await globby([`${SW_SRC_DIR}/*.ts`]);
  for (const swSFile of swSFiles) {
    const bundledFile = await bundleSWJS(swSFile);
    log(`Wrote ${bundledFile}.`);
  }
}

// @ts-ignore
await main();
