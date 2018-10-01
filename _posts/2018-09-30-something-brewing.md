---
layout: default.njk
title: "Something Brewing"
date: 2018-09-30 18:00:00
excerpt: "Apparently, the whole point of this blog is to blog about blogging architecture."
tags:
  - 11ty
  - meta
  - nunjucks
  - post
  - web
  - workbox
permalink: "/{{ page.date | date: '%Y/%m/%d' }}/{{ page.fileSlug }}.html"
---

# Motivation

Following up from my "[Beyond SPAs: alternative architectures for your PWA](https://developers.google.com/web/updates/2018/05/beyond-spa)" talk at Google I/O this year, I've been investigating ways of bringing all of the benefits folks associate with PWAs (network-independent loading, rich metadata provided by a web app manifest) to a more traditional, "blog-y" site architecture.

[Mathias](https://twitter.com/mathias) was visiting NYC last week, and I gave him some advice about the service worker for the relaunched [V8 developer blog](https://v8.dev/). He ended up going with [11ty](https://www.11ty.io/) for building the blog, along with [Nunjucks templates](https://mozilla.github.io/nunjucks/). I figured it was worth giving that set of tools a try, and see what migrating my existing, [Jekyll](https://jekyllrb.com/) (+ [Liquid templates](https://shopify.github.io/liquid/)) blog setup would be.

And, while I was at it, I wanted to see what it would look like to implement all of the site build + templating infrastructure inside of a service worker, to give a more robust offline-first experience than what Mathias was able to get for the V8 blog. (Just the index page was being cached.)

# The present

I've moved most of the templates over to use Nunjucks, though I believe I've lost a few filters and date formatting options that I had with Liquid.

Using 11ty instead of Jekyll to orchestrate the build was very straightforward, after moving a few directories around.

I've created a [helper script](https://github.com/jeffposnick/jeffposnick.github.io/blob/6d9e5631a2eb9dd5083b1ee18090e890fa128672/generate-sw.js) to take care of the service worker metadata generation. This basically handles a lot of the same processing that 11ty does as part of a build, but spits out the data in JSON files that could then be cached and read from the service worker using the Cache Storage API.

The service worker itself, not surprisingly, uses [Workbox](https://developers.google.com/web/tools/workbox/) under the hood for precaching and runtime caching, with a custom [`handlerCallback`](https://developers.google.com/web/tools/workbox/reference-docs/latest/workbox.routing.Route#~handlerCallback) to trigger the Nunjucks rendering.

Nunjucks rendering worked very well—there's an official build of Nunjucks which runs in the [browser](https://mozilla.github.io/nunjucks/api.html#browser-usage) (including in a service worker), and that really made it much easier to set this up. I've struggled in the past to implement service worker templating using [libraries](https://github.com/sirlantis/liquid-node) that weren't really meant to run in the browser, or did not have [pluggable loaders](https://mozilla.github.io/nunjucks/api.html#writing-a-loader) (to pull in templates using the Cache Storage API). Wrapping callback-style asynchronicity with promises meant that everything played nicely. I would love to see if, in the future, Nunjucks could be replaced by something a bit more lightweight—perhaps [native JavaScript template literals](https://twitter.com/jeffposnick/status/1046093468341276673).

Check out the [latest deployed version](/sw.js) of this site's service worker if you want to learn more—I'm expecting to clean it up quite a bit as I find some more time. One pretty neat bit worth excerpting is:

```js
const postHandler = async ({params}) => {
  const site = await initSiteData();
  const cachedResponse = await caches.match(`/_posts/${params.join('-')}.json`, {
    cacheName: workbox.core.cacheNames.precache,
  });
  const context = await cachedResponse.json();
  context.site = site;
  context.content = context.html;
  const html = await new Promise((resolve, reject) => {
    nunjucksEnv.render(context.layout,context, (error, html) => {
      if (error) {
        return reject(error);
      }
      return resolve(html);
    });
  }); 
  const headers = {'content-type': 'text/html'};
  return new Response(html, {headers});
};

workbox.routing.registerRoute(
  new RegExp('/(\\d{4})/(\\d{2})/(\\d{2})/(.+)\\.html'),
  postHandler
);
```

# Caching strategies

All of the site metadata, templates and content (a whole 8 blog posts!) are precached, which adds up to only ~77kb for my blog. If I were working on a larger site, I'd consider only precaching the site metadata and templates, and using a runtime caching strategy for the posts' JSON.

I've got a cache-first strategy set up for the few images that I use on this blog.

I've also got [Workbox's offline Google Analytics](https://developers.google.com/web/tools/workbox/guides/enable-offline-analytics) support set up, just because.

# The future

I'd love to get some of the logic that I've put into the custom build scripts into the core of the 11ty project, if that makes sense, or at least packaged up into a standalone set of helpers.

I need to refactor a bunch of that code to stop hardcoding things like paths, as well as try to support custom 11ty filters and plugins within the service worker.

As mentioned, I'm still evaluating whether Nunjucks is the right templating engine to use, but its syntax does seem familiar enough for folks coming from Liquid templates, or Jinja.

The actual service worker code needs to be refactored a bit, and I'd like to make it flexible enough to load any `_data` you're using, not just the `site.json`.

I'm not minimizing anything right now, and the build process is generally a bunch of things stuck together with tap.

# Alternatives

There are a host of other options for folks to consider right now—it's actually a really great time for PWA-y static blogs and site generators. I like what [Gatsby's doing](https://www.gatsbyjs.org/), especially with v2 (featuring  [Workbox-powered offline support](https://www.gatsbyjs.org/packages/gatsby-plugin-offline/)). [Vuepress](https://vuepress.vuejs.org/) is similarly vue-pressive, and features Workbox integration as well.

But if you're not interested in building your site's structure using React or Vue, and are coming from a more Jekyll-y starting point, I'm kind of excited about the approach I'm using here.
