import { injectManifest } from 'workbox-build';
import { transform as tempuraTransform } from 'tempura/esbuild';
import esbuild from 'esbuild';
import frontmatter from 'frontmatter';
import fse from 'fs-extra';
import MarkdownIt from 'markdown-it';
import path from 'path';
import tinydate from 'tinydate';

export const CF_SW = 'cf-sw';
export const PAGES_DIR = path.join('site', 'posts');
export const BROWSER_SW = 'browser-sw';

const BUILD_DIR = 'dist';
const SRC_DIR = path.join('src', 'service-worker');
const STATIC_DIR = 'static';

const md = new MarkdownIt();
const timestamp = tinydate('[{HH}:{mm}:{ss}] ');
const dateRegexp = /(?<year>\d{4})\/(?<month>\d{2})\/(?<day>\d{2})/;

export function log(...data) {
  console.log(timestamp(new Date()), ...data);
}

export async function clean() {
  await fse.emptyDir(BUILD_DIR);
}

export async function copyStatic() {
  await fse.copy(STATIC_DIR, path.join(BUILD_DIR, STATIC_DIR));
}

export function postToJSONFileName(file) {
  const { dir, name } = path.parse(file);
  const jsonDir = path.relative(PAGES_DIR, dir);
  return path.join(BUILD_DIR, STATIC_DIR, jsonDir, `${name}.json`);
}

export function jsonFilenameToURL(file) {
  const { dir, name } = path.parse(file);
  const relativeDir = path.relative(path.join(BUILD_DIR, STATIC_DIR), dir);
  return `/${relativeDir}/${name}.html`;
}

function parseDateFromFilename(file) {
  const result = dateRegexp.exec(file);
  if (result) {
    return `${result.groups.year}-${result.groups.month}-${result.groups.day}`;
  }
}

export async function processMarkdown(file) {
  const rawContents = await fse.readFile(file, { encoding: 'utf8' });
  const { data, content } = frontmatter(rawContents);
  const html = md.render(content);

  const jsonFile = postToJSONFileName(file);

  data.date = parseDateFromFilename(jsonFile);
  data.url = jsonFilenameToURL(jsonFile);

  await fse.ensureDir(path.dirname(jsonFile));
  await fse.writeJSON(jsonFile, {
    content: html,
    page: data,
  });

  return { data, jsonFile };
}

export async function writeCollections(posts) {
  const file = path.join(BUILD_DIR, STATIC_DIR, 'collections.json');
  await fse.writeJSON(file, {
    posts: posts.reverse(),
  });
}

export async function bundle(swFileName) {
  const outfile = path.join(BUILD_DIR, `${swFileName}.js`);

  await esbuild.build({
    outfile,
    bundle: true,
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    entryPoints: [`${SRC_DIR}/${swFileName}.ts`],
    format: 'iife',
    minify: true,
    plugins: [tempuraTransform()],
  });

  return outfile;
}

export async function injectWorkboxManifest(file) {
  const { count, size, warnings } = await injectManifest({
    globDirectory: path.join(BUILD_DIR),
    globPatterns: [`${STATIC_DIR}/**/*`],
    swDest: file,
    swSrc: file,
  });

  return { count, size, warnings };
}
