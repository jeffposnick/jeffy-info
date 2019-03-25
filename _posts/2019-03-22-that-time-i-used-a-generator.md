---
layout: default.njk
title: "That time I used a generator"
date: 2019-03-22 12:00:00
excerpt: "They're there for a reason!"
tags:
  - generator
  - javascript
  - post
  - workbox
permalink: "/{{ page.date | date: '%Y/%m/%d' }}/{{ page.fileSlug }}.html"
---

# Backstory

I moved over to work on Google's Web DevRel team way back in 2014, and one of
the first tasks that I took on was writing short update articles and code
samples for new web platform features. These are... somewhat embarrassing to
look back on, so I won't link to many here, but one of the first I put together
covered
[generators](https://developers.google.com/web/updates/2014/10/Generators-the-Gnarly-Bits).
I didn't have a huge amount to say about generators, so the general approach
used in the article was to link to some more
[canonical resources](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*),
while calling out a couple of interesting "gotchas" that I thought could add
some value.

So I wrote that, moved on, and then pretty much forgot that generators existed for the next 4 years.

# Refactoring

That takes us to a few months ago, when I was working on a [rewrite](https://github.com/GoogleChrome/workbox/issues/1793)
of the `workbox-precaching` module as part of the [Workbox v4](https://github.com/GoogleChrome/workbox/releases/tag/v4.0.0)
release. This gave me an opportunity to revisit some code that hadn't been
touched in a while.

## Original logic

The actual code isn't super-relevant (I'll link to the before and after below,
for those who are interested), but the main points were:

- It was code to compare a string against few possible matches.
- Calculating each possible match is (somewhat) expensive.
- The code returned `true` as soon as it found a match.
- If none of the conditions matched, it returned `false`.

The original code looked something like:

```javascript
const originalUrl = '...';
const urlToMatch = '...';

const urlVariation1 = generateVariation1(originalUrl);
if (urlToMatch === urlVariation1) {
  return true;
}

const urlVariation2 = generateVariation2(originalUrl);
if (urlToMatch === urlVariation2) {
  return true;
}

// etc.

return false;
```

I'm not a huge fan of a repeated sequence of `if(...) { return ... }` statements
aesthetically, and structuring code like that can make it harder to understand
that each test case is effectively doing the same thing.

## Refactoring without generators

One potential refactoring to emphasize the repeated logic could be:

```javascript
const originalUrl = '...';
const urlToMatch = '...';

const urlVariations = [
  generateVariation1,
  generateVariation2,
  // etc.
].map((generateVariation) => generateVariation(originalUrl));

for (const urlVariation of urlVariations) {
  if (urlToMatch === urlVariation) {
    return true;
  }
}

return false;
```

I like that version of the code from an aesthetic point of view, but one
downside is that you end up running each of the `generateVariationN()` functions
ahead of time. If a variation early in the list ends up matching, you've ended
up running (potentially expensive) code for nothing.

## Refactoring with generators

So! This is when I remembered that generators were A Thing, and could come in
handy in this use case.

Generators are
[iterable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators#Generator_functions),
so it could be dropped right in to a
[`for...of`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of)
loop.

Generators only run when their `next()` value is requested: they'll execute
until a `yield` keyword is encountered, at which point they pause and control
goes back to whatever triggered the iteration. If we yield the results of our
potentially expensive functions one at a time inside of a generator, we don't
have to worry about executing functions whose results won't actually be needed.
And we still get to structure the code that uses the values as a loop rather
than a sequence of `if(...) { return ...; }` statements. It's the best of both
worlds!

Using a generator and a `for...of` loop gives us code that looks something like:

```javascript
function* generateVariations(originalUrl) {
  // You could put these yields inside a loop, too!
  yield generateVariation1(originalUrl);
  yield generateVariation2(originalUrl);
  // etc.
}

for (const urlVariation of generateVariations(originalUrl)) {
  if (urlToMatch === urlVariation) {
    return true;
  }
}

return false;
```

## The actual changes in Workbox

If you're curious, the original code in Workbox v3 is
[here](https://github.com/GoogleChrome/workbox/blob/d27aafbdf164f051a883965058e6eb4c0df3a052/packages/workbox-precaching/_default.mjs#L76-L130).
The v4 code has been split up into modules for the new
[generator](https://github.com/GoogleChrome/workbox/blob/f1164254b8abdd12c5c601ee7e7fc7d73fffd979/packages/workbox-precaching/utils/generateURLVariations.mjs#L23-L55)
and the
[code that loops over the generated values](https://github.com/GoogleChrome/workbox/blob/f1164254b8abdd12c5c601ee7e7fc7d73fffd979/packages/workbox-precaching/utils/getCacheKeyForURL.mjs#L25-L35).
