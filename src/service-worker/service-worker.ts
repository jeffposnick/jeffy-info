/// <reference lib="webworker"/>
declare const self: ServiceWorkerGlobalScope;

import { BroadcastUpdatePlugin } from 'workbox-broadcast-update';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

import { URLPatternMatcher } from './URLPatternMatcher';
import { registerRoutes, StaticLoader } from './common';

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
