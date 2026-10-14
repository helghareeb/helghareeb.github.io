import { getCollection } from 'astro:content';

type Locale = 'ar' | 'en';

const localePairs: Record<string, string> = {
  '/': '/en/',
  '/ar/': '/en/',
  '/ar/about/': '/en/about/',
  '/ar/cv/': '/en/cv/',
  '/ar/teaching/': '/en/teaching/',
  '/ar/publications/': '/en/publications/',
  '/ar/mushaf-gharib/': '/en/mushaf-gharib/',
  '/ar/books/': '/en/books/',
  '/ar/books/qatra-min-al-hayah/read/': '/en/books/qatra-min-al-hayah/',
  '/ar/editions/': '/en/critical-editions/',
  '/ar/articles/': '/en/articles/',
  '/ar/articles/series/': '/en/articles/series/',
  '/ar/fields/': '/en/scholarly-fields/',
  '/ar/study/': '/en/study/',
  '/ar/study/benefits/': '/en/study/benefits/',
  '/ar/study/flashcards/': '/en/study/flashcards/',
  '/ar/videos/': '/en/videos/',
  '/ar/quizzes/': '/en/quizzes/',
  '/ar/projects/': '/en/projects/',
  '/ar/external-links/': '/en/external-links/',
  '/ar/contact/': '/en/contact/',
  '/ar/learning-path/': '/en/learning-path/',
  '/ar/site-map/': '/en/site-map/',
  '/ar/search/': '/en/search/',
  '/ar/fields/islamic-studies/': '/en/scholarly-fields/islamic-studies/',
  '/ar/fields/defense-of-sunnah/': '/en/scholarly-fields/defense-of-sunnah/',
  '/ar/fields/alukah/': '/en/scholarly-fields/alukah/',
  '/ar/fields/alukah/articles/': '/en/scholarly-fields/alukah/articles/',
  '/ar/fields/manuscripts/': '/en/scholarly-fields/manuscripts/',
  '/ar/fields/ai-and-islamic-heritage/': '/en/scholarly-fields/ai-and-islamic-heritage/',
  '/ar/fields/academic-reviewing/': '/en/scholarly-fields/academic-reviewing/',
  '/ar/fields/e-learning/': '/en/scholarly-fields/e-learning/',
  '/en/': '/ar/',
  '/en/about/': '/ar/about/',
  '/en/cv/': '/ar/cv/',
  '/en/teaching/': '/ar/teaching/',
  '/en/publications/': '/ar/publications/',
  '/en/mushaf-gharib/': '/ar/mushaf-gharib/',
  '/en/books/': '/ar/books/',
  '/en/critical-editions/': '/ar/editions/',
  '/en/articles/': '/ar/articles/',
  '/en/articles/series/': '/ar/articles/series/',
  '/en/scholarly-fields/': '/ar/fields/',
  '/en/study/': '/ar/study/',
  '/en/study/benefits/': '/ar/study/benefits/',
  '/en/study/flashcards/': '/ar/study/flashcards/',
  '/en/videos/': '/ar/videos/',
  '/en/quizzes/': '/ar/quizzes/',
  '/en/projects/': '/ar/projects/',
  '/en/external-links/': '/ar/external-links/',
  '/en/contact/': '/ar/contact/',
  '/en/learning-path/': '/ar/learning-path/',
  '/en/site-map/': '/ar/site-map/',
  '/en/search/': '/ar/search/',
  '/en/scholarly-fields/islamic-studies/': '/ar/fields/islamic-studies/',
  '/en/scholarly-fields/defense-of-sunnah/': '/ar/fields/defense-of-sunnah/',
  '/en/scholarly-fields/alukah/': '/ar/fields/alukah/',
  '/en/scholarly-fields/alukah/articles/': '/ar/fields/alukah/articles/',
  '/en/scholarly-fields/manuscripts/': '/ar/fields/manuscripts/',
  '/en/scholarly-fields/ai-and-islamic-heritage/': '/ar/fields/ai-and-islamic-heritage/',
  '/en/scholarly-fields/academic-reviewing/': '/ar/fields/academic-reviewing/',
  '/en/scholarly-fields/e-learning/': '/ar/fields/e-learning/',
};

