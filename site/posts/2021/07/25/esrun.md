---
title: 'Writing your build scripts in TypeScript'
excerpt: 'esrun to the rescue!'
tags:
  - post
---

_Note: I've since switched to [`tsm`](https://github.com/lukeed/tsm) instead of `@digitak/esrun` in some of my projects. They both use esbuild under the hood, and either should work well._

## Continued blog infra rewrite

I had a lot of fun getting full [service worker rendering](https://jeffy.info/2021/07/17/sw-rendering.html) working for this blog, and have continued to noodle on a number of improvements since then.

Some of them are bigger than others (I'm looking forward to writing a dedicated post about the [Workbox plugin I built](https://github.com/jeffposnick/jeffy-info/blob/cf-worker/src/service-worker/shared/revisionedAssetsPlugin.ts) that improves runtime caching for hashed URLs!), but a quick one is a plug for the [`@digitak/esrun` module](https://github.com/digital-loukoum/esrun).

## esbuild is great at build time

I've been _very_ happy using [`esbuild`](https://esbuild.github.io/) extensively in my blog's [build process](https://github.com/jeffposnick/jeffy-info/tree/cf-worker/src/build). It's provided (almost) zero-config TypeScript transpilation and bundling that runs **so much faster** that others tool with similar feature sets.

One thing that bothered me, though, was that my build scripts produce a number of assets that are consumed at runtime by my HTML and JavaScript, but because my build process didn't understand TypeScript types, I didn't have a lot of confidence that all the data structures matched up, and that if I refactored code in one place, I'd remember to update my generated assets.

Writing my build scripts in TypeScript would solve that, but adding in _another_ build step to transpile my scripts before I could start my _real_ build process sounded clunky. I know that [`ts-node`](https://github.com/TypeStrong/ts-node) and a few other options have been around for a while, but I haven't heard great things about their speed.

## esrun is great at runtime

Some more Googling led me to `@digitak/esrun`, which is a light wrapper on top of `esbuild` that will automatically transpile TypeScript source files before running them as command line scripts.

After adding `@digitak/esrun` to `devDependencies`, and rewriting my build scripts in TypeScript, my `package.json`'s `build` script went from

```json
{
	"scripts": {
		"build": "node src/build/main.js"
	}
}
```

to

```json
{
	"scripts": {
		"build": "esrun src/build/main.ts"
	}
}
```

That's all it took! I now have confidence that comes from [sharing types](https://github.com/jeffposnick/jeffy-info/blob/cf-worker/src/shared/types.ts) between my build and runtime environments, and the increase in build time due to transpilation is completely negligible.
