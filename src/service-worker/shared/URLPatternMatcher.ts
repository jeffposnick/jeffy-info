import type {RouteMatchCallback} from 'workbox-core';
import 'urlpattern-polyfill';

export class URLPatternMatcher {
	private _urlPattern: URLPattern;

	constructor(urlPatternInput: URLPatternInit) {
		this._urlPattern = new URLPattern(urlPatternInput);
	}

	matcher: RouteMatchCallback = ({url}) => {
		return this._urlPattern.exec(url.href);
	};
}
