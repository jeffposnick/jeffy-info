import {
	BASE64_URL_CHARACTER_CLASS,
	createRegExp,
	removeHash,
} from 'remove-filename-hash';
import type {WorkboxPlugin} from 'workbox-core';

import {HASH_CHARS} from '../../shared/constants';

function filterPredicate(
	hashedURL: string,
	potentialMatchURL: string,
): boolean {
	const regexp = createRegExp({
		after: '~',
		before: '/',
		characters: BASE64_URL_CHARACTER_CLASS,
		size: HASH_CHARS,
	});

	return (
		removeHash({
			regexps: [regexp],
			replacement: '',
			stringWithHash: hashedURL,
		}) ===
		removeHash({
			regexps: [regexp],
			replacement: '',
			stringWithHash: potentialMatchURL,
		})
	);
}

export const revisionedAssetsPlugin: WorkboxPlugin = {
	cachedResponseWillBeUsed: async ({cacheName, cachedResponse, state}) => {
		state!.cacheName = cacheName;
		return cachedResponse;
	},

	cacheDidUpdate: async ({cacheName, request}) => {
		const cache = await caches.open(cacheName);
		const keys = await cache.keys();

		for (const key of keys) {
			if (filterPredicate(request.url, key.url) && request.url !== key.url) {
				await cache.delete(key);
			}
		}
	},

	handlerDidError: async ({request, state}) => {
		if (state?.cacheName) {
			const cache = await caches.open(state.cacheName);
			const keys = await cache.keys();

			for (const key of keys) {
				if (filterPredicate(request.url, key.url)) {
					return cache.match(key);
				}
			}
		}
	},
};
