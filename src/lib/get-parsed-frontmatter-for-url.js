import frontmatter from 'frontmatter';

export default async url => {
  const response = await fetch(url);
  const text = await response.text();
  return frontmatter(text);
};
