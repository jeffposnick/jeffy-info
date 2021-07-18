/// <reference lib="webworker"/>
declare const self: ServiceWorkerGlobalScope;

import { BroadcastUpdatePlugin } from 'workbox-broadcast-update';
import { StaleWhileRevalidate } from 'workbox-strategies';

import { URLPatternMatcher } from './shared/URLPatternMatcher';
import { registerRoutes, StaticLoader } from './shared/common';

self.addEventListener('install', () => {
  self.skipWaiting();
});

// Use a s-w-r strategy, along with broadcasting updates, to load static JSON
// assets inside of streaming HTML response generation.
const swrStrategy = new StaleWhileRevalidate({
  cacheName: 'static',
  plugins: [new BroadcastUpdatePlugin()],
});
const loadStatic: StaticLoader = async (event, urlOverride) => {
  const response = await swrStrategy.handle({
    event,
    request: urlOverride || event.request.url,
  });
  return response;
};

registerRoutes(loadStatic);
