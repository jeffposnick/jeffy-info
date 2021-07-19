/// <reference lib="webworker"/>
declare const self: ServiceWorkerGlobalScope;

import { BroadcastUpdatePlugin } from 'workbox-broadcast-update';
import { StaleWhileRevalidate } from 'workbox-strategies';

import { registerRoutes, StaticLoader } from './shared/common';
import { STATIC_CACHE_NAME } from '../shared/constants';

self.addEventListener('install', () => {
  self.skipWaiting();
});

// Use a s-w-r strategy, along with broadcasting updates, to load static JSON
// assets inside of streaming HTML response generation.
const swrStrategy = new StaleWhileRevalidate({
  cacheName: STATIC_CACHE_NAME,
  plugins: [new BroadcastUpdatePlugin()],
});
const loadStatic: StaticLoader = async (event, urlOverride) => {
  return await swrStrategy.handle({
    event,
    request: urlOverride || event.request.url,
  });
};

registerRoutes(loadStatic);
