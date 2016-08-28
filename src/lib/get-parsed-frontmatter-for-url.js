import frontmatter from 'frontmatter';

let parsedFrontmatterCache = {};

export default async url => {
  if (!(url in parsedFrontmatterCache)) {
    const response = await caches.match(url) || await fetch(url);
    const text = await response.text();
    parsedFrontmatterCache[url] = frontmatter(text);
  }

  return parsedFrontmatterCache[url];
};
