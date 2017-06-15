---
layout: post
title: "Offline-first for Your Templated Site (Part Two)"
date: 2017-01-24 22:00:00
excerpt: "Full-page caching vs. App Shell vs. service worker rendering."
tags: pwa offline service-worker jekyll app-shell caching
---

_This is the second part of a planned three-part series._

_Part [one](https://jeffy.info/2016/11/02/offline-first-for-your-templated-site-part-1.html) covered some basic terminology an setup that's referenced throughout this post._

_Part three will dive into a specific service worker implementation that can be
used to provide an offline-first experience for a Jekyll-based site._

_Folks who can't wait for part three are welcome to check out the
[https://jeffy.info](https://jeffy.info)
service worker [implementation](https://github.com/jeffposnick/jeffposnick.github.io/tree/work/src)
ahead of time._

_I also covered the material in this blog post in a presentation at the
[{static is} The New Dynamic Meetup](https://www.meetup.com/JAMstack-nyc/events/236530076/):_

<iframe class="youtube-embed" src="https://www.youtube.com/embed/_kJMjJ1tm6o" allowfullscreen frameborder="0"></iframe>

# Decisions, decisions

With those preliminary definitions out of the way, we can focus on the question at hand: how do you provide an offline-first experience for your templated site?

I'm going to outline three different approaches, each with their own benefits and drawbacks. Choosing the right approach requires balancing various tradeoffs, and the aim of this post is to walk through the plusses and minuses of each strategies, so that you can make an informed decision about what works best for your site.

# Option 1: Cache entire HTML documents

## How it works

This approach uses the [Cache Storage API](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage) to keep a copy of the fully rendered HTML document that corresponds to each URL. The documents might be precached when the service worker is installed, or the caches might be populated via a runtime caching strategy that adds to the cache as users browse from page to page.

## Benefits

### Service worker simplicity

The service worker needed to implement this type of strategy is *relatively* straightforward. The `fetch` handler can check to see whether `event.request.mode === 'navigate'`, and if so, use a [stale-while-revalidate strategy](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#stale-while-revalidate) to handle the request for the HTML document.

### Minimal additional maintenance

While you need to create and deploy a service worker script, there isn't anything additional that you need to deploy and maintain. The same HTML documents that you've previously generated and deployed can continue to be served the same way.

### Multiple layout template flexibility

Instead of a single layout template, some sites might find themselves using multiple layouts to generate the final HTML. For example, all documents served from the URL prefix `/blog/` might use `blog_layout.tmpl`, while all documents served from under `/news/` might use `news_layout.tmpl`.

Because the complete HTML documents are stored and retrieved from the cache, the service worker doesn't need any special knowledge about which underlying layout was used to generate the page.

That also means that a subset of URLs that aren't generated via templating at all—perhaps a site's `about.html` page, for instance—can be handled via the same logic used for all the other URLs.

## Drawbacks

### Cache overhead

Let's return to our diagram of the "[smushening](https://jeffy.info/2016/11/02/offline-first-for-your-templated-site-part-1.html#the-process-that-smushes-together-the-templates-and-the-contents-and-outputs-a-final-html-document)" process, which takes our template, combines it with each of our individual content files, and then results in a complete HTML document:

<img src="/assets/images/2016-11-02/smushening.svg" alt="A layout + content = final pages" class="half-width">

The `blog_layout.tmpl` file is used to generate each of the final HTML documents, and that means that the size of each HTML file is roughly equal to the size of the template file plus the size of the page-specific content.

If your template file is `X` bytes, and your have `N` output HTML files, you're incurring `X * N` bytes of duplicated cache contents, due to size of the templated portion of each final HTML document.

If `X` is a fairly small number (a template file of less than 1kb is common) and/or `N` is small (say, only a few dozen unique HTML files), then the amount of cache storage used is negligible. However, if you're using larger templates, or you know that you have hundreds or even thousands of HTML pages that a user might have cached, the overhead can start impacting those users who are storage constrained.

### Messy updates

While the cache overhead isn't a showstopper, the compromises involved in updating previously cached content is more of a concern. Let's assume that we have `foo.html`, `bar.html`, and `foo_bar.html` HTML files stored in our cache.

If we were to make some updates to the `foo.md` content that's used to populate `foo.html`, our update strategy is to ensure that `foo.html` eventually gets refetched from the network. This might happen via a normal [stale-while-revalidate](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#stale-while-revalidate) flow, in which case the new content will only be available the *second* time a user revisits the page. Or it might happen by explicitly purging the existing `foo.html` entry from the cache ahead of time, making the new content available for the *next* visit.

But what if we make an update to `blog_layout.tmpl`? Maybe we've changed our navigation bar, or updated some header text. The impact of this change ripples beyond a single cache entry—*all* of our cached HTML files that depended on `blog_layout.tmpl` are now out of date.

We have the same options for dealing with this as before: let a stale-while-revalidate caching strategy gradually update the stale entries as users revisit pages, or proactively purge the out of date cache content, which in this case could mean invalidating our entire cache. There are serious downsides to each approach, though.

If we rely on a [stale-while-revalidate](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#stale-while-revalidate) runtime caching strategy to gradually update our cache, users will see inconsistencies across page navigations. The changes made to `blog_layout.tmpl` will only take effect after they revisit pages multiple times. If a user returns to a previously cached page months later, they'll still see your old layout, which can be jarring after they've gotten accustomed to seeing layout changes on fresh pages.

To avoid jarring your users, proactively purging *all* cached HTML that relies on a modified template is arguably the best approach. But now you're faced with another tradeoff: the performance and offline benefits of caching are diminished if users' caches are invalidated frequently. The effort that you put into implementing a caching strategy is wasted if you have to throw your entire cache away due to even small updates to your site's layout.

## Real-world examples

A number of my colleagues, including [Matt Gaunt](https://gauntface.com/blog/), [Paul Kinlan](https://paul.kinlan.me), and [Sérgio Gomes](https://sgom.es/), are using this option for their blogs.

# Option 2: Use an Application Shell architecture

## How it works

The Application Shell architecture is covered in great detail in [this article](https://developers.google.com/web/fundamentals/architecture/app-shell) by Addy Osmani and Matt Gaunt. My talk from the 2015 Chrome Dev Summit also covers similar ground, for those who prefer video:

<iframe class="youtube-embed" src="https://www.youtube.com/embed/jCKZDTtUA2A" allowfullscreen frameborder="0"></iframe>

While the Application Shell architecture is often talked about in reference to "web apps," it's definitely applicable to the types of templated "content sites" that we're talking about here.

The general approach is to repurpose your existing page structure, i.e. what's defined in your `blog_layout.tmpl` template, to serve as your Application Shell. This should be a valid, standalone HTML file (let's call it `shell.html`) that includes a placeholder element that the dynamic content gets inserted into at runtime, via client-side templating.

The dynamic content could be the same raw content sources—`foo.md`, `bar.md`, etc.—in which case the Application Shell's JavaScript would need to [convert](https://github.com/markdown-it/markdown-it) the content to HTML at runtime, prior to inserting it into the DOM. Or you might go through an additional step and convert the raw content into HTML snippets via a server-side process, in which case the content snippets can be inserted directly into the DOM at runtime.

You can use either a precaching or a runtime caching strategy like [stale-while-revalidate](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#stale-while-revalidate) to keep both `shell.html` and the underlying content up to date, while still serving them cache-first.

## Benefits

### Clean updates

Your structural HTML (`shell.html`) and your content are cached independently, so when you make changes to a page's content or to your site's layout elements, cache invalidation is simple and efficient. The only cache entries that need to be updated is either the content itself, or the entry for `shell.html`. If `shell.html` does get updated, then the updates will immediately apply to all pages on your site that share that Application Shell, ensuring that your site looks the same as the user moves from page to page. You eliminate the risk of a months-old cached page being shown, jarring a user with an inconsistent layout.

### Low-overhead precaching

Using this architecture opens the door to precaching more of your site's content. Larger precache coverage means that pages a user hasn't previously navigated to will still work offline and load quickly. There are two reasons why aggressive precaching is more viable:

First, each piece of content can be cached as-is, independent of the App Shell's HTML. The [cache overhead](#cache-overhead) concerns with full-page caching don't apply, and as a developer, you don't have to worry about wasting as much bandwidth and space as you would if you were precaching full HTML documents.

Second, and more importantly, [clean updates](#clean-updates) mean that you're much less likely to end up throwing away data once it's been precached. The only time you'd have to expire and redownload precached content is if that specific content is updated. A substantial precache payload is makes much less sense if you know that it will all end up expired each time you tweak your site's template.

## Drawbacks

### Routing logic in your service worker

In the Application Shell model, your service worker needs to have special logic in place to handle [navigation requests](https://html.spec.whatwg.org/#navigating-across-documents). While the incoming request might be for a URL like `https://example.com/2016/12/foo.html`, your service worker needs to respond with your cached `shell.html` document, not with `foo.html` (which won't be cached in this model). Your Application Shell is then responsible for performing client-side templating and inserting the correct content into the DOM, based on whatever the request URL is.

This works fine when you only have one common layout, defined in `shell.html`, that's shared by all the pages on your site. But if there's a subset of pages on your site that use completely different layouts, like `https://example.com/about.html`, your service worker needs to know *not* to respond to those navigation requests with `shell.html`.

Your service worker is now an HTTP router, examining incoming navigations requests and serving the right type of response for each URL. If there's a simple URL pattern that can be used to match all of the requests that can be handled with the `shell.html` layout, then you're in good shape—something like the following might suffice:

```
self.addEventListener('fetch', event => {
  const yearMonthPrefix = new RegExp('/\d{4}/\d{2}/');
  if (event.request.mode === 'navigation') {
    if (event.request.url.matches(yearMonthPrefix)) {
      // Use the Application Shell to handle requests like
      // https://example.com/2016/12/foo.html
      event.respondWith(caches.match('shell.html'));
    } else {
      // Use an appropriate runtime caching strategy, like
      // stale-while-revalidate, to handle requests like
      // https://example.com/about.html.
    }
  } else {
    // Use an appropriate runtime caching strategy for
    // non-navigation requests, like requests for
    // images or other resources.
  }
});
```

But if you don't have that level of consistency in your URL structure, of if there's a subset of pages that fall under the `/year/month/` prefix but use a completely different template, accurately reflecting that routing logic in your service worker gets much trickier and you need to construct a bespoke solution.

### Duplicated effort

If you've already got a templated site, adopting the Application Shell architecture will usually mean duplicating pieces of your existing infrastructure. You need to take your `blog_layout.tmpl` and convert it into a `shell.html` file, adding to it the necessary client-side templating logic to populate your shell.

You might also need to add in a build step that takes original Markdown sources and converts them to HTML snippets, in in lieu of having to perform that Markdown conversion inside your Application Shell.

Finally, if your site relies on any sort of custom routing or templating rules that are implemented server-side, that routing logic needs to be moved into your service worker, as explained in the [previous section](#routing-logic-in-your-service-worker).

This duplication means that there are more opportunities for pieces of your site to get out of sync. If you make changes to your `blog_layout.tmpl`, but the corresponding changes aren't made to `shell.html`, then browsers which lack service worker support will see one thing, while browsers that have a service worker responding with your Application Shell will see something else. Similar issues could arise if your routing rules need tweaking—they could potentially need to be changed in *three* places (server-side, client-side in [SPA-style](https://en.wikipedia.org/wiki/Single-page_application) JavaScript, and client-side in service worker JavaScript) depending on how complicated your routing needs are. Trisomorphic routing: it's actually A Thing!

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr"><a href="https://twitter.com/adactioJournal">@adactioJournal</a> Shows there are fantastic opportunities, though. I&#39;ve yet to see someone nail &quot;trisomorphic&quot; routing (server + JS + SW).</p>&mdash; Nolan Lawson (@nolanlawson) <a href="https://twitter.com/nolanlawson/status/735469605238509569">May 25, 2016</a></blockquote>

<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

Proper automation of your build process can ensure that the overhead and risk of duplicated pieces getting out of sync is minimal, but that's one more thing to keep track of.

## Real-world examples

The [iFixit PWA](https://ifixit-pwa.appspot.com/) sample (the [source](https://github.com/GoogleChrome/sw-precache/tree/master/app-shell-demo) of which is part of the [sw-precache project](https://github.com/GoogleChrome/sw-precache)) is an Application Shell populated with dynamic content from the [iFixit API](https://www.ifixit.com/api/2.0/doc/).

# Option 3: Service worker templating

## How it works

With this approach, you take the logic needed to smush together your templates and content and implement it within your service worker.

This doesn't mean that you'd do away with your site's existing build process, though. You can't assume that when a user visits your site there's going to be an active service worker, so you still need to serve complete HTML pages via your normal web server. But when a user returns to your site using a browser that supports service workers, they no longer have to request those complete HTML pages in order to display your site. They should already have your site's templates cached, and they may or may not have the page's content cached as well. So, at worst, only a very minimal amount of page-specific content needs to be requested, and at best, your service worker can assemble the complete HTML immediately, without having to go to the network at all.

## Benefits

### Clean updates and low-overhead precaching

Both the [clean updates](#clean-updates) and [low-overhead precaching](#low-overhead-precaching) benefits of the App Shell model apply here, as well.

### No need to adopt Single Page App patterns

While the App Shell approach might seem familiar to developers who are familiar with writing client-side JavaScript and using the [Single Page App](https://en.wikipedia.org/wiki/Single-page_application) (SPA) pattern, not every developer who manages a templated site with be comfortable with that model. You don't have to write and deploy a SPA when you use the service worker templating option, but you end up with most of the same benefits.

(Of course, there's a significant engineering effort required to properly implement service worker templating, but it's a different kind of effort…)

## Drawbacks

### A JavaScript-friendly templating system is a must

This approach is only viable if you're using a templating system that has a JavaScript implementation. And because the code will be run inside of a service worker, JavaScript code that requires features specific to the node environment, like filesystem support, won't work.

Fortunately, the JavaScript ecosystem is vibrant, and there's a decent chance that you'd [find](https://npms.io/search?q=template) a JavaScript implementation of many templating systems. Running the JavaScript code through [browserify](https://github.com/substack/node-browserify) can often smooth over the differences between the node and service worker runtime environments.

### Heavyweight service worker code

In order to get your templating system working inside of your service worker, you'll almost certainly need to bundle in a number of external dependencies. Compared to a svelte service worker that implements a basic runtime caching strategy, you'll need to transfer more bytes of JavaScript each time your service worker is fetched from the network.

Your service worker is almost certainly going to spend more time executing code, since the "[smushening](https://jeffy.info/2016/11/02/offline-first-for-your-templated-site-part-1.html#the-process-that-smushes-together-the-templates-and-the-contents-and-outputs-a-final-html-document)" process that would otherwise be done at build-time is effectively run within a user's browser each time it display a page. The amount of overhead that this adds depends on how efficient your JavaScript templating system is and how powerful each of your users' devices are.

### Routing logic in your service worker

This was covered in detail in the App Shell's drawbacks section; the same routing considerations apply here. The main difference is that instead of serving a cached `shell.html` file when the route matches, you need to kick off your templating logic when there's a matching navigation request.

### Duplicated effort

This is also similar to the drawback with using an App Shell. Using this approach requires that you continue to run the "[smushening](https://jeffy.info/2016/11/02/offline-first-for-your-templated-site-part-1.html#the-process-that-smushes-together-the-templates-and-the-contents-and-outputs-a-final-html-document)" process like you were previously doing, but then additionally start serving not only the final HTML documents, but also the unprocessed template and content files, since those pieces will need to be fetched and cached by the service worker. You'll need to make sure that whenever a template or content is updated, both the final HTML as well as the raw files are updated on your server.

You'll also probably end up duplicating some of the work that your current build process does to generate metadata about your site. For example, Jekyll maintains it own list of recent posts and uses it to populate the index page for a site. Your service worker needs similar data in order to construct the same page, so writing your own code to [generate](https://github.com/jeffposnick/jeffposnick.github.io/blob/work/gulpfile.js#L34) the metadata in a [format](https://raw.githubusercontent.com/jeffposnick/jeffposnick.github.io/master/posts.json) that your service worker could consume, and keeping that metadata in sync whenever you update your site, is now required.

## Real-world examples

My personal blog, [https://jeffy.info/](https://jeffy.info/), is currently using [service worker templating](https://github.com/jeffposnick/jeffposnick.github.io/tree/work/src). We'll dive into the specifics of how that's implemented in the next part of this series!
