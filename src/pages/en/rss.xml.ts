import type { APIRoute } from 'astro';
import { buildArticlesFeed } from '../../utils/rss';

export const GET: APIRoute = (context) => buildArticlesFeed(context, 'en');
