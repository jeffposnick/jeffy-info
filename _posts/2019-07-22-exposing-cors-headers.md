---
layout: default.njk
title: "Exposing headers on CORS responses"
date: 2019-07-22 12:00:00
excerpt: "Access-Control-Expose-Headers is your friend."
tags:
  - cors
  - javascript
  - post
  - workbox
permalink: "/{{ page.date | date: '%Y/%m/%d' }}/{{ page.fileSlug }}.html"
---

## CORS and its discontents

The concept of [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) requests comes up a lot in my professional life. Much of the time, it's in the context of why a given response is [opaque](https://stackoverflow.com/questions/39109789/what-limitations-apply-to-opaque-responses), and how to make that response non-opaque so that it plays nicely with service workers and the Cache Storage API.

Fortunately, many popular third-party APIs and hosts support CORS nowadays, and solving your basic CORS-related mystery normally boils down to, say, adding in the [`crossorigin` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes) to your `<img>` tags.

## When CORS is not enough

But while enabling CORS is enough to get back basic information about an HTTP response—like its status code, or access to its body—there's still some information that's locked down by default. The headers exposed on a CORS response, for instance, are limited to the following six ["simple" response headers](https://developer.mozilla.org/en-US/docs/Glossary/Simple_response_header):

- `Cache-Control`
- `Content-Language`
- `Content-Type`
- `Expires`
- `Last-Modified`
- `Pragma`

Some of those headers can come in handy when accessed inside of a service worker, but there's one in particular that can be useful, but isn't exposed by default: `Date`.

In particular, if you're using [Workbox's cache expiration](https://developers.google.com/web/tools/workbox/modules/workbox-cache-expiration#restrict_the_age_of_cached_entries) logic and you provide a `maxAgeSeconds` parameter, the `Date` of the cached response [is checked](https://github.com/GoogleChrome/workbox/blob/b0825d74d81264e7b4537ed170dd60de638561ba/packages/workbox-expiration/src/Plugin.ts#L176-L195) against the difference between the current time and `maxAgeSeconds`. If the `Date` is too old, then the cached response will end up being ignored.

But... this logic only works if there's a `Date` header exposed on the response. By default, that won't be the case for a CORS response.

## Exposition

The workaround, as with so many things related to CORS, involves fiddling with HTTP response headers. You'll either need access to the underlying HTTP server yourself, or you'll need to reach out to your CDN/API provider asking them to make the change.

Setting [`Access-Control-Expose-Headers: Date`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers) will permit the `Date` response header to be visible to your web app's code, and you could include any additional headers there in a comma-separated list.

If you're using your own Express-based web server, the [`corser` middleware](https://www.npmjs.com/package/corser) looks pretty reasonable for setting up a working configu ration. Their docs include a [recipe](https://www.npmjs.com/package/corser#getting-a-response-header-returns-refused-to-get-unsafe-header-x) for configuring the exposed response headers.

## Live demo

Here's a quick demonstration, separate from service workers, and using the fantastic [https://httpbin.org](https://httpbin.org) service to control the `Access-Control-Expose-Headers` response header that's returned in a simulated API response. (They support CORS by default, so nothing need to be done to enable that.)

Check out the log messages in the JavaScript console to see which headers are visible in the response.

<button id="request-without-aceh">Without Access-Control-Expose-Headers: Date</button>

<button id="request-with-aceh">With Access-Control-Expose-Headers: Date</button>

<script>async function logResponseHeaders(url) {
  console.log('here');
  // mode: 'cors' is the default, but let's just be explicit here.  
  const response = await fetch(url, {mode: 'cors'});
  console.log(`Response headers for ${url}:\n`, ...response.headers);
}

document.querySelector('#request-without-aceh').addEventListener(
  'click',
  () => logResponseHeaders('https://httpbin.org/response-headers')
);

document.querySelector('#request-with-aceh').addEventListener(
  'click',
  () => logResponseHeaders('https://httpbin.org/response-headers?Access-Control-Expose-Headers=Date')
);</script>

