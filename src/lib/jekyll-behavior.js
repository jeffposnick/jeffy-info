import {Engine} from 'liquid-node';
import MarkdownIt from 'markdown-it';
import MarkdownItAnchor from 'markdown-it-anchor';
import NetworkFileSystem from './network-file-system.js';
import getParsedFrontmatterForUrl from './get-parsed-frontmatter-for-url.js';
import loadJson from './load-json.js';
import loadYaml from './load-yaml.js';

const markdown = new MarkdownIt({ html: true }).use(MarkdownItAnchor);
let liquidEngine = new Engine();
liquidEngine.fileSystem = new NetworkFileSystem();

export default async function jekyllBehavior(
  url,
  currentContent = '',
  pageState = {}
) {
  const siteConfig = await loadYaml('_config.yml');
  siteConfig.posts = await loadJson('posts.json');

  const parsedFrontmatter = await getParsedFrontmatterForUrl(url);

  const content = url.match(/\.(?:markdown|md)$/)
    ? markdown.render(parsedFrontmatter.content)
    : parsedFrontmatter.content;

  const parsedTemplate = await liquidEngine.parse(content);

  const accumulatedPageState = Object.assign(pageState, parsedFrontmatter.data);
  const renderedTemplate = await parsedTemplate.render({
    site: siteConfig,
    content: currentContent,
    page: accumulatedPageState
  });

  if (parsedFrontmatter.data && parsedFrontmatter.data.layout) {
    const layoutUrl = `_layouts/${parsedFrontmatter.data.layout}.html`;
    return jekyllBehavior(layoutUrl, renderedTemplate, accumulatedPageState);
  }

  return new Response(renderedTemplate, {
    headers: { 'content-type': 'text/html' }
  });
};
