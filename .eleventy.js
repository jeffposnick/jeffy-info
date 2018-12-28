const pluginRss = require('@11ty/eleventy-plugin-rss');

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(pluginRss);

  eleventyConfig.addFilter('serializePosts', (value) => {
    const postData = value.map((post) => {
      return {
        date: post.date,
        url: post.url,
        data: {
          title: post.data.title,
          excerpt: post.data.excerpt,
        },
      };
    });

    return JSON.stringify({
      collections: {
        post: postData,
      },
    }, null, 2);
  });

  return {
    dir: {
      input: '_posts',
      output: 'build',
    }
  };
};
