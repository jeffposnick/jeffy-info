---
layout: post
title: "CDS Perf Review Clinic Takeaways"
date: 2017-11-10 12:00:00
excerpt: "A linkdump by any other name...."
tags: web performance workbox cds
---

# CDS '17 Retrospective

[Chrome Dev Summit 2017](https://developer.chrome.com/devsummit/) is behind us.
I spent most of the run-up to the event putting together my
["Workbox: Flexible PWA Libraries" talk](https://www.youtube.com/watch?v=DtuJ55tmjps),
but beyond that, I was also involved in [running on-site Performance Review
Clinics](https://twitter.com/jeffposnick/status/922899094053330944) that
attendees could sign up for.

It's always a privilege to meet with the developers who are building web apps
that I use every day, and to lend whatever guidance I could offer. Looking into
the performance of a large group of production websites gives insights that you
wouldn't get from just examining a site as a one-off. Patterns start to emerge
about common areas for improvement.

I wanted to publicly share a few high-level groupings based on those patterns,
and identify a handful of links for each area that contain useful guidance. It's
by no means exhaustive, but I can say that each of these links contains
solutions to a real-world performance issue that we identified during the
Performance Review Clinics.

# Linkdump!

Huge thanks go out to all the authors, many of whom I'm lucky enough to work
with.

## Overall Migration/End to End Case Study
- [A React And Preact Progressive Web App Performance Case Study: Treebo](https://medium.com/dev-channel/treebo-a-react-and-preact-progressive-web-app-performance-case-study-5e4f450d5299)

## Loading and Prioritization
- [Introduction to HTTP/2](https://developers.google.com/web/fundamentals/performance/http2/)
- [Resource Prioritization – Getting the Browser to Help You](https://developers.google.com/web/fundamentals/performance/resource-prioritization)
- [Deep dive into the murky waters of script loading](https://www.html5rocks.com/en/tutorials/speed/script-loading/)


## JavaScript
- [Can You Afford It?: Real-world Web Performance Budgets](https://infrequently.org/2017/10/can-you-afford-it-real-world-web-performance-budgets/)
- [JavaScript Start-up Performance](https://medium.com/reloading/javascript-start-up-performance-69200f43b201)

## CSS
- [`critical`: Extract & Inline Critical-path CSS in HTML pages](https://github.com/addyosmani/critical)
- [The future of loading CSS](https://jakearchibald.com/2016/link-in-body/)
- [`loadCss`: A function for loading CSS asynchronously](https://github.com/filamentgroup/loadCSS/)

## Caching
- [HTTP Caching](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/http-caching)
- [Caching best practices & max-age gotchas](https://jakearchibald.com/2016/caching-best-practices/)
- [Service Workers: an Introduction](https://developers.google.com/web/fundamentals/primers/service-workers/)
- [Workbox: JavaScript libraries for Progressive Web Apps](https://developers.google.com/web/tools/workbox/)

## Images/Multimedia Content
- [Essential Image Optimization](https://images.guide/)
- [Lazy Loading Images Using Intersection Observer](https://deanhume.com/home/blogpost/lazy-loading-images-using-intersection-observer/10163)
- [Inline SVG vs Icon Fonts [CAGEMATCH]](https://css-tricks.com/icon-fonts-vs-svg/)
- [Content Jumping (and How To Avoid It)](https://css-tricks.com/content-jumping-avoid/)
- [A Better Method for Embedding YouTube Videos on your Website](https://www.labnol.org/internet/light-youtube-embeds/27941/)
