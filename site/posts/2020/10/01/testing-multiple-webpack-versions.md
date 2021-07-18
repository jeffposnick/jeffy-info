---
title: 'Testing multiple versions of a module dependency'
excerpt: 'module-alias ftw'
tags:
  - post
  - webpack
  - workbox
---

## The problem

`webpack` is preparing its [v5.0.0 release](https://webpack.js.org/migrate/5/), and as the maintainer of the [`workbox-webpack-plugin`](https://developers.google.com/web/tools/workbox/modules/workbox-webpack-plugin), I want to make sure we work well with the new version. But at the same time, we can't abandon compatibility with `webpack` v4.x.

We've got an [extensive test suite](https://github.com/GoogleChrome/workbox/tree/v6/test/workbox-webpack-plugin) that previously assumed there would be a single version of `webpack` that we tested against, so how can we make sure that we can run our individual tests against multiple versions of `webpack`, without modifying any of the `require('webpack')` statements in `workbox-webpack-plugin`? (The same applies other plugins that are exercised alongside `workbox-webpack-plugin` in our test suite, like `html-webpack-plugin`.)

## The solution

### Step 1: Install multiple package versions

`npm` v6.9.0 [added support](https://npm.community/t/release-npm-6-9-0/5911) for package aliases. This allows you to install multiple versions of the same `npm` package under different `node_modules/` subdirectory names.

In my case, I ran:

```text
npm install --save-dev webpack-v4@npm:webpack
npm install --save-dev webpack-v5@npm:webpack@5.0.0-rc.3
```

After running that, my `package.json` included:

```text
"devDependencies": {
  "webpack-v4": "npm:webpack@^4.44.2",
  "webpack-v5": "npm:webpack@^5.0.0-rc.3"
}
```

and I had local `node_modules/webpack-v4/` and `node_modules/webpack-v5/` directories.

### Step 2: Use module-alias to override require()

[`module-alias`](https://github.com/ilearnio/module-alias) makes overriding `require()` behavior extremely easy. I was worried that I would need to start modifying the `NODE_PATH` environment variable or something like that, but `module-alias` is all you need.

Here's an approximation of how I used it:

```js
const path = require('path');
require('module-alias').addAlias(
  // Replace with the "real" name of the module.
  'webpack',
  // Replace with the actual local versioned directory path.
  path.resolve('node_modules', 'webpack-v4'),
);
```

This aliasing will be in effect for a `require()` that's performed in any submodules as well, for the lifetime of the process. If you need to clear it out at any point before the process exits, you can use:

```js
// Replace with the name of the module you're aliasing.
delete require.cache[require.resolve('webpack')];
```

### Solution in context

[This PR](https://github.com/GoogleChrome/workbox/pull/2641) includes the full set of changes that I made for `webpack` v5 compatibility, including the dependency changes described above.

## Thanks

Huge thanks to [Jason](https://twitter.com/_developit), for walking me through this solution. I wanted to get this all written up somewhere permanent in case others have the same problem.
