---
title: How do you test a service worker, anyway?
excerpt: Opinions about how and what to test in your progressive web app.
tags:
  - post
---

## Wait, should I be testing my service worker?

If you're building a [progressive web app](https://web.dev/progressive-web-apps/), and you're not exercising your [service worker](https://developer.chrome.com/docs/workbox/service-worker-overview/)'s behavior, you might have a gap in your overall test coverage. How high this ranks on the near-infinite list of things you _could_ be testing depends on a number of things, including how important your service worker's behavior is to your core user experience.

If you're using [Workbox](https://developer.chrome.com/docs/workbox/), with mostly out-of-the-box default configuration options for your service worker's implementation, you might feel comfortable without a dedicated test suite, with the understanding that Workbox itself has an extensive [set of tests](https://github.com/GoogleChrome/workbox/tree/v6/test) for common usage patterns.

But if you're writing a service worker from scratch, if you're using one of Workbox's more exotic plugins or custom strategies, or if your service worker's behavior is particularly important to your overall user experience, developing a test suite dedicated to your service worker can give you an important peace of mind.

### What kind of service workers are we talking about?

The [service worker runtime environment](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) has undergone an explosion of usage recently, with adaptations of the original environment spring up on the [server](https://workers.js.org/), or in [Manifest v3 extensions](https://developer.chrome.com/docs/extensions/mv3/migrating_to_service_workers/). This blog post discusses on tests that are important for "traditional" service-worker-in-the-browser use cases, focusing on caching and offline use cases.

## What should I use to run my tests?

I recommend writing your tests against Microsoft's [Playwright](https://playwright.dev/) environment, though if you have an existing framework set up for integration/end-to-end testing, you can probably get away with using that instead.

I've found Playwright to be the best supported, most modern choice for running tests directly in "real" browser runtimes, across Chrome, Safari, and Firefox. While cross-browser compatibility for the service worker runtime is generally much better than it was in the past, if you're taking the time to test your service worker, you might as well ensure that there aren't edge cases due to, e.g., bugs in IndexedDB or reliance on service worker features that aren't yet in all three browser engines.

Some service worker tests might rely on, say, triggering a series of navigations and then checking cache state, and in my experience, Playwright has done a good job of orchestrating that type of behavior in a consistent fashion across browsers. This means fewer flaky tests, or tests that need to be skipped in specific browsers.

Throughout this post, I'll include inline examples that assume usage of Playwright.

## Waiting for the right moment

A common pain point, leading to flakiness, retries, and awkward hardcoded calls to `setTimeout()`, is due to the asynchronous nature of most things having to do with service workers and the [cache storage API](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage). Throughout your test suite, you'll find yourself needing to delay execution of the next bit of code until some previous async operation has completed.

Here are a few scenarios where timing comes into play, along with tips on how to wait for the right moment.

### Testing state after installation

A service worker might precache a set of URLs during [installation](https://web.dev/service-worker-lifecycle/#install), or add data to IndexedDB. To confirm that a given page registers a service worker which in turns performs those installation activities, it's important to delay examining the state until installation is complete. The simplest way to do this is to wait until the [`navigator.serviceWorker.ready` promise](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/ready) resolves, at which point you're guaranteed that there is a service worker that's completed installation (and activation, though testing post-activation state is less common).

```js
import {test, expect} from '@playwright/test';

test('post-install state', async ({baseURL, page}) => {
	// Navigate to a page which registers a service worker.
	await page.goto('/');

	// await the navigator.serviceWorker.ready promise.
	const swURL = await page.evaluate(async () => {
		const registration = await navigator.serviceWorker.ready;
		return registration.active?.scriptURL;
	});
	// Confirm the expected service worker script installed.
	expect(swURL).toBe(`${baseURL}sw.js`);

	// Now you're ready to check cache or IndexedDB state.
});
```

### Testing network request interception

If you're interested in testing [`fetch` handler](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/fetch_event) behavior, i.e. how your service worker responds to network requests from a client page, waiting on `navigator.serviceWorker.ready` is not a good idea. That promise resolves as soon as there's an active service worker, but even if you're calling [`clients.claim()`](https://web.dev/service-worker-lifecycle/#clientsclaim) within your service worker's [`activate` handler](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/activate_event), there's a small gap of time before an active service worker takes control of existing clients. If you don't account for this, you may end up triggering a network request that isn't intercepted by your service worker, leading to tests that don't exercise the code you expect.

While there's [no built-in equivalent](https://github.com/w3c/ServiceWorker/issues/799) to `navigator.serviceWorker.ready` that resolves when the current page is controlled by a service worker, you can explicitly [create a promise](https://github.com/w3c/ServiceWorker/issues/799#issuecomment-165499718) that accomplishes the same thing.

```js
import {test, expect} from '@playwright/test';

test('fetch handler behavior', async ({page}) => {
	// Navigate to a page which registers a service worker.
	await page.goto('/');

	// await a promise that resolves when the page is controlled.
	// Ensure you include clients.claim() in your activate handler!
	await page.evaluate(async () => {
		await new Promise((resolve) => {
			if (navigator.serviceWorker.controller) {
				// If we're already controlled, resolve immediately.
				resolve();
			} else {
				// Otherwise, resolve after controllerchange fires.
				navigator.serviceWorker.addEventListener('controllerchange', () =>
					resolve(),
				);
			}
		});
	});

	// Now calls to page.evaluate() which make network requests will
	// be intercepted by the service worker's fetch handler.
});
```

### Testing logic outside of respondWith()

Every `fetch` handler needs to include [`fetchEvent.respondWith()`](https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent/respondWith). Once this method is called, response headers and a promise for the response body is made available to the controlled client that triggered the `fetch` event.

However, your `fetch` handler might perform other activities independent of the call to `fetchEvent.respondWith()`—for instance, cleaning up outdated cache entries after caching a new response. (If these activities are asynchronous, they would normally be wrapped in a call to [`fetchEvent.waitUntil()`](https://developer.mozilla.org/en-US/docs/Web/API/ExtendableEvent/waitUntil) to ensure that the service worker is kept alive until they complete.)

Most developers won't have logic that executes in a `fetch` handler outside the `fetchEvent.respondWith()` that they need to test. But if you do find yourself needing to do so, be careful not to _only_ wait on the client's `fetch()` that triggered the behavior to resolve. A client's `fetch()` will resolve immediately after the controlling service worker's `fetch` handler calls `fetchEvent.respondWith()`, and that might happen before the other asynchronous work is completed.

So, what do you do if you want to delay your test execution until after additional code has run? One solution is to have a client wait for a `message` event, triggered by the service worker calling `postMessage()` upon completion of the additional work. (Since this `postMessage()` is only useful for test orchestration, you might want to wrap it in an `if()` statement that checks for a specific [`process.env` value](https://playwright.dev/docs/test-parameterize#env-files), and is minimized away if that value isn't set.)

```js
// Example service worker code:
self.addEventListener('fetch', (e) => {
  // When this executes, the client's fetch() promise resolves.
  e.respondWith(...);

  const additionalWork = async () => {
    // Perform cache cleanup, etc.
    const client = await clients.get(e.clientId);
    // Send a message back to the client to signal completion.
    client.postMessage({...});
  };
  e.waitUntil(additionalWork());
});
```

```js
import {test, expect} from '@playwright/test';

test('extra fetch handler behavior', async ({page}) => {
	// Navigate to a page which registers a service worker.
	await page.goto('/');

	// await a promise that resolves when the page is controlled.
	// Ensure you include clients.claim() in your activate handler!
	await page.evaluate(async () => {
		const [message, response] = await Promise.all([
			new Promise((resolve) => {
				navigator.serviceWorker.addEventListener(
					'message',
					(e) => resolve(e.data),
					{once: true},
				);
			}),
			fetch('/url/to/test'),
		]);
		// Optionally do something to serialize response or message
		// and return it from the page.evaluate().
	});

	// Now the service worker's fetch handler has finished everything.
});
```

## Cache expectations

In addition to the async-related nuances we just talked about, another stumbling block when writing service worker tests is how to ensure that a client's cache ends up in the expected state.

### Getting the current global cache state

There's no [cache storage API](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage) method that will return the full state of all caches in a single go. Additionally, the code that interrogates the cache will need to run inside of Playwright's [`page.evaluate()` method](https://playwright.dev/docs/evaluating), so only [serializable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#description) values can be returned to the `test()` execution context—[`Request` objects](https://developer.mozilla.org/en-US/docs/Web/API/Request) are used as cache storage keys, and they are not serializable. This means that getting the current cache state to use within an `expect()` assertion is a multi-step process.

```js
import {test, expect} from '@playwright/test';

test('service worker install caching', async ({baseURL, page}) => {
	await page.goto('/');

	// Wait until the service worker has finished installing.
	const swURL = await page.evaluate(async () => {
		const registration = await navigator.serviceWorker.ready;
		return registration.active?.scriptURL;
	});
	expect(swURL).toBe(`${baseURL}sw.js`);

	const cacheContents = await page.evaluate(async () => {
		const cacheState = {};
		for (const cacheName of await caches.keys()) {
			const cache = await caches.open(cacheName);
			const reqs = await cache.keys();
			// Use the req.url string value, not an unserializable Request.
			// sort() allows the array to be used for stable comparisons.
			cacheState[cacheName] = reqs.map((req) => req.url).sort();
		}
		return cacheState;
	});

	// cacheContents now contains a mapping of cache names to an
	// sorted array of URL strings contained in the cache.
	expect(cacheContents).toEqual({
		'precache-v1': [
			`${baseURL}assets/app.js`,
			`${baseURL}assets/index.css`,
			// etc.
		],
	});
});
```

### Comparisons of hashed URLs

Checking cache state using strict equality assertions can be a problem if your web app caches [hashed URLs](https://bundlers.tooling.report/hashing/). While it's possible to update your test expectations every time any of your assets' contents change, you risk noise from failing tests if you ever forget.

A more flexible approach is to replace the hash portion of your URLs with a stable placeholder, and then compare those normalized URLs against strings that also use the same placeholder. Since I couldn't find an existing module that would accomplish this, and since I already had a [different use case](​​/smart-caching-hashes.html) for the same functionality, I published the [`remove-filename-hash` module](https://github.com/jeffposnick/remove-filename-hash) to package up the reusable logic.

`remove-filename-hash` is flexible enough to deal with hashes using any character set, of any length, found anywhere in a URL or filename string. It works in any runtime environment that supports RegExp match indices.

Since a sample that illustrates the full cache comparison test is fairly long, you can take a look at a [representative Playwright test on GitHub](https://github.com/jeffposnick/yt-playlist-notifier/blob/396624c7f3471ad2bf713b87579be60572ba0c64/tests/sw.spec.ts) for inspiration.
