import frontmatter from 'frontmatter';
import Liquid from 'liquid-node';
import MarkdownIt from 'liquid-node';
import yaml from 'js-yaml';
import 'babel-polyfill';
import NetworkFileSystem from './networkFileSystem.js';

let engine = new Liquid.Engine();
engine.fileSystem = new NetworkFileSystem();

const markdown = new MarkdownIt();

let _site;
window.getSiteConfig = async () => {
  if (_site) {
    return Promise.resolve(_site);
  }

  let response = await fetch('_config.yml');
  let text = await response.text();
  _site = yaml.load(text);
  return _site;
};
/*
const renderTemplateAtUrl = (url, content='') => {
  return getParsedFrontmatterForUrl(url).then(parsedFrontmatter => {
    return engine.parse(parsedFrontmatter.content)
      .then(parsedTemplate => parsedTemplate.render({
        site: getSiteConfig()
      }));
  });
};

const getParsedFrontmatterForUrl = url => {
  fetch(targetUrl)
    .then(response => response.text())
    .then(text => frontmatter(text));
};

const handleLayout = (data, content) => {
  if (data.layout) {
    return getParsedFrontmatterForUrl(`_layouts/${data.layout}.html`)
      .then(parsedFrontmatter => handleLayout(
        parsedFrontmatter.data, parsedFrontmatter.content));
  }

  return getSiteConfig().then(siteConfig => {
    return engine.parse(content).then(parsedTemplate => parsedTemplate.render({
      site: siteConfig,
      page: data,
      content: content
    }));
  });
};

window.nav = originalUrl => {
  let targetUrl = originalUrl;

  if (originalUrl.includes('/')) {
    targetUrl = `_posts/${originalUrl.replace(/\//g, '-').replace('html', 'markdown')}`;
  }

  return fetch(targetUrl)
    .then(response => response.text())
    .then(text => frontmatter(text))
    .then(parsedFrontmatter => {
      return getSiteConfig().then(siteConfig => {
        return fetch(`_layouts/${parsedFrontmatter.data.layout}.html`)
          .then(response => response.text())
          .then(rawTemplate => engine.parse(rawTemplate))
          .then(parsedTemplate => parsedTemplate.render({
            site: siteConfig,
            page: parsedFrontmatter.data,
            content: parsedFrontmatter.content
          }));
      });
    });
};
*/
