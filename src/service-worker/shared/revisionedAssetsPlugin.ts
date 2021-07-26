import { WorkboxPlugin } from 'workbox-core';

import { HASH_CHARS } from '../../shared/constants';

function getOriginalFilename(hashedFilename: string): string {
  return hashedFilename.substring(HASH_CHARS + 1);
}

function parseFilenameFromURL(url: string): string {
  const urlObject = new URL(url);
  return urlObject.pathname.split('/').pop();
}

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

export const revisionedAssetsPlugin: WorkboxPlugin = {
  cachedResponseWillBeUsed: async ({ cacheName, cachedResponse, state }) => {
    state.cacheName = cacheName;
    return cachedResponse;
  },

  cacheDidUpdate: async ({ cacheName, request }) => {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    for (const key of keys) {
      if (filterPredicate(request.url, key.url) && request.url !== key.url) {
        await cache.delete(key);
      }
    }
  },

  handlerDidError: async ({ request, state }) => {
    if (state.cacheName) {
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
