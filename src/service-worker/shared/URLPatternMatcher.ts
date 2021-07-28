import {RouteMatchCallback} from 'workbox-core';
import {URLPattern} from 'urlpattern-polyfill';
import {URLPatternInit} from 'urlpattern-polyfill/dist/url-pattern.interfaces';

export class URLPatternMatcher {
  private _urlPattern: URLPattern;

  constructor(urlPatternInput: URLPatternInit) {
    this._urlPattern = new URLPattern(urlPatternInput);
  }

  matcher: RouteMatchCallback = ({url}) => {
    return this._urlPattern.exec(url.href);
  };
}
