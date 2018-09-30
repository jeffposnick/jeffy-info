const fse = require('fs-extra');
const glob = require('glob');
const MarkdownIt = require('markdown-it');
const matter = require('gray-matter');
const path = require('path');
const prettyBytes = require('pretty-bytes');
const workboxBuild = require('workbox-build');

const POST_DIR = '_posts';
const BUILD_DIR = 'build';
const OUTPUT_DIR = path.join(BUILD_DIR, '_posts');

const markdown = new MarkdownIt({
  html: true,
});

async function generateJson() {
  const files = glob.sync(`${POST_DIR}/*.md`);

  for (const file of files) {
    const string = await fse.readFile(file, 'utf-8');
    const parsed = matter(string);

    delete parsed.data.permalink;
    parsed.data.html = markdown.render(parsed.content);    

    const fileName = `${path.basename(file, '.md')}.json`;
    await fse.writeJson(path.join(OUTPUT_DIR, fileName), parsed.data);
  } 
}

async function generateSW() {
  const swDest = path.join(BUILD_DIR, 'sw.js');
  const {count, size, warnings} = await workboxBuild.injectManifest({
    globDirectory: BUILD_DIR,
    globPatterns: [
      '**/*.{json,njk}',
      'index.html',
    ],
    swDest,
    swSrc: path.join('src', 'sw.js'),
  });

  for (const warning of warnings) {
    console.warn(warning);
  }

  console.log(`${swDest} will precache ${count} files, totaling ${prettyBytes(size)}.`);
}

async function main() {
  try {
    await generateJson();
    await generateSW();
  } catch(error) {
    console.error(error);
  }
}

main();
