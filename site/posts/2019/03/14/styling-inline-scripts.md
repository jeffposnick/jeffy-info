---
layout: default.njk
title: 'Styling inline scripts'
excerpt: 'Show what you run when demoing JavaScript.'
tags:
  - css
  - javascript
  - post
permalink: "/{{ page.date | date: '%Y/%m/%d' }}/{{ page.fileSlug }}.html"
---

Following up on [this tweet](https://twitter.com/jeffposnick/status/1106217552190062598), I remembered that I have a blog(!) and that I can use it to host and run arbitrary JavaScript and CSS(!).

Here's a rather contrived example of how you could use CSS to make certain `<script>` tags visible, and use `<details>` + `<summary>` to hide them by default.

<style>
script.visible {
  border: 1px solid #009688;
  display: block;
  font-family: monospace;
  margin: 1em;
  overflow-x: auto;
  padding: 1em;
  white-space: pre;
}
</style>

<script class="visible">console.log('This is visible.');</script>

<details>
  <summary>View Inline Script</summary>
  <script class="visible">console.log('This is visible, but hidden inside of details.');</script>
</details>

<script>
console.log('This is not visible.');
</script>
