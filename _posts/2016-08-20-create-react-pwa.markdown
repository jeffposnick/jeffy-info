---
layout: post
title: "create-react-pwa"
date: 2016-08-20 12:00:00
excerpt: "What's it take to turn a create-react-app project into a Progressive Web App?"
tags: pwa sw service-worker react
---

# tl;dr

If you'd like to turn the output of [`create-react-app`](https://github.com/facebookincubator/create-react-app) into a [progressive web app](https://developers.google.com/web/progressive-web-apps/) (PWA) with offline support, take a look at the [`create-react-pwa`](https://github.com/jeffposnick/create-react-pwa) repo, and in particular, the [GitHub diff](https://github.com/jeffposnick/create-react-pwa/compare/starting-point...pwa) of the minimal changes required.

# create-react-app...

[`create-react-app`](https://facebook.github.io/react/blog/2016/07/22/create-apps-with-no-configuration.html) solves a problem that many folks (including I) have run into: how can you get started with a straightforward, client-rendered, single page React app and build process, without spending hours researching a list of (sometimes conflicting) dependencies to list in your `package.json`? It's a project that came out of Facebook's React engineering a few months back, and has since gained some significant mindshare in the web developer community.

# ...and it's limitations

In keeping with the fewer-depencies-are-better-dependencies philosophy behind `create-react-app`, the maintainers [appear to be vigilant](https://github.com/facebookincubator/create-react-app/issues/192) in the fight against scope creep, and are keeping the project lean. That's understandable, and it's left up to end users to decide what additional functionality to layer on top of the project's skeleton.

By design, the core of the build process isn't directly extensible. It's kicked off by `npm run build` and consists of

```
"scripts": {
  "build": "react-scripts build"
}
```

But! The opportunity's there to cleanly chain some additional commands after that initial `react-scripts build`, while keeping the `react-scripts` black box opaque, giving us the chance to modify the output of the original build process.

# An Opportunity for PWA-ification

That gets to the heart of my investigation: what's the easiest way to guide developers starting from a fresh `create-react-app` towards the end goal of deploying a [progressive web app](https://developers.google.com/web/progressive-web-apps/)? Specifically, what would it take to add in a [service worker](https://developers.google.com/web/fundamentals/primers/service-worker/) that provided performance benefits as well as a meaningful offline experience, as well as a [web app manifest](https://developers.google.com/web/updates/2014/11/Support-for-installable-web-apps-with-webapp-manifest-in-chrome-38-for-Android) that contained application metadata?

## Adding a Web App Manifest

This is just a [standard](https://developer.mozilla.org/en-US/docs/Web/Manifest) JSON file with fields containing metadata useful for controlling the "add to homescreen" experience (currently only on Android devices). While each developer needs to choose their metadata wisely, there's nothing particularly challenging here from a technical perspective, and we just need to create the file and get it copied over to the `build/` output directory as part of the `npm run build` process.

## Adding a Service Worker

To handle the service worker, I (not surprisingly) turned to the [`sw-precache`](https://github.com/GoogleChrome/sw-precache) project. When added to a build process, it generates a service worker JavaScript file that will automatically version and keep all local static files—HTML, JavaScript, CSS, images, etc.—up to date. Because *all* of the `create-react-app` output is local static files (there's no server-side rendering or remote API calls by default, for example), `sw-precache` can handle everything we need with little configuration needed.

While I've traditionally used `sw-precache` as a JavaScript module inside of a [`gulp` build](http://gulpjs.com/) process, it also sports a [command-line interface](https://github.com/GoogleChrome/sw-precache#command-line-interface), and it's simple to add in the `sw-precache` command to the end of the `npm run build` script chain.

## The User Experience

Here's what the deployed PWA looks like on Chrome for Android, going through the steps of accepting the Add to Homescreen banner, and then launching it without a network connection.

<iframe class="youtube-embed" src="https://www.youtube.com/embed/nV8sKoVbD5Q?rel=0" frameborder="0" allowfullscreen></iframe>

# Try it Yourself

The best way to visualize the changes to the build process, as well as the (small) modifications needed to the source code, is to view the [GitHub diff](https://github.com/jeffposnick/create-react-pwa/compare/starting-point...pwa) between the starting point and the "final" PWA.

Take "final" with a grain of salt, because while you will end up with a build process that yields a progressive web app, there are many directions you might want to take the starter project, and some of those might entail a more complex service worker implementation. I've tried to cover [some scenarios](https://github.com/jeffposnick/create-react-pwa#what-additional-changes-might-be-needed) in the repo's README, including [steps to take](https://github.com/jeffposnick/create-react-pwa#ive-added-in-react-router-and-now-my-urls-dont-work-offline) if you're using `react-router` and need arbitrary URLs to work offline, as well as how you can add in [runtime caching strategies](https://github.com/jeffposnick/create-react-pwa#im-using-cross-origin-apis-or-resources-and-they-arent-working-while-offline) for calls to third party APIs and resources.

# Beyond create-react-app

If you're looking for examples of PWAs build with React that go a bit beyond what  `create-react-app` offers—for instance, that take advantage of server-side rendering or are built on third-party APIs—there are a few examples I could recommend:

- [iFixit PWA](https://github.com/GoogleChrome/sw-precache/tree/master/app-shell-demo) ([live deployment](https://ifixit-pwa.appspot.com/))
- [Hacker News PWA](https://github.com/insin/react-hn) ([live deployment](https://react-hn.appspot.com/))

