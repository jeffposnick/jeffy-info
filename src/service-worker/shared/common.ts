/// <reference lib="webworker"/>

import { registerRoute, setDefaultHandler } from 'workbox-routing';
import { strategy as streamingStrategy } from 'workbox-streams';

import { URLPatternMatcher } from './URLPatternMatcher';
import * as Templates from './templates';
import site from '../../../site/site.json';

export type StaticLoader = (
  event: FetchEvent,
  urlOverride?: string,
) => Promise<Response>;

export function registerRoutes(loadStatic: StaticLoader) {
  registerRoute(
    new URLPatternMatcher({ pathname: '/' }).matcher,
    streamingStrategy(
      [
        () => Templates.Start({ site }),
        async ({ event }: { event: ExtendableEvent }) => {
          const jsonURL = `/static/collections.json`;
          try {
            const response = await loadStatic(event as FetchEvent, jsonURL);

            if (response?.ok) {
              const collections = await response.json();
              return Templates.Index({ site, collections });
            }

            throw new Error('Unable to load static resource.');
          } catch (err) {
            return Templates.Error({ site, url: jsonURL });
          }
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
        async ({
          event,
          params,
        }: {
          event: ExtendableEvent;
          params?: Record<string, any>;
        }) => {
          const post = params.pathname.groups[0];
          const jsonURL = `/static/${post}.json`;
          try {
            const response = await loadStatic(event as FetchEvent, jsonURL);

            if (response?.ok) {
              const json = await response.json();
              return Templates.Page({
                site,
                ...json,
              });
            }

            throw new Error('Unable to load static resource.');
          } catch (err) {
            return Templates.Error({ site, url: jsonURL });
          }
        },
        () => Templates.End({ site }),
      ],
      {
        'content-type': 'text/html',
      },
    ),
  );

  setDefaultHandler(({ event }) => loadStatic(event as FetchEvent));
}
