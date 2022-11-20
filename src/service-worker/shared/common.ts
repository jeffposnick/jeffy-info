/// <reference lib="webworker"/>

import {registerRoute, setDefaultHandler} from 'workbox-routing';
import {NetworkOnly} from 'workbox-strategies';
import {strategy as streamingStrategy} from 'workbox-streams';

import {URLPatternMatcher} from './URLPatternMatcher';
import * as Templates from './templates';
import site from '../../../site/site.json';
// This needs to be generated at build time prior to bundling.
import assetManifest from '../../../dist/asset-manifest.json';

export type StaticLoader = (
	event: FetchEvent,
	urlOverride?: string,
) => Promise<Response>;

export function registerRoutes(loadStatic: StaticLoader) {
	registerRoute(
		new URLPatternMatcher({pathname: '/'}).matcher,
		streamingStrategy(
			[
				() => Templates.Start({assetManifest, site}),
				async ({event}: {event: ExtendableEvent}) => {
					const jsonURL = `/static/collections.json`;
					try {
						const response = await loadStatic(event as FetchEvent, jsonURL);

						if (response?.ok) {
							const collections = await response.json();
							return Templates.Index({assetManifest, collections, site});
						}

						throw new Error('Unable to load static resource.');
					} catch (err) {
						return Templates.Error({assetManifest, site, url: jsonURL});
					}
				},
				() => Templates.End({assetManifest, site}),
			],
			{
				'content-type': 'text/html',
			},
		),
	);

	registerRoute(
		new URLPatternMatcher({pathname: '/(.*).html'}).matcher,
		streamingStrategy(
			[
				() => Templates.Start({assetManifest, site}),
				async ({
					event,
					params,
				}: {
					event: ExtendableEvent;
					params?: Record<string, any>;
				}) => {
					const post = params!.pathname.groups[0];
					const jsonURL = `/static/${post}.json`;
					try {
						const response = await loadStatic(event as FetchEvent, jsonURL);

						if (response?.ok) {
							const json = await response.json();
							return Templates.Page({
								assetManifest,
								site,
								...json,
							});
						}

						throw new Error('Unable to load static resource.');
					} catch (err) {
						return Templates.Error({assetManifest, site, url: jsonURL});
					}
				},
				() => Templates.End({assetManifest, site}),
			],
			{
				'content-type': 'text/html',
			},
		),
	);

	// Mastodon API calls should be network-only.
	registerRoute(
		({sameOrigin, url}) => !sameOrigin && url.pathname.startsWith('/api'),
		new NetworkOnly(),
	);

	setDefaultHandler(({event}) => loadStatic(event as FetchEvent));
}
