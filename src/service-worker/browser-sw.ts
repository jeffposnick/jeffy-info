/// <reference lib="webworker"/>
declare const self: ServiceWorkerGlobalScope;

import { precache, matchPrecache } from 'workbox-precaching';

import { registerRoutes, StaticLoader } from './common';

precache(self.__WB_MANIFEST || []);

const loadStatic: StaticLoader = async (event, urlOverride) => {
  const url = urlOverride || (event as FetchEvent).request.url;
  const response = await matchPrecache(url);
  if (response) {
    return response;
  } else {
    return new Response('', {
      status: 404,
      statusText: 'Not Found',
    });
  }
};

registerRoutes(loadStatic);
