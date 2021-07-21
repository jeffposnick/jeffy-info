---
title: 'Styling inline scripts'
excerpt: 'Show what you run when demoing JavaScript.'
tags:
  - css
  - javascript
  - post
---

Following up on [this tweet](https://twitter.com/jeffposnick/status/1106217552190062598), I remembered that I have a blog(!) and that I can use it to host and run arbitrary JavaScript and CSS(!).

Here's a rather contrived example of how you could use CSS to make certain `<script>` tags visible, and use `<details>` + `<summary>` to hide them by default.

<script class="visible">console.log('This is visible.');</script>

<details>
  <summary>View Inline Script</summary>
  <script class="visible">console.log('This is visible, but hidden inside of details.');</script>
</details>

<script>
console.log('This is not visible.');
</script>
