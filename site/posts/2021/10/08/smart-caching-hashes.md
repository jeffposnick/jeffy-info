---
title: 'Smarter runtime caching of hashed assets'
excerpt: 'Why keep app.34abf34a.js when app.78dd13ee.js will do?'
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

Now that we have a well-defined way to translate from a hashed URL to the corresponding original filename, there's a straightforward approach to ensuring that we don't indefinitely cache out of date versions of the same asset. After adding a new entry to the runtime cache, we can iterate though all the previously cached URLs, find any that correspond to the same "unversioned" filename, and delete them.

We're operating on the assumption that the newly cached hashed URL is the definitive version that should be kept around, and hopefully there isn't any other cache entries that refer to the soon-to-be-deleted hashed URL. (If there are, we'll cover how to handle that in the next section.)

The code for this check could look something like:

```typescript
function filterPredicate(
  hashedURL: string,
  potentialMatchURL: string,
): boolean {
  const hashedFilename = parseFilenameFromURL(hashedURL);
  const hashedFilenameOfPotentialMatch =
    parseFilenameFromURL(potentialMatchURL);

  return (
    getOriginalFilename(hashedFilename) ===
    getOriginalFilename(hashedFilenameOfPotentialMatch)
  );
}
```
