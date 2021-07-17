/// <reference lib="webworker"/>

import { registerRoute, setDefaultHandler } from 'workbox-routing';
import { strategy as streamingStrategy } from 'workbox-streams';

import { URLPatternMatcher } from './URLPatternMatcher';
import * as Templates from './templates';
import site from '../../site/site.json';

export type StaticLoader = (event: ExtendableEvent, urlOverride?: string) => Promise<Response>;

export function registerRoutes(loadStatic: StaticLoader) {
  registerRoute(
    new URLPatternMatcher({ pathname: '/' }).matcher,
    streamingStrategy(
      [
        () => Templates.Start({ site }),
        async ({ event }: { event: ExtendableEvent }) => {
          const response = await loadStatic(event, `/static/collections.json`);

          if (response?.ok) {
            const collections = await response.json();
            return Templates.Index({ site, collections });
          }

          return Templates.Error({ site });
        },
        () => Templates.End({ site }),
      ],
      {
        'content-type': 'text/html',
      },
    ),
  );

  registerRoute(
    new URLPatternMatcher({ pathname: '/(.*).html' }).matcher,
    streamingStrategy(
      [
        () => Templates.Start({ site }),
        async ({ event, params }: { event: ExtendableEvent; params?: Record<string, any> }) => {
          const post = params.pathname.groups[0];
          const response = await loadStatic(event, `/static/${post}.json`);

          if (response?.ok) {
            const json = await response.json();
            return Templates.Page({
              site,
              ...json,
            });
          }

          return Templates.Error({ site });
        },
        () => Templates.End({ site }),
      ],
      {
        'content-type': 'text/html',
      },
    ),
  );

  setDefaultHandler(({ event }) => loadStatic(event));
}