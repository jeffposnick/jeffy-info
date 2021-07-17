---
layout: default.njk
title: "Using npm modules inside of Apps Script"
excerpt: "Bundlers: the source of, and solution to, all of JavaScript's problems."
tags:
  - post
  - npm
  - appsscript
permalink: "/{{ page.date | date: '%Y/%m/%d' }}/{{ page.fileSlug }}.html"
---

I recently was processing some data using [Apps Script](https://developers.google.com/apps-script), and needed to parse out [second-level domain](https://en.wikipedia.org/wiki/Second-level_domain) info from a bunch of URLs. This is definitely [**not** the job for regular expressions](https://twitter.com/jeffposnick/status/1401218570093305863), but it's perfect for an `npm` module, [`psl`](https://www.npmjs.com/package/psl), that uses the [public suffix list](https://publicsuffix.org/).

But while Apps Script has come a long way, and features lots of ES2015+ goodness nowadays, it's not possible to pull in arbitrary code from `npm` and run it directly.

To work around this, I created the following `index.js` file locally, exporting the interface that I wanted to call from Apps Script:

```js
import psl from 'psl';
import Url from 'url-parse';

export function parseHostname(sourceURL) {
  const url = new Url(sourceURL);
  return psl.parse(url.hostname);
}
```

Then, I installed the necessary dependencies from `npm`, and bundled this code up with [`esbuild`](https://esbuild.github.io/):

```sh
npm init -y
npm install --save-dev psl url-parse punycode
npx esbuild index.js --bundle --global-name=psl --outfile=psl.js
```

I manually copied the contents of the `psl.js` file into a `psl.gs` file, alongside my main `Code.gs` file in the Apps Script editor. (This would be annoying if the bundled output changed frequently, but doing it once by hand wasn't a problem.)

Apps Script will automatically make the contents of all `.gs` files in a project visible in the same global scope, so I could now write code like

```js
const {sld} = psl.parseHostname(url);
```

inside of my main `Code.gs` file.

## Caveats

The Apps Script runtime environment still has a bunch of quirks when compared to Node, so don't expect all of your bundled code to work as-is. Polyfills may be needed (I used [`url-parse`](https://www.npmjs.com/package/url-parse), for instance, since the native `URL` object isn't available in Apps Script.)

Once you copy over the bundled code to Apps Script, it's never going to be updated, so make sure you're prepared to rebundle if and when there are any security or feature updates to the modules you're using.
