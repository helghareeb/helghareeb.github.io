import { getCollection } from 'astro:content';

type Locale = 'ar' | 'en';

const localePairs: Record<string, string> = {
  '/': '/en/',
  '/ar/': '/en/',
  '/ar/about/': '/en/about/',
  '/ar/cv/': '/en/cv/',
  '/ar/books/': '/en/books/',
  '/ar/editions/': '/en/critical-editions/',
  '/ar/articles/': '/en/articles/',
  '/ar/articles/series/': '/en/articles/series/',
  '/ar/fields/': '/en/scholarly-fields/',
  '/ar/projects/': '/en/projects/',
  '/ar/media/': '/en/media/',
  '/ar/external-links/': '/en/external-links/',
  '/ar/contact/': '/en/contact/',
  '/ar/learning-path/': '/en/learning-path/',
  '/ar/site-map/': '/en/site-map/',
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
  '/en/books/': '/ar/books/',
  '/en/critical-editions/': '/ar/editions/',
  '/en/articles/': '/ar/articles/',
  '/en/articles/series/': '/ar/articles/series/',
  '/en/scholarly-fields/': '/ar/fields/',
  '/en/projects/': '/ar/projects/',
  '/en/media/': '/ar/media/',
  '/en/external-links/': '/ar/external-links/',
  '/en/contact/': '/ar/contact/',
  '/en/learning-path/': '/ar/learning-path/',
  '/en/site-map/': '/ar/site-map/',
  '/en/scholarly-fields/islamic-studies/': '/ar/fields/islamic-studies/',
  '/en/scholarly-fields/defense-of-sunnah/': '/ar/fields/defense-of-sunnah/',
  '/en/scholarly-fields/alukah/': '/ar/fields/alukah/',
  '/en/scholarly-fields/alukah/articles/': '/ar/fields/alukah/articles/',
  '/en/scholarly-fields/manuscripts/': '/ar/fields/manuscripts/',
  '/en/scholarly-fields/ai-and-islamic-heritage/': '/ar/fields/ai-and-islamic-heritage/',
  '/en/scholarly-fields/academic-reviewing/': '/ar/fields/academic-reviewing/',
  '/en/scholarly-fields/e-learning/': '/ar/fields/e-learning/',
};

export async function getAlternateLocalePath(currentPath: string, lang: Locale) {
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
      getPath: (match) => (articleSeriesSlugs.en.has(match[1]) ? `/en/articles/series/${match[1]}/` : '/en/articles/series/'),
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
      getPath: (match) => (articleSeriesSlugs.ar.has(match[1]) ? `/ar/articles/series/${match[1]}/` : '/ar/articles/series/'),
    },
    { pattern: /^\/ar\/books\/([^/]+)\/$/, getPath: (match) => `/en/books/${match[1]}/` },
    { pattern: /^\/en\/books\/([^/]+)\/$/, getPath: (match) => `/ar/books/${match[1]}/` },
    { pattern: /^\/ar\/editions\/([^/]+)\/$/, getPath: (match) => `/en/critical-editions/${match[1]}/` },
    { pattern: /^\/en\/critical-editions\/([^/]+)\/$/, getPath: (match) => `/ar/editions/${match[1]}/` },
    { pattern: /^\/ar\/projects\/([^/]+)\/$/, getPath: (match) => `/en/projects/${match[1]}/` },
    { pattern: /^\/en\/projects\/([^/]+)\/$/, getPath: (match) => `/ar/projects/${match[1]}/` },
    { pattern: /^\/ar\/media\/([^/]+)\/$/, getPath: (match) => `/en/media/${match[1]}/` },
    { pattern: /^\/en\/media\/([^/]+)\/$/, getPath: (match) => `/ar/media/${match[1]}/` },
    { pattern: /^\/ar\/external-links\/([^/]+)\/$/, getPath: (match) => `/en/external-links/${match[1]}/` },
    { pattern: /^\/en\/external-links\/([^/]+)\/$/, getPath: (match) => `/ar/external-links/${match[1]}/` },
  ];

  const normalizedPath = currentPath.endsWith('/') ? currentPath : `${currentPath}/`;
  const matchedDynamicLocale = dynamicLocaleMatchers.find(({ pattern }) => pattern.test(normalizedPath));
  const dynamicLocaleMatch = matchedDynamicLocale ? normalizedPath.match(matchedDynamicLocale.pattern) : null;
  const dynamicLocalePath =
    matchedDynamicLocale && dynamicLocaleMatch ? matchedDynamicLocale.getPath(dynamicLocaleMatch) : undefined;

  return localePairs[currentPath] ?? localePairs[normalizedPath] ?? dynamicLocalePath ?? (lang === 'ar' ? '/en/' : '/ar/');
}
