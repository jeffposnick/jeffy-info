import {createHash} from 'crypto';
import {Feed} from 'feed';
import {transform as tempuraTransform} from 'tempura/esbuild';
import csso from 'csso';
import esbuild from 'esbuild';
import frontmatter from 'frontmatter';
import fse from 'fs-extra';
import MarkdownIt from 'markdown-it';
import path from 'path';
import tinydate from 'tinydate';

import {Page, Post, RSSItem, Site} from '../shared/types';
import {HASH_CHARS} from '../shared/constants';

export const BROWSER_SW = 'service-worker';
export const BUILD_DIR = 'dist';
export const CF_SW = 'cf-sw';
export const PAGES_DIR = 'site/posts';
export const STATIC_DIR = 'static';
export const SW_SRC_DIR = 'src/service-worker';
export const WINDOW_SRC_DIR = 'src/window';

const SITE_JSON = path.join('site', 'site.json');

const md = new MarkdownIt({
  html: true,
});
const timestamp = tinydate('[{HH}:{mm}:{ss}] ');
const dateRegexp = /(?<year>\d{4})\/(?<month>\d{2})\/(?<day>\d{2})/;

const assetManifest: Record<string, string> = {};

export function log(...data: Array<unknown>): void {
  console.log(timestamp(new Date()), ...data);
}

export async function clean(): Promise<void> {
  await fse.emptyDir(BUILD_DIR);
}

export async function copyStatic(): Promise<void> {
  await fse.copy(STATIC_DIR, path.join(BUILD_DIR, STATIC_DIR));
}

export function postToJSONFileName(file: string): string {
  const {dir, name} = path.parse(file);
  const jsonDir = path.relative(PAGES_DIR, dir);
  return path.join(BUILD_DIR, STATIC_DIR, jsonDir, `${name}.json`);
}

export function jsonFilenameToURL(file: string): string {
  const {dir, name} = path.parse(file);
  const relativeDir = path.relative(path.join(BUILD_DIR, STATIC_DIR), dir);
  return `/${relativeDir}/${name}.html`;
}

function parseDateFromFilename(file: string): string {
  const result = dateRegexp.exec(file);
  if (result) {
    return `${result.groups.year}-${result.groups.month}-${result.groups.day}`;
  }
}

export async function processMarkdown(file: string) {
  const rawContents = await fse.readFile(file, {encoding: 'utf8'});
  const {
    content,
    data,
  }: {
    content: string;
    data: Page;
  } = frontmatter(rawContents);
  const html = md.render(content);

  const jsonFile = postToJSONFileName(file);

  data.date = parseDateFromFilename(jsonFile);
  data.url = jsonFilenameToURL(jsonFile);

  await fse.ensureDir(path.dirname(jsonFile));
  const post: Post = {
    content: html,
    page: data,
  };
  await fse.writeJSON(jsonFile, post);

  return {data, html, jsonFile};
}

export function sortPosts(posts: Array<RSSItem>) {
  posts.sort((a, b) => b.date.localeCompare(a.date));
}

export async function writeCollections(posts: Array<RSSItem>): Promise<void> {
  const file = path.join(BUILD_DIR, STATIC_DIR, 'collections.json');
  await fse.writeJSON(file, {
    // Remove the html field, which was used for the RSS feed, before we
    // serialize it.
    posts: posts.map((post) => {
      delete post.html;
      return post;
    }),
  });
}

export async function bundleSWJS(file: string): Promise<string> {
  const {name} = path.parse(file);
  const outfile = path.join(BUILD_DIR, `${name}.js`);

  await esbuild.build({
    outfile,
    bundle: true,
    define: {
      'process.env.NODE_ENV':
        process.env.ENVIRONMENT_NAME === 'staging' && name === 'service-worker'
          ? `"development"`
          : `"production"`,
    },
    entryPoints: [file],
    format: 'iife',
    minify: process.env.ENVIRONMENT_NAME === 'staging' ? false : true,
    plugins: [tempuraTransform()],
  });

  return outfile;
}

export async function bundleWindowJS(file: string): Promise<string> {
  const {name} = path.parse(file);
  const basename = `${name}.js`;
  const outfile = path.join(BUILD_DIR, STATIC_DIR, basename);

  await esbuild.build({
    outfile,
    bundle: true,
    entryPoints: [file],
    format: 'esm',
    minify: process.env.ENVIRONMENT_NAME === 'staging' ? false : true,
  });

  return outfile;
}

export async function getHash(pathToFile: string): Promise<string> {
  const contents = await fse.readFile(pathToFile);

  const hash = createHash('sha256');
  hash.update(contents);
  return hash.digest('base64url').toString().substring(0, HASH_CHARS);
}

export function getHashedFilename(pathToFile: string, hash: string) {
  const {dir, base} = path.parse(pathToFile);
  return path.format({dir, base: `${hash}~${base}`});
}

export async function generateRSS(posts: Array<RSSItem>): Promise<string> {
  const site: Site = await fse.readJSON(SITE_JSON);

  const feed = new Feed({
    author: {
      name: site.author,
      email: site.email,
    },
    copyright: 'Creative Commons Attribution 4.0 International License',
    description: site.description,
    favicon: `${site.url}${site.logo}`,
    id: site.url,
    image: `${site.url}${site.logo}`,
    language: 'en',
    link: site.url,
    title: site.title,
  });

  for (const post of posts) {
    feed.addItem({
      title: post.title,
      id: post.url,
      link: post.url,
      description: post.excerpt,
      date: new Date(post.date),
      content: post.html,
      author: [
        {
          name: site.author,
          email: site.email,
        },
      ],
    });
  }

  const file = path.join(BUILD_DIR, site.rssFeed);
  await fse.writeFile(file, feed.rss2());

  return file;
}

export async function minifyCSS(file: string): Promise<string> {
  const basename = path.basename(file);
  const outfile = path.join(BUILD_DIR, STATIC_DIR, basename);
  const rawCSS = await fse.readFile(file);
  const minifiedCSS = csso.minify(rawCSS).css;
  await fse.writeFile(outfile, minifiedCSS);

  return outfile;
}

export async function hashFiles(files: Array<string>): Promise<void> {
  for (const file of files) {
    const basename = path.basename(file);
    const hash = await getHash(file);
    const hashedFilename = getHashedFilename(file, hash);
    await fse.rename(file, hashedFilename);
    assetManifest[basename] = '/' + path.relative(BUILD_DIR, hashedFilename);
  }
}

export async function writeManifest(): Promise<string> {
  const outfile = path.join(BUILD_DIR, 'asset-manifest.json');
  await fse.writeJSON(outfile, assetManifest);

  return outfile;
}
