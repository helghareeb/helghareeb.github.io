import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { navigation } from '../../config/navigation';
import { siteConfig } from '../../config/site';
import { getArticleSeriesPath, getEntryPath, getFlashcardModePath } from '../utils/content-routing';
import { getStudyBenefitBookPath } from '../utils/study';

const staticPaths = [
  '/',
  '/ar/',
  '/en/',
  '/ar/about/',
  '/en/about/',
  '/ar/cv/',
  '/en/cv/',
  '/ar/books/',
  '/en/books/',
  '/ar/editions/',
  '/en/critical-editions/',
  '/ar/articles/',
  '/en/articles/',
  '/ar/articles/series/',
  '/en/articles/series/',
  '/ar/projects/',
  '/en/projects/',
  '/ar/study/',
  '/en/study/',
  '/ar/study/benefits/',
  '/en/study/benefits/',
  '/ar/study/flashcards/',
  '/en/study/flashcards/',
  '/ar/media/',
  '/en/media/',
  '/ar/external-links/',
  '/en/external-links/',
  '/ar/contact/',
  '/en/contact/',
  '/ar/learning-path/',
  '/en/learning-path/',
  '/ar/site-map/',
  '/en/site-map/',
  '/ar/fields/',
  '/en/scholarly-fields/',
  '/ar/fields/islamic-studies/',
  '/en/scholarly-fields/islamic-studies/',
  '/ar/fields/defense-of-sunnah/',
  '/en/scholarly-fields/defense-of-sunnah/',
  '/ar/fields/alukah/',
  '/en/scholarly-fields/alukah/',
  '/ar/fields/alukah/articles/',
  '/en/scholarly-fields/alukah/articles/',
  '/ar/fields/manuscripts/',
  '/en/scholarly-fields/manuscripts/',
  '/ar/fields/ai-and-islamic-heritage/',
  '/en/scholarly-fields/ai-and-islamic-heritage/',
  '/ar/fields/academic-reviewing/',
  '/en/scholarly-fields/academic-reviewing/',
  '/ar/fields/e-learning/',
  '/en/scholarly-fields/e-learning/',
];

const xmlEscape = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const toSitemapUrl = (path: string, lastmod?: string) => {
  const loc = xmlEscape(new URL(path, siteConfig.siteUrl).toString());
  const lastmodTag = lastmod ? `<lastmod>${lastmod}</lastmod>` : '';

  return `  <url><loc>${loc}</loc>${lastmodTag}</url>`;
};

export const GET: APIRoute = async () => {
  const [articles, books, editions, projects, media, externalLinks, flashcardDecks, studyBenefits] = await Promise.all([
    getCollection('articles'),
    getCollection('books'),
    getCollection('editions'),
    getCollection('projects'),
    getCollection('media'),
    getCollection('externalLinks'),
    getCollection('flashcardDecks'),
    getCollection('studyBenefits'),
  ]);

  const urls = new Map<string, string | undefined>();

  for (const path of staticPaths) {
    urls.set(path, undefined);
  }

  for (const entry of articles.filter((item) => !item.data.draft)) {
    urls.set(getEntryPath('articles', entry.data.lang, entry.slug), entry.data.date);
    if (entry.data.seriesSlug) {
      const seriesPath = getArticleSeriesPath(entry.data.lang, entry.data.seriesSlug);
      const existingLastmod = urls.get(seriesPath);

      if (!existingLastmod || new Date(entry.data.date).getTime() >= new Date(existingLastmod).getTime()) {
        urls.set(seriesPath, entry.data.date);
      }
    }
  }

  for (const entry of books) {
    urls.set(getEntryPath('books', entry.data.lang, entry.slug), entry.data.year ? `${entry.data.year}-01-01` : undefined);
  }

  for (const entry of editions) {
    urls.set(getEntryPath('editions', entry.data.lang, entry.slug), entry.data.year ? `${entry.data.year}-01-01` : undefined);
  }

  for (const entry of projects) {
    urls.set(getEntryPath('projects', entry.data.lang, entry.slug), entry.data.startYear ? `${entry.data.startYear}-01-01` : undefined);
  }

  for (const entry of media) {
    urls.set(getEntryPath('media', entry.data.lang, entry.slug), undefined);
  }

  for (const entry of externalLinks) {
    urls.set(getEntryPath('externalLinks', entry.data.lang, entry.slug), undefined);
  }

  const studyBookGroups = new Set<string>();

  for (const entry of studyBenefits.filter((item) => !item.data.draft)) {
    urls.set(getEntryPath('studyBenefits', entry.data.lang, entry.slug), undefined);
    const groupKey = `${entry.data.lang}::${entry.data.fieldSlug}::${entry.data.bookSlug}`;

    if (!studyBookGroups.has(groupKey)) {
      studyBookGroups.add(groupKey);
      urls.set(getStudyBenefitBookPath(entry.data.lang, entry.data.fieldSlug, entry.data.bookSlug), undefined);
    }
  }

  for (const entry of flashcardDecks.filter((item) => !item.data.draft)) {
    const deckPath = getEntryPath('flashcardDecks', entry.data.lang, entry.slug);
    urls.set(deckPath, undefined);
    urls.set(getFlashcardModePath(entry.data.lang, entry.slug, 'review'), undefined);
    urls.set(getFlashcardModePath(entry.data.lang, entry.slug, 'training'), undefined);
    urls.set(getFlashcardModePath(entry.data.lang, entry.slug, 'test'), undefined);
    urls.set(getFlashcardModePath(entry.data.lang, entry.slug, 'results'), undefined);
  }

  for (const locale of Object.keys(navigation) as Array<keyof typeof navigation>) {
    for (const link of navigation[locale]) {
      if (!urls.has(link.href)) {
        urls.set(link.href, undefined);
      }
    }
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from(urls.entries())
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, lastmod]) => toSitemapUrl(path, lastmod))
  .join('\n')}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
