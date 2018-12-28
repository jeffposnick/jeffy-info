// const pluginRss = require('@11ty/eleventy-plugin-rss');

module.exports = function(eleventyConfig) {
  // eleventyConfig.addPlugin(pluginRss);

  return {
    dir: {
      input: 'src/content',
      output: 'build',
    },
  };
};
