---
layout: post
title: "Getting Started (Again)"
date: 2014-11-26 23:34:34
excerpt: "A step-by-step guide to hosting a blog on HTTPS-enabled custom domain."
tags: meta, https, cloudflare, gh-pages, github, hosting
---

### Registering the Domain
I registered `jeffy.info` using [Google Domains](https://domains.google.com).
It's in invite-only beta mode at the moment, but using an alternative domain registrar shouldn't change the process much.

### Add a `CNAME` file to GitHub
I had a repo with Jekyll content (this! this content!) already in it, at [jeffposnick.github.io](https://github.com/jeffposnick/jeffposnick.github.io).
As per the [instructions](https://help.github.com/articles/adding-a-cname-file-to-your-repository/), I added a [`CNAME` file](https://github.com/jeffposnick/jeffposnick.github.io/blob/master/CNAME) to the top-level of the repo and pushed to GitHub.

### CloudFlare Setup
This was my first time using CloudFlare, so I needed to set up a (free) account.
I told CloudFlare that I wanted it to take control over the `jeffy.info` domain, and I set up two A records for the bare ("apex") domain `jeffy.info` to resolve to the two IP addresses for GitHub's servers.

![A record screenshoot](/assets/images/cloudflare_dns_settings.png)
