---
layout: post
title: "Offline-first for Your Templated Site (Part One)"
date: 2016-11-02 17:00:00
excerpt: "Terminology and an exploring the architecture."
tags: pwa offline service-worker jekyll
---

_This is the first part of a planned three-part series._

_[Part two covers](https://jeffy.info/2017/01/24/offline-first-for-your-templated-site-part-2.html) different strategies for caching and serving templated sites._

_Part three will dive into a specific service worker implementation that can be
used to provide an offline-first experience for a Jekyll-based site._

_Folks who can't wait for part three are welcome to check out the
[https://jeffy.info](https://jeffy.info)
service worker [implementation](https://github.com/jeffposnick/jeffposnick.github.io/tree/work/src)
ahead of time._

# What's offline-first?

Let's see if I can get away with just embedding a tweet:

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">…&quot;Offline first&quot; is a serving strategy. Get as far as you can with local data before going to the network.<br><br>(serve-)offline-(content-)first.</p>&mdash; Jake Archibald (@jaffathecake) <a href="https://twitter.com/jaffathecake/status/788289680735436800">October 18, 2016</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

That's offline-first.

# What's a templated site?

What I'm calling a *templated site* is built using multiple templates, combined with the actual text, images and other resources that make up the site's content, spread across multiple pages. The site's URLs uniquely identify the content specific to a page. The templates provide a structural layout shared across the pages.

This is all a convoluted way of describing what's otherwise known as a "content site", but that's deliberate: I want to avoid all the baggage that comes along with the "content site" label, especially the implication of what it's not—a "web app". What I'm describing are considerations for a particular architectural equation: templates + content = your site. If you've got templates, and some source of content, and you mix them together (either ahead of time during a build process, or at runtime on a server), then you've got a templated site! If you want to also call it a web app, cool; if you want to call it a content site, or a blog, or a CMS-powered site, that's totally cool too.

Since it's always fun to draw contrasts, if I did have to hold up something in opposition to a templated site, it would be a [single page application](https://en.wikipedia.org/wiki/Single-page_application). There's a meaningful difference between the way SPAs handle navigations (using the [History API](https://developer.mozilla.org/en-US/docs/Web/API/History) to rewrite URLs, and swapping content out of an "[application shell](https://developers.google.com/web/updates/2015/11/app-shell)" container), and how templated sites handle navigations (as actual *[navigations](https://html.spec.whatwg.org/multipage/browsers.html#navigate)*, in which the current DOM is torn down, and built up again based on the new HTML). SPAs fill an important role in the web's ecosystem, and they are the right architecture to use for certain types of projects, but they're different beasts than templated sites.

In case it's not clear from that preamble, what you're reading now, assuming it's being read on https://jeffy.info/, is part of a templated site. Blogs, newspapers, and whole host of sites driven drive by a backend [content management system](https://en.wikipedia.org/wiki/Content_management_system) are traditionally deployed as templated sites. If you're reading the syndicated copy of this on https://medium.com/, then I'm going to hazard a guess that the "templated site" label is also appropriate, but I'm not as familiar with how they implement things. `¯\_(ツ)_/¯`

# Anatomy of a templated site

All right: with what's hopefully a non-controversial set of a definitions out of the way, let's take a deeper dive into the different pieces that work together to produce a templated site. I'm going to focus on a specific framework, [Jekyll](https://jekyllrb.com/), which I'm familiar with and that I use on https://jeffy.info/. The general concepts, if not the specific formats used for all the pieces, should apply broadly to other frameworks.

## Templates!

Yes, templates. Templated sites have templates. Moving along…

Well, okay, there's more to explore here. Templates are usually small chunks of HTML that fill a certain structural role on a page—the header, the sidebar, the footer, etc. There's also likely to be a template that defines the HTML structure for the main bit of a page—the content—and which contains an insertion point where the words are plunked in from the content management system (more on that soon). These various templates are laid out in a… [layout](http://jekyll.tips/jekyll-casts/layouts/), which can be expressed as a template composed of those sub-templates.

Unfortunately, I lack the visual skills of some of my [colleagues](https://jakearchibald.com/2014/offline-cookbook/#on-install-as-a-dependency), but here's a rough sketch of what we're talking about, with the hypothetical smaller templates that work together to form a layout template for blog post:

<img src="/assets/images/2016-11-02/blog_layout.svg" alt="Templates come together to form a blog post layout" class="half-width">

The interesting bit here is that each of those smaller templates can be tweaked and modified individually, and sometimes (but not always) don't have to coordinate with each other or with the parent layout. You can imagine a rebranding in which a product name is changed in `head.tmpl`, or a copyright year is changed in `foot.tmpl`, without that requiring a larger change to any of the other templates or layouts.

## Content!

Next up, let's assume that we have some content (like: this post) that we want to share with the world. That content might live in a database. It might live in individual files—Jekyll uses individual [Markdown files](https://jekyllrb.com/docs/posts/). It might be accessed as JSON returned from a content management system's API. The important bits are the idea that there's a logical separation between the content for one page and the content for another, and the idea that content is independent from the overall page structure that's used to display it.

I don't know how to make diagrams of abstract content interesting, but... here's a depiction of content for you:

<img src="/assets/images/2016-11-02/content.svg" alt="An abstract representation of content" class="half-width">

## The process that smushes together the templates and the contents and outputs a final HTML document!

We've got some templates that are stitched together to make a layout, and we've got some content. What's left is smushing the layout and the content together to form a unique HTML document corresponding to each piece of source of content.

The specifics of the smushing vary greatly depending on what framework you're using. When you know that you have a potentially huge corpus of content (think: the entire archives of a newspaper), you might opt for a framework that smushes on demand, server-side, in response to a request from a client. When you're dealing with a slightly slimmer corpus (https://jeffy.info/: four posts and counting!), or if you want to avoid running custom code on a server, it can make sense to use a framework that smushes everything ahead of time. The you can serve the final HTML using any run of the mill HTTP server. That's what the Jekyll framework [does](https://jekyllrb.com/docs/usage/).

Here's your requisite diagram:

<img src="/assets/images/2016-11-02/smushening.svg" alt="A layout + content = final pages" class="half-width">

The complete HTML documents are then displayed by the browser, blissfully unawares of all the behind-the-scenes architecture that was needed to get to this point.