export async function getAlternateLocalePath(rawPath: string, lang: Locale) {
  // Astro passes the pathname percent-encoded; content slugs (and the matchers below) are decoded Arabic.
  const currentPath = decodeURIComponent(rawPath);
  const articleEntries = await getCollection('articles');
  const articleRouteSlugMaps = {
    ar: new Map(
      articleEntries
        .filter((entry) => entry.data.lang === 'ar' && !entry.data.draft)
        .map((entry) => [entry.slug.replace(/-(ar|en)$/, ''), entry.slug.replace(/-(ar|en)$/, '')]),
    ),
    en: new Map(
      articleEntries
        .filter((entry) => entry.data.lang === 'en' && !entry.data.draft)
        .map((entry) => [entry.slug.replace(/-(ar|en)$/, ''), entry.slug.replace(/-(ar|en)$/, '')]),
    ),
  };
  const articleTranslationKeyMaps = {
    ar: new Map<string, string>(),
    en: new Map<string, string>(),
  };

  for (const entry of articleEntries) {
    if (entry.data.draft) continue;

    const routeSlug = entry.slug.replace(/-(ar|en)$/, '');
    const translationKey = entry.data.translationKey ?? routeSlug;

    articleTranslationKeyMaps[entry.data.lang].set(translationKey, routeSlug);
  }

  const articleSeriesSlugs = {
    ar: new Set(
      articleEntries
        .filter((entry) => entry.data.lang === 'ar' && !entry.data.draft && entry.data.seriesSlug)
        .map((entry) => entry.data.seriesSlug!),
    ),
    en: new Set(
      articleEntries
        .filter((entry) => entry.data.lang === 'en' && !entry.data.draft && entry.data.seriesSlug)
        .map((entry) => entry.data.seriesSlug!),
    ),
  };

  // Series slugs may differ between languages (Arabic-slug series); pair them through translated parts.
  const seriesCounterpart = { ar: new Map<string, string>(), en: new Map<string, string>() };
  for (const entry of articleEntries) {
    if (entry.data.draft || !entry.data.seriesSlug || !entry.data.translationKey) continue;
    const other = articleEntries.find(
      (item) =>
        item.data.lang !== entry.data.lang &&
        !item.data.draft &&
        item.data.translationKey === entry.data.translationKey &&
        item.data.seriesSlug,
    );
    if (other) seriesCounterpart[entry.data.lang].set(entry.data.seriesSlug, other.data.seriesSlug!);
  }

  // Books, editions, projects and links may exist in one language only; fall back to the section index.
  const entrySlugs = {
    books: await getCollection('books'),
    editions: await getCollection('editions'),
    projects: await getCollection('projects'),
    externalLinks: await getCollection('externalLinks'),
  };
  const counterpart = (collection: keyof typeof entrySlugs, targetLang: Locale, slug: string, fallback: string) => {
    const exists = entrySlugs[collection].some(
      (entry) => entry.data.lang === targetLang && entry.slug.replace(/-(ar|en)$/, '') === slug,
    );
    return exists ? `${fallback}${slug}/` : fallback;
  };

  const dynamicLocaleMatchers: Array<{
    pattern: RegExp;
    getPath: (match: RegExpMatchArray) => string;
  }> = [
    {
      pattern: /^\/ar\/articles\/([^/]+)\/$/,
      getPath: (match) => {
        const translationKey = articleEntries.find(
          (entry) => entry.data.lang === 'ar' && !entry.data.draft && entry.slug.replace(/-(ar|en)$/, '') === match[1],
        )?.data.translationKey ?? match[1];
        const targetRouteSlug =
          articleTranslationKeyMaps.en.get(translationKey) ?? articleRouteSlugMaps.en.get(match[1]);

        return targetRouteSlug ? `/en/articles/${targetRouteSlug}/` : '/en/articles/';
      },
    },
    {
      pattern: /^\/ar\/articles\/series\/([^/]+)\/$/,
      getPath: (match) => {
        const target = seriesCounterpart.ar.get(match[1]) ?? (articleSeriesSlugs.en.has(match[1]) ? match[1] : undefined);
        return target ? `/en/articles/series/${target}/` : '/en/articles/series/';
      },
    },
    {
      pattern: /^\/en\/articles\/([^/]+)\/$/,
      getPath: (match) => {
        const translationKey = articleEntries.find(
          (entry) => entry.data.lang === 'en' && !entry.data.draft && entry.slug.replace(/-(ar|en)$/, '') === match[1],
        )?.data.translationKey ?? match[1];
        const targetRouteSlug =
          articleTranslationKeyMaps.ar.get(translationKey) ?? articleRouteSlugMaps.ar.get(match[1]);

        return targetRouteSlug ? `/ar/articles/${targetRouteSlug}/` : '/ar/articles/';
      },
    },
    {
      pattern: /^\/en\/articles\/series\/([^/]+)\/$/,
      getPath: (match) => {
        const target = seriesCounterpart.en.get(match[1]) ?? (articleSeriesSlugs.ar.has(match[1]) ? match[1] : undefined);
        return target ? `/ar/articles/series/${target}/` : '/ar/articles/series/';
      },
    },
    { pattern: /^\/ar\/books\/([^/]+)\/$/, getPath: (match) => counterpart('books', 'en', match[1], '/en/books/') },
    { pattern: /^\/en\/books\/([^/]+)\/$/, getPath: (match) => counterpart('books', 'ar', match[1], '/ar/books/') },
    { pattern: /^\/ar\/editions\/([^/]+)\/$/, getPath: (match) => counterpart('editions', 'en', match[1], '/en/critical-editions/') },
    { pattern: /^\/en\/critical-editions\/([^/]+)\/$/, getPath: (match) => counterpart('editions', 'ar', match[1], '/ar/editions/') },
    { pattern: /^\/ar\/projects\/([^/]+)\/$/, getPath: (match) => counterpart('projects', 'en', match[1], '/en/projects/') },
    { pattern: /^\/en\/projects\/([^/]+)\/$/, getPath: (match) => counterpart('projects', 'ar', match[1], '/ar/projects/') },
    { pattern: /^\/ar\/external-links\/([^/]+)\/$/, getPath: (match) => counterpart('externalLinks', 'en', match[1], '/en/external-links/') },
    { pattern: /^\/en\/external-links\/([^/]+)\/$/, getPath: (match) => counterpart('externalLinks', 'ar', match[1], '/ar/external-links/') },
    { pattern: /^\/ar\/study\/flashcards\/([^/]+)\/$/, getPath: (match) => `/en/study/flashcards/${match[1]}/` },
    { pattern: /^\/en\/study\/flashcards\/([^/]+)\/$/, getPath: (match) => `/ar/study/flashcards/${match[1]}/` },
    { pattern: /^\/ar\/study\/flashcards\/([^/]+)\/(review|training|test|results)\/$/, getPath: (match) => `/en/study/flashcards/${match[1]}/${match[2]}/` },
    { pattern: /^\/en\/study\/flashcards\/([^/]+)\/(review|training|test|results)\/$/, getPath: (match) => `/ar/study/flashcards/${match[1]}/${match[2]}/` },
    { pattern: /^\/ar\/videos\/([^/]+)\/$/, getPath: (match) => `/en/videos/${match[1]}/` },
    { pattern: /^\/en\/videos\/([^/]+)\/$/, getPath: (match) => `/ar/videos/${match[1]}/` },
    { pattern: /^\/ar\/quizzes\/([^/]+)\/([^/]+)\/$/, getPath: (match) => `/en/quizzes/${match[1]}/${match[2]}/` },
    { pattern: /^\/en\/quizzes\/([^/]+)\/([^/]+)\/$/, getPath: (match) => `/ar/quizzes/${match[1]}/${match[2]}/` },
    { pattern: /^\/ar\/study\/benefits\/([^/]+)\/$/, getPath: (match) => `/en/study/benefits/${match[1]}/` },
    { pattern: /^\/en\/study\/benefits\/([^/]+)\/$/, getPath: (match) => `/ar/study/benefits/${match[1]}/` },
    { pattern: /^\/ar\/study\/benefits\/([^/]+)\/([^/]+)\/$/, getPath: (match) => `/en/study/benefits/${match[1]}/${match[2]}/` },
    { pattern: /^\/en\/study\/benefits\/([^/]+)\/([^/]+)\/$/, getPath: (match) => `/ar/study/benefits/${match[1]}/${match[2]}/` },
  ];

  const normalizedPath = currentPath.endsWith('/') ? currentPath : `${currentPath}/`;
  const matchedDynamicLocale = dynamicLocaleMatchers.find(({ pattern }) => pattern.test(normalizedPath));
  const dynamicLocaleMatch = matchedDynamicLocale ? normalizedPath.match(matchedDynamicLocale.pattern) : null;
  const dynamicLocalePath =
    matchedDynamicLocale && dynamicLocaleMatch ? matchedDynamicLocale.getPath(dynamicLocaleMatch) : undefined;

  return localePairs[currentPath] ?? localePairs[normalizedPath] ?? dynamicLocalePath ?? (lang === 'ar' ? '/en/' : '/ar/');
}
