---
title: Which Mastodon servers are the accounts you follow on?
excerpt: Maybe you want to switch to a server your friends are on!
scripts:
  - mastodon.js
tags:
  - post
---

Thinking about
[switching Mastodon servers](https://blog.joinmastodon.org/2019/06/how-to-migrate-from-one-server-to-another/)?
Maybe you'd like to join a server that's popular among the accounts you
currently follow?

Enter an account below (your own, or someone else's),
and get a sorted list of servers of the (first ~1000) accounts that it follows.

<base target="_blank">
<form id="lookup">
	<label for="account">Mastodon Account:</label>
	<input type="text" id="account" placeholder="user@server" />
	<input type="submit" value="Lookup" />
</form>
<p id="status"></p>
<table id="results"></table>
