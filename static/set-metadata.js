function setMetadata(site, page) {
  const title = page.title || site.title;
  if (title) {
    document.title = title;
  }
}
