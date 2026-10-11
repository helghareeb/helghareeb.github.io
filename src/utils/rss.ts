import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { siteConfig } from '../../config/site';
import { getEntryPath } from './content-routing';

type Locale = 'ar' | 'en';

const FEED_SIZE = 50;

const toTime = (value?: string) => {
  const time = value ? new Date(value).getTime() : Number.NaN;
  return Number.isNaN(time) ? undefined : time;
};

export async function buildArticlesFeed(context: APIContext, lang: Locale) {
  const site = context.site ?? new URL(siteConfig.siteUrl);

  // Newest first; articles without a usable date go to the end, ordered by title.
  const articles = (await getCollection('articles'))
    .filter((entry) => entry.data.lang === lang && !entry.data.draft)
    .sort((a, b) => {
      const aTime = toTime(a.data.date);
      const bTime = toTime(b.data.date);
      if (aTime !== undefined && bTime !== undefined) return bTime - aTime;
      if (aTime !== undefined) return -1;
      if (bTime !== undefined) return 1;
      return a.data.title.localeCompare(b.data.title, lang);
    })
    .slice(0, FEED_SIZE);

  const author = lang === 'ar' ? siteConfig.authorAr : siteConfig.authorEn;

  return rss({
    title: lang === 'ar' ? `${author}: المقالات` : `${author}: Articles`,
    description:
      lang === 'ar'
        ? 'أحدث مقالات د. هيثم الغريب في العلوم الشرعية.'
        : 'Latest articles by Dr. Haitham A. El-Ghareeb on Islamic scholarship.',
    // Channel link points at the locale's articles index; item links are already absolute.
    site: new URL(`/${lang}/articles/`, site).toString(),
    items: articles.map((article) => {
      const time = toTime(article.data.date);

      return {
        title: article.data.title,
        link: new URL(getEntryPath('articles', lang, article.slug), site).toString(),
        pubDate: time !== undefined ? new Date(time) : undefined,
        description: article.data.summary,
        categories: article.data.category ? [article.data.category] : undefined,
      };
    }),
    customData: `<language>${lang}</language>`,
    trailingSlash: true,
  });
}
