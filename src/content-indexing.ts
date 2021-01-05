declare const self: ServiceWorkerGlobalScope;

// Tell TypeScript about registration.index
declare global {
  interface ServiceWorkerRegistration {
    index: ContentIndex;
  }
}

import {cacheNames} from 'workbox-core';

export async function indexOfflineContent() {
  // Keep tracks of indexed ids. We're using the launchUrl as the id value.
  const ids = new Set<string>();

  for (const contentDescription of await self.registration.index.getAll()) {
    // Add each currently indexed id to the set.
    ids.add(contentDescription.id);
  }

  const cache = await caches.open(cacheNames.precache);
  const cachedRequests = await cache.keys();

  // This code is *very* site specific to my blog.
  for (const request of cachedRequests) {
    const url = new URL(request.url);
    // Check each cache entry to see if it's a blog post.
    if (url.pathname.startsWith('/_posts/') && !url.pathname.startsWith('/_posts/_')) {
      const response = await cache.match(request);
      const post = await response!.json() as Post;

      // Modify the cache key to correspond to the actual URLs.
      const htmlPath = url.pathname.replace('json', 'html').replace('/_posts/', '');
      const date = new Date(post.page.date);
      const launchUrl = `/${date.getUTCFullYear()}/${new String(date.getUTCMonth() + 1).padStart(2, '0')}/${new String(date.getUTCDate()).padStart(2, '0')}/${htmlPath}?utm_source=content-index-api`;

      if (ids.has(launchUrl)) {
        // If it's already indexed, remove the id from the set.
        ids.delete(launchUrl);
      } else {
        // Otherwise, if it's not already indexed, add it, using metadata
        // from the cached JSON entry.
        await self.registration.index.add({
          launchUrl,
          url: launchUrl,
          category: 'article',
          description: post.excerpt,
          icons: [{
            src: '/assets/images/34.png',
            sizes: '192x192',
            type: 'image/png',
          }],
          id: launchUrl,
          title: post.title,
        });
      }
    }
  }

  // Finally, if there are any ids left over, that means that they're indexed
  // but don't currently exist in our site. Delete them from the index.
  for (const id of ids) {
    await self.registration.index.delete(id);
  }
}
