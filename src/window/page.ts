import {BlogPosting, WithContext} from 'schema-dts';

import {Page, Site} from '../shared/types';

export function setMetadata(site: Site, page: Page): void {
  document.title = page.title;

  // See https://developers.google.com/search/docs/data-types/article#non-amp
  const schemaData: WithContext<BlogPosting> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'abstract': page.excerpt,
    'datePublished': page.date,
    'headline': page.title,
    'image': site.logo,
  };

  const scriptEl = document.createElement('script');
  scriptEl.setAttribute('type', 'application/ld+json');
  scriptEl.innerText = JSON.stringify(schemaData);
  document.head.appendChild(scriptEl);
}
