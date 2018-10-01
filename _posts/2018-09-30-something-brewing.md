---
layout: default.njk
title: "Something Brewing"
date: 2018-09-30 18:00:00
excerpt: "Teasing the new site setup."
tags:
  - 11ty
  - nunjucks
  - post
  - web
  - workbox
permalink: "/{{ page.date | date: '%Y/%m/%d' }}/{{ page.fileSlug }}.html"
---

# New site setup!

Following up from my "[Beyond SPAs: alternative architectures for your PWA](https://developers.google.com/web/updates/2018/05/beyond-spa)" talk at Google I/O this year, I've been investigating ways of bringing all of the benefits folks associate with PWAs (network-independent loading, rich metadata provided by a web app manifest) to a more traditional, "blog-y" site architecture.

[Matias](https://twitter.com/mathias) was visiting NYC last week, and I gave him some advice about the service worker for the relaunched [V8 developer blog](https://v8.dev/). He ended up going with [11ty](https://www.11ty.io/) for building the blog, along with [Nunjucks templates](https://mozilla.github.io/nunjucks/). I figured it was worth giving that set of tools a try, and see what migrating my existing, [Jekyll](https://jekyllrb.com/) (+ [Liquid templates](https://shopify.github.io/liquid/)) blog setup would be.

And, while I was at it, I wanted to see what it would look like to implement all of the site build + templating infrastructure inside of a service worker, to give a more robust offline-first experience than what Matias was able to get for the V8 blog. (Just the index page was being cached.)

# The present

I've moved most of the templates over to use Nunjucks, though I believe I've lost a few filters and date formatting options that I had with Liquid.

Using 11ty instead of Jekyll to orchestrate the build was very straightforward, after moving a few directories around.

I've created a [helper script](https://github.com/jeffposnick/jeffposnick.github.io/blob/6d9e5631a2eb9dd5083b1ee18090e890fa128672/generate-sw.js) to take care of the service worker metadata generation. This basically handles a lot of the same processing that 11ty does as part of a build, but spits out the data in JSON files that could then be cached and read from the service worker using the Cache Storage API.

The service worker itself, not surprisingly, uses Workbox under the hood for precaching and runtime caching, with a custom handlerCallback to trigger the Nunjucks rendering.

Nunjucks rendering worked very well—there's an official build of Nunjucks which runs in the browser, and 

# The future

I'd love to get some of the logic that I've put into the custom build scripts into the core of the 11ty project, if that makes sense, or at least packaged up into a standalone set of helpers.

I need to refactor a bunch of that code to stop hardcoding things like paths, as well as try to support custom 11ty filters and plugins within the service worker.
