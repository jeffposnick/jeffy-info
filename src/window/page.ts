export function setMetadata(site: Record<string, any>, page: Record<string, any>): void {
  const title = page.title || site.title;
  if (title) {
    document.title = title;
  }
}
