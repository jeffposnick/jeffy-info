---
title: 'Smarter runtime caching of hashed assets'
excerpt: 'Clean caches and graceful fallbacks via a custom Workbox plugin.'
tags:
  - post
---

## What problem are we trying to solve?

This is a follow-up to my recent [precaching vs. runtime caching](https://jeffy.info/2021/07/26/precaching-vs-runtime-caching.html) post. I'd like to examine one of the advantages of precaching, as well as two of the disadvantages of runtime caching, and see if can make runtime caching more compelling by addressing them both.

Excerpting an advantage of precaching from my earlier blog post:

_Allows you to "upgrade" from one version of cached subresources to another atomically. (Useful if, for instance, your templates and JavaScript rendering logic both need to be cached in concert with each other.)_

And a disadvantage of runtime caching:

_Assuming your URLs do include versioning information like hashes, there is no built-in mechanism for automatically expiring previous revisions of a given resource once a new one is in the cache. (I've been playing around with solutions via a [Workbox plugin](https://github.com/jeffposnick/jeffy-info/blob/cf-worker/src/service-worker/shared/revisionedAssetsPlugin.ts), though.)_

(That last bit about the Workbox plugin is a spoiler for the rest of this post.)

So how can we use runtime caching and still get a reasonable best-effort coordination of cached resources without atomic cache upgrades? And how can we avoid cluttering up our runtime cache storage with dozens of versioned copies of the same logical assets, each with a different hash in their URL?

## Naming conventions

All of the techniques in this blog post assume that you've adopted a consistent  convention for translating "unversioned" filenames, like `app.js`, into a versioned equivalent containing a hash, like `app.34abf34a.js` or `app.78dd13ee.js`. If you're using a build tool that can do versioning, like [Rollup](https://rollupjs.org/guide/en/#outputassetfilenames) or [webpack](https://webpack.js.org/configuration/output/#template-strings), you're probably familiar with using the placeholder `[hash]` to specify where you want that hash inserted.

The exact tool you use to add these hashes doesn't matter as much as adopting a consistent naming format across all your URLs, with a fixed number of characters in the hash. We'll be writing code that will need to translate from a hashed URL to the underlying "unversioned" filename (i.e. `app.34abf34a.js` => `app.js`), so if you have the flexibility to do so, try to optimize your hash delimiters for ease of parsing.

For example, I've used the equivalent of `[hash:8]~[name].[ext]` for the versioned URLs on the current incarnation of my blog. An "unversioned" file named `page.js` might have a hashed filename of `8GlAOC2Y~page.js` (I'm [using `base64url` encoding](https://github.com/jeffposnick/jeffy-info/blob/48c4db2e27721f72dcbdd86972a77a49efccd937/src/build/lib.ts#L144-L150) for the hash, instead of hex, but that's an implementation detail.) I find it easier to extract the original name from the hashed filename if the hash is always at the start, and the `~` character offers a visual hint to anyone inspecting the URLs about where the hash ends.

Using this approach, translating a hashed URL into the original "unversioned" filename is as simple as taking the final portion of the URL's path and calling `substring()`, passing in the number of initial characters that need to be skipped.

## Cleaning up old revisions

Now that we have a well-defined way to translate from a hashed URL to the corresponding original filename, there's a straightforward approach to ensuring that we don't indefinitely cache out of date versions of the same asset. The steps are:

- Find the "unversioned" filename for the URL that was just cached.
- Iterate through all the current cache keys, and find the "unversioned" filename for each.
- If the filenames match, delete the previously cached entry.

We're operating on the assumption that the newly cached hashed URL is the definitive version that should be kept around, and hopefully there isn't any other cache entries that refer to the soon-to-be-deleted hashed URL. (If there are, we'll cover how to handle that in the next section.)

## Dealing with cache misses due to versioning

The other drawback of runtime caching to address is cache misses triggered by one resource referring to a outdated versioned URL of a subresource. You might encounter this if, for example, you cache HTML documents at runtime, and a user revisits a very old page that still refers to your CSS and JS files using hashes that have long since been purged from your servers and local caches.

This is a solved problem for precaching (usually! assuming [you're careful about when you call `skipWaiting()`](https://pawll.glitch.me/)!), where you can deploy compatible versions of your HTML, JS, and CSS altogether, versioned alongside your service worker.

So how should you deal with it when using runtime caching? The answer is a little bit of `¯\_(ツ)_/¯` sprinkled in with some best-effort fallback logic.

Before implementing this, you should ask yourself whether you're actually comfortable using anything other than the exact version of a subresource that a page asks for. That answer might depend on what type of subresource is being requests—using an outdated CSS file or versioned image is likely to be a lot "safer" than using an old JS file containing crucial business logic. You should only adopt fallback logic when you're comfortable with that risk.

Assuming you are comfortable with falling back to a different version, being able to translate a versioned URL into the underlying logical resource makes things straightforward:

- Attempt to read the requested version of a given resource from some combination of the cache or network, depending on which runtime caching strategy you're using.
- If that fails for any reason, get the "unversioned" filename for the URL you're requesting.
- Iterate through all the cache keys, getting the "unversioned" filename of each entry.
- If there's a match, use that cached response to fulfill the original request.
- Otherwise, the request can't be fulfilled.

## Packaging this up

I've been using this logic for my current service worker setup, packaged in a [standalone Workbox plugin](https://github.com/jeffposnick/jeffy-info/blob/cf-worker/src/service-worker/shared/revisionedAssetsPlugin.ts).

If you've never tried writing a Workbox plugin before, we've got some [basic info in our docs](https://developers.google.com/web/tools/workbox/guides/using-plugins), and I recorded a video for last year's Chrome Dev Summit with more examples:

<iframe class="youtube-embed" src="https://www.youtube.com/embed/jR9-aDWZeSE" allowfullscreen frameborder="0" loading="lazy"></iframe>

The plugin takes advantage of the `cachedResponseWillBeUsed`, `cacheDidUpdate`, and `handlerDidError` strategy lifecycle methods to trigger all of the steps described above.

### Why not officially release the plugin?

While I think the code in the plugin works as intended, I'm still not happy about the ergonomics of using it. Specifically, there's a lot of logic hardcoded in it related to the naming conventions that I'm using for my hashed URLs, and that won't work for sites that do something different, like include hashes in the middle of their filenames.

What's needed to clean this up a bit is to allow the plugin to take in a function that will translate from versioned filenames to unversioned, allowing folks to use this without requiring them to adopt a specific naming convention. My current usage assumes you can just do `hashedFilename.substring(HASH_CHARS + 1)`, but folks might need to use a regular expression to obtain the original filename, or split on specific delimiter characters.

In the meantime, feel free to borrow the code from [that plugin](https://github.com/jeffposnick/jeffy-info/blob/cf-worker/src/service-worker/shared/revisionedAssetsPlugin.ts) and adapt the logic by hand to accommodate your current naming conventions.
