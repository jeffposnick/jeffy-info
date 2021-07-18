import globby from 'globby';
import prettyBytes from 'pretty-bytes';

import {
  BROWSER_SW,
  bundle,
  copyStatic,
  CF_SW,
  clean,
  injectWorkboxManifest,
  generateRSS,
  log,
  PAGES_DIR,
  processMarkdown,
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

  for (const swFileName of [CF_SW, BROWSER_SW]) {
    const file = await bundle(swFileName);
    log(`Wrote ${file}.`);

    if (swFileName === BROWSER_SW) {
      const { count, size, warnings } = await injectWorkboxManifest(file);
      if (warnings.length) {
        log(warnings);
      }
      log(`${count} files will be precached, totaling ${prettyBytes(size)}.`);
    }
  }
}

await main();
