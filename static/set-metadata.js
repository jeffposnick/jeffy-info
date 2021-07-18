function setMetadata(site, page) {
  const title = page.title || site.title;
  if (title) {
    document.title = title;

    const titleEl = document.createElement('meta');
    titleEl.setAttribute('name', 'twitter:title');
    titleEl.setAttribute('content', title);
    document.head.appendChild(titleEl);
  }
}
