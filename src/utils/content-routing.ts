export type Locale = 'ar' | 'en';
export type CollectionKey =
  | 'articles'
  | 'books'
  | 'editions'
  | 'projects'
  | 'media'
  | 'externalLinks'
  | 'studyBenefits'
  | 'flashcardDecks';

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
    studyBenefits: {
      ar: '/ar/study/benefits/',
      en: '/en/study/benefits/',
    },
    flashcardDecks: {
      ar: '/ar/study/flashcards/',
      en: '/en/study/flashcards/',
    },
  };

  return basePaths[collection][lang];
}

export function getEntryPath(collection: CollectionKey, lang: Locale, slug: string) {
  return `${getCollectionBasePath(collection, lang)}${getEntryRouteSlug(slug)}/`;
}

export function getArticleSeriesPath(lang: Locale, seriesSlug: string) {
  const basePath = lang === 'ar' ? '/ar/articles/series/' : '/en/articles/series/';

  return `${basePath}${seriesSlug}/`;
}

export function getFlashcardModePath(lang: Locale, deckSlug: string, mode: 'review' | 'training' | 'test' | 'results') {
  return `${getEntryPath('flashcardDecks', lang, deckSlug)}${mode}/`;
}
