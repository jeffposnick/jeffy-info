export function setMetadata(
  site: Record<string, any>,
  page: Record<string, any>,
): void {
  const title = page.title || site.title;

  if (title) {
    document.title = title;

    // See https://developers.google.com/search/docs/data-types/article#non-amp
    const schemaData = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      datePublished: page.date,
      headline: title,
      image: [site.logo],
    };
    const scriptEl = document.createElement('script');
    scriptEl.setAttribute('type', 'application/ld+json');
    scriptEl.innerText = JSON.stringify(schemaData);
    document.head.appendChild(scriptEl);
  }
}
