export type Locale = 'ar' | 'en';
export type CollectionKey = 'articles' | 'books' | 'editions' | 'projects' | 'media' | 'externalLinks';

const localeSuffixPattern = /-(ar|en)$/;

export function getEntryRouteSlug(slug: string) {
  return slug.replace(localeSuffixPattern, '');
}

export function getCollectionBasePath(collection: CollectionKey, lang: Locale) {
  const basePaths: Record<CollectionKey, Record<Locale, string>> = {
    articles: {
      ar: '/ar/articles/',
      en: '/en/articles/',
    },
    books: {
      ar: '/ar/books/',
      en: '/en/books/',
    },
    editions: {
      ar: '/ar/editions/',
      en: '/en/critical-editions/',
    },
    projects: {
      ar: '/ar/projects/',
      en: '/en/projects/',
    },
    media: {
      ar: '/ar/media/',
      en: '/en/media/',
    },
    externalLinks: {
      ar: '/ar/external-links/',
      en: '/en/external-links/',
    },
  };

  return basePaths[collection][lang];
}

export function getEntryPath(collection: CollectionKey, lang: Locale, slug: string) {
  return `${getCollectionBasePath(collection, lang)}${getEntryRouteSlug(slug)}/`;
}
