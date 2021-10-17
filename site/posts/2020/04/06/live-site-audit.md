---
title: 'Performance auditing an eCommerce site'
excerpt: "...let's do it live!"
tags:
  - performance
  - post
---

## Alan's weekly eCommerce livestreams

My teammate [Alan](https://alankent.me/)'s been running a weekly livestream on [his YouTube channel](https://www.youtube.com/channel/UCyQwDaXnT7wMBBqIaAfmY7g), focusing on topics of interest to eCommerce websites. He asked me to come on this week and perform a site performance audit.

Since I'm currently homebound due to Coronavirus concerns in NYC, I haven't had the chance to perform any [in-person site audits](https://jeffy.info/2017/11/10/post-cds-perf-links.html) in a while. Going through the process via a livestream was a great opportunity!

## The site review

The review process took about 50 minutes (I'd recommend watching at 2x playback speed...) and covered some relevant findings from WebPageTest.org and Lighthouse.

We choose the site, [https://threddies.com/](https://threddies.com/), "at random" based on folks who [volunteered](https://twitter.com/akent99/status/1245466347502333952). I think it ended up being fairly representative of the types of issues a lot of sites encounter.

<iframe class="youtube-embed" src="https://www.youtube.com/embed/l4bIT3CXCpc" allowfullscreen frameborder="0" loading="lazy"></iframe>

_Lightly edited from the notes I took during the review._

### Tools used:

- ["Easy" mode on WebPageTest](https://webpagetest.org/easy) ([site results](https://webpagetest.org/result/200402_FD_f791a96a04046aaa9d7583914ba1c952/))
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### Observations

- 11 seconds for main content to load — what's loaded beforehand?
- How many of the widgets/analytics tools can be [lazily-loaded](https://web.dev/native-lazy-loading/) (or potentially removed, if appropriate)?
- HTTP cache expiration [best practices](https://web.dev/reliable/).
- Use the [Coverage panel](https://developers.google.com/web/tools/chrome-devtools/coverage) in Chrome Dev Tools to evaluate how much of your JS/CSS in the critical request path is being used
- Q: Can they get away with loading Google Maps static images instead of Google Maps widget? Answer: [yes, they can](https://developers.google.com/maps/documentation/maps-static/intro).
- Always click on the "Learn More" link in Lighthouse for additional context!
- Zach Leatherman's [guides to loading web fonts](https://www.zachleat.com/web/comprehensive-webfonts/) are great.
