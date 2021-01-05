declare module 'nunjucks/browser/nunjucks';

type ArrayOneOrMore<T> = {
  0: T
} & Array<T>;

interface ImageResource {
  sizes: string,
  src: string,
  type: string;
}

declare type ContentCategory = 'homepage' | 'article' | 'video' | 'audio' | ''

interface ContentDescription {
  id: string;
  url: string;
  launchUrl: string;
  title: string;
  description: string;
  icons: ArrayOneOrMore<ImageResource>;
  category?: ContentCategory;
}

interface ContentIndex {
  add(description: ContentDescription): Promise<void>;
  delete(id: string): Promise<void>;
  getAll(): Promise<Array<ContentDescription>>;
}

interface Site {
  baseurl: string;
  description: string;
  email: string;
  github: SocialAccount;
  logo: string;
  title: string;
  twitter: SocialAccount;
  url: string;
}

interface SocialAccount {
  username: string;
}

interface Post {
  excerpt: string;
  html: string;
  layout: string;
  tags?: Array<string> | null;
  title: string;
  page: {
    date: string;
  };
}
