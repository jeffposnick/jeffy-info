---
layout: post
title: "Hosting Setup, Revisited"
date: 2017-02-24 22:00:00
excerpt: "Goodbye gh-pages + Cloudflare, hello Firebase Hosting."
tags: hosting firebase cloudflare github
---

# Background

As I [detailed ](https://jeffy.info/2014/11/28/hosting-setup.html)a few years ago when I started up this blog, I used a combination of [GitHub Pages](https://help.github.com/categories/github-pages-basics/) + [Cloudflare](https://www.cloudflare.com/) for a basic HTTPS static site deployment, pointed at by the `jeffy.info` domain I bought from [Google Domains](https://domains.google.com/registrar).

I'd be meaning to try something different for a while now, since

- I'm not taking advantage of GitHub Page's automatic Jekyll build anymore (relying instead on a custom [build process](https://github.com/jeffposnick/jeffposnick.github.io/blob/d0bfdf81b7f1ddc29a299d98919f506f5366182b/gulpfile.js) that, among other things, generates a service worker for this site).
- I'm not happy about the lack of control GitHub Pages offers over HTTP caching, in which everything is served with a `max-age` of 10 minutes. I really wanted to serve my [`/service-worker.js`](https://jeffy.info/service-worker.js) with [HTTP caching disabled entirely](http://stackoverflow.com/a/38854905/385997).
- After experimenting with some of the various rewrites and optimizations that Cloudflare's proxy servers could perform, I'd turned all of them off, preferring instead to take any steps needed to minimize resources during the build process.

For [whatever reason](https://blog.cloudflare.com/incident-report-on-memory-leak-caused-by-cloudflare-parser-bug/), last night seemed like a good night to actually switch to something else.

# Migrating to Firebase Hosting

I work with the folks responsible for [Firebase Hosting](https://firebase.google.com/docs/hosting/), so I won't pretend that this was an unbiased decision, but I'm quite glad that I decided to switch things over to them.

## Deploying to jeffy-info.firebaseapp.com

The first step was getting my site deployed to a subdomain under `firebaseapp.com`, to make sure that everything looked okay there. Given that I just was serving the entirety of a static `build/` folder, this was low-drama. A basic [`firebase.json`](https://github.com/jeffposnick/jeffposnick.github.io/blob/d0bfdf81b7f1ddc29a299d98919f506f5366182b/firebase.json) configuration was enough to specify my public `build/` directory, and also configure the cache policy I wanted for `/service-worker.js` at the same time:

```json
{
  "hosting": {
    "public": "build",
    "headers": [{
      "source" : "/service-worker.js",
      "headers" : [{
        "key" : "Cache-Control",
        "value" : "no-cache"
      }]
    }]
  }
}
```

Things looked fine when deployed to `jeffy-info.firebaseapp.com`, so the next step was to switch over the DNS entries for `jeffy.info` to point to Firebase Hosting's IP addresses, and [wait for Firebase Hosting to generate a new HTTPS certificate](https://firebase.google.com/docs/hosting/custom-domain#wait-for-ssl-certificate-provisioning) for me.

## Configuring Google Domains DNS

This was arguably the hardest part of the migration, primarily because it's a change that might take up to an hour (or whatever the previous [DNS TTL](https://en.wikipedia.org/wiki/Time_to_live#DNS_records) was) to go into effect. During that interval things might look broken in several different ways. But patience was called for, and things just started working once the DNS configuration changes and new certificate went into affect.

Assuming you're using Firebase Hosting + Google Domains, the relevant bits to look for are switching the Name Servers back to use Google's defaults, like so:

![Google Domains Name Servers](/assets/images/2017-02-24/google-domain-name-servers.png)

And then also adding in an [`A` record](https://en.wikipedia.org/wiki/List_of_DNS_record_types) for the `@` entry, with the IP addresses provided by Firebase Hosting:

![A records](/assets/images/2017-02-24/google-domain-a-records.png)

# Let's Encrypt FTW

One of the original reasons I went with a Cloudflare proxy in front of my GitHub Pages deployment was because it was a simple way to get an HTTPS certificate for a custom domain. It's 2017 and [Let's Encrypt](https://letsencrypt.org/) is very much a thing, and it was great to see that the HTTPS certificate that Firebase Hosting automatically generated for `https://jeffy.info` came from Let's Encrypt:

![Let's Encrypt HTTP certificate](/assets/images/2017-02-24/lets-encrypt-cert.png)
