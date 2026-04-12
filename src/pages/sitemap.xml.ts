import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { navigation } from '../../config/navigation';
import { siteConfig } from '../../config/site';
import { getArticleSeriesPath, getEntryPath } from '../utils/content-routing';

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

export const GET: APIRoute = async () => {
  const [articles, books, editions, projects, media, externalLinks] = await Promise.all([
    getCollection('articles'),
    getCollection('books'),
    getCollection('editions'),
    getCollection('projects'),
    getCollection('media'),
    getCollection('externalLinks'),
  ]);

  const urls = new Set<string>(staticPaths);

  for (const entry of articles.filter((item) => !item.data.draft)) {
    urls.add(getEntryPath('articles', entry.data.lang, entry.slug));
    if (entry.data.seriesSlug) {
      urls.add(getArticleSeriesPath(entry.data.lang, entry.data.seriesSlug));
    }
  }

  for (const entry of books) {
    urls.add(getEntryPath('books', entry.data.lang, entry.slug));
  }

  for (const entry of editions) {
    urls.add(getEntryPath('editions', entry.data.lang, entry.slug));
  }

  for (const entry of projects) {
    urls.add(getEntryPath('projects', entry.data.lang, entry.slug));
  }

  for (const entry of media) {
    urls.add(getEntryPath('media', entry.data.lang, entry.slug));
  }

  for (const entry of externalLinks) {
    urls.add(getEntryPath('externalLinks', entry.data.lang, entry.slug));
  }

  for (const locale of Object.keys(navigation) as Array<keyof typeof navigation>) {
    for (const link of navigation[locale]) {
      urls.add(link.href);
    }
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from(urls)
  .sort()
  .map((path) => `  <url><loc>${new URL(path, siteConfig.siteUrl).toString()}</loc></url>`)
  .join('\n')}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
