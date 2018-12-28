---
layout: post.jstl
title: "Service workers in create-react-app v2"
date: 2018-10-10 20:00:00
excerpt: "There are many alternatives, and something has to be the default."
tags:
  - cra
  - post
  - web
  - workbox
permalink: "/{{ page.date | date: '%Y/%m/%d' }}/{{ page.fileSlug }}.html"
---

Spurred on by [this Twitter thread](https://twitter.com/AdamRackis/status/1050176700150108160), I wanted to share some thoughts in a longer forum than Twitter would allow.

Here's my thinking:

These are all equally valid end-states, based on the tradeoffs that make sense for each developers' use case:

`1)` Precache HTML in a SW, and get the benefits of navigation being reliably fast.

`1a)` Use `skipWaiting: false` to ensure that precached assets are updated eventually, once all the existing tabs controlled by the old SW are closed. A recipe like [this one](https://developers.google.com/web/tools/workbox/guides/advanced-recipes#offer_a_page_reload_for_users), which could ideally be added to `c-r-a`, can make this a better UX.

`1b)` Use `skipWaiting: true` to ensure that precached assets are updated immediately, with the understanding that this can mess up lazy-loading. (Maybe you already have fallback logic to deal with flaky lazy loading.)

`2)` Use a SW that doesn't precache your HTML, but potentially offers some other benefits, like runtime caching of subresources, or displays a custom "you're offline" web page.

`3)` Don't use a SW at all.

Ideally developers would have the flexibility to choose which state to be in. The SW integration in `c-r-a` is tricky, because the configuration is (for obviously valid reasons) locked down to the points where choosing being those options is non-trivial. That makes it important to ship with the right default behavior, one that will strike a balance between providing benefits to the user with minimal negative side effects.

`c-r-a` v1 shipped with `1b)` by default, with the only "escape hatch" to change some runtime code and avoid registering a SW. In retrospect, that wasn't a great default.

`c-r-a` v2 shipped with `3)` by default, with developers who explicitly opt-in ending up in `1a)`. I think that's a saner/safer default, but it might not be the right fit for all developers.

`2)` is interesting, and I don't want to say that that kind of SW is inappropriate. It's just that it really requires a level of SW configuration that you can't default to in a locked-down environment like `c-r-a`.

If developers [have the ability](https://github.com/facebook/create-react-app/issues/5359) to configure Workbox without needing to `eject`, I think they'll have the tools they need to choose any of those end states.

I haven't done a great job of updating the `c-r-a` docs to explain all that, and that's on me to take care of. (Update: [here's a PR](https://github.com/facebook/create-react-app/pull/5410) that will hopefully help.)
