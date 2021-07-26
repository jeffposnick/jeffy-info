---
title: 'Precaching vs. runtime caching'
excerpt: 'Some pros and cons to help you make an educated choice.'
tags:
  - post
---

## First, some background

Service workers and the Cache Storage API offer some very low-level primitives that developers are expected to build on top of. Some common recipes that work well are outlined in "[The Offline Cookbook](https://web.dev/offline-cookbook/)." Developers who want a higher-level package for those strategies often turn to the [Workbox libraries](https://developers.google.com/web/tools/workbox/). Generally speaking, Workbox divides up caching into two approaches.

There's precaching, where build tools (like [`workbox-cli`](https://developers.google.com/web/tools/workbox/modules/workbox-cli) or [`workbox-webpack-plugin`](https://developers.google.com/web/tools/workbox/modules/workbox-webpack-plugin)) generate a manifest of URLs and revisions, which is then fed into the [`workbox-precaching`](https://developers.google.com/web/tools/workbox/modules/workbox-precaching) runtime module. Based on the precache manifest, `workbox-precaching` keeps your cache up to date and sets up a route to serve precached URLs using a cache-first strategy.

There's also runtime caching, in which a mix of [`workbox-routing`](https://developers.google.com/web/tools/workbox/modules/workbox-routing) and [`workbox-strategies`](https://developers.google.com/web/tools/workbox/modules/workbox-strategies) (along with any [plugins](https://developers.google.com/web/tools/workbox/guides/using-plugins))

Workbox will let you go all-in on either precaching of runtime caching, if you want, but you can also use both types of caching within the same service worker. (If you do, the order in which you register routes is imports; your should include `precacheAndRoute()` before any additional `registerRoute()` statements to ensure that anything in your precache manifest ends up being served via the precache strategy!)

In order to help developers decide which URLs should be precached and which should be runtime cached, here's a rough rundown of pros and cons of each approach. We'll formalize this information as part of an upcoming, long-overdue revamp of the [Workbox documentation](https://developers.google.com/web/tools/workbox/), but I recently wrote this up for a different purpose, so I figured I'd make it public!

## Precaching Pros

- Cache-first is "safe" with URLs that don't contain hashes, since the revision information is generated at build time and maintained out-of-band in the precache manifest.
- Allows you to "upgrade" from one version of cached subresources to another atomically. (Useful if, for instance, your templates and JavaScript rendering logic both need to be cached in concert with each other.)
- You can easily cache resources that are needed for subsequent pages, instead of waiting for the service worker to take control and intercept the request for runtime caching. (You can work around this somewhat by [explicitly adding items to a runtime cache](https://developers.google.com/web/tools/workbox/modules/workbox-window#example-cache-urls).)

## Precaching Cons

- Requires a build step.
- Unconditionally caches everything during service worker installation. If you include URLs for infrequently used subresources in the precache manifest, or large resources like images, that can be wasteful, as you're caching things that will never be read.
- Precaching resources that update frequently can lead to a lot of "cache churn". This is fine for subresources that are commonly used, but the worst case scenario is that you're precached an infrequently used subresource that's updated frequently, compounding the wasted bytes described in the previous point.

## Runtime Caching Pros

- Works well for URLs whose hash can't be determined at build time. (This is an issue for most dynamic or server-rendered content.)
- Flexibility to use either a network-first or cache-first strategy, giving you control over the freshness vs. speed tradeoff.
- Allows the cache lifetimes of different subresources to exist independent of each other, based on routing rules, and cache expiration plugins.

## Runtime Caching Cons

- Users might end up with a broken offline experience if the page relies on resources that haven't been cached yet.
- If a given URL doesn't include hash or versioning info, it's generally not safe to use a cache-first strategy. The best your can do is stale-while-revalidate, to ensure that the cached resources gets updated eventually.
- There are no atomic updates of cached resources. One JavaScript subresource may have been updated recently via a stale-while-revalidate strategy, while your templates weren't, and that can lead to a mismatch or incorrect assumption about interoperability.
- Assuming your URLs _do_ include versioning information like hashes, there is no built-in mechanism for automatically expiring previous revisions of a given resource once a new one is in the cache. (I've been playing around with solutions via [a Workbox plugin](https://github.com/jeffposnick/jeffy-info/blob/cf-worker/src/service-worker/shared/revisionedAssetsPlugin.ts), though.)

## Takeaways

My normal go-to is to precache as much as possible, as most of my web apps have a build process already, they normally are limited in size (say, under 1 megabyte for _all_ of the app content), and I don't churn my cached resources that frequently. Whenever I do mix in runtime caching, it's normally for things that can't be versioned at build time (like live API results) or for images, which I'd rather not force everyone to download during service worker installation.

During my recent [blog infrastructure rewrite](/2021/07/17/sw-rendering.html), though, I've ended up going entirely with runtime caching, instead of precaching. I don't know if there's a technical reason for that choice as much as giving me an opportunity to experience some of the pain points that come with runtime caching, like how to expire old versions of hashed URLs.
