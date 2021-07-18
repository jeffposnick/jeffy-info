export function setMetadata(site: Record<string, any>, page: Record<string, any>): void {
  const title = page.title || site.title;
  if (title) {
    document.title = title;

    const titleEl = document.createElement('meta');
    titleEl.setAttribute('name', 'twitter:title');
    titleEl.setAttribute('content', title);
    document.head.appendChild(titleEl);
  }
}
