import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
  schema: z.object({
    title: z.string(),
    lang: z.enum(['ar', 'en']),
    date: z.string().optional(),
    summary: z.string().optional(),
    category: z.string().optional(),
    series: z.string().optional(),
    seriesSlug: z.string().optional(),
    seriesOrder: z.number().int().positive().optional(),
    sourceName: z.string().optional(),
    articleType: z.string().optional(),
    readingTime: z.string().optional(),
    externalUrl: z.string().url().optional(),
    draft: z.boolean().default(false),
  }),
});

const books = defineCollection({
  schema: z.object({
    title: z.string(),
    lang: z.enum(['ar', 'en']),
    summary: z.string().optional(),
    status: z.string().optional(),
    year: z.string().optional(),
    publisher: z.string().optional(),
    workType: z.string().optional(),
    externalUrl: z.string().url().optional(),
  }),
});

const editions = defineCollection({
  schema: z.object({
    title: z.string(),
    lang: z.enum(['ar', 'en']),
    summary: z.string().optional(),
    status: z.string().optional(),
    year: z.string().optional(),
    workType: z.string().optional(),
    sourceType: z.string().optional(),
    externalUrl: z.string().url().optional(),
  }),
});

const projects = defineCollection({
  schema: z.object({
    title: z.string(),
    lang: z.enum(['ar', 'en']),
    summary: z.string().optional(),
    status: z.string().optional(),
    area: z.string().optional(),
    startYear: z.string().optional(),
    externalUrl: z.string().url().optional(),
  }),
});

const media = defineCollection({
  schema: z.object({
    title: z.string(),
    lang: z.enum(['ar', 'en']),
    summary: z.string().optional(),
    type: z.string().optional(),
    status: z.string().optional(),
    platform: z.string().optional(),
    externalUrl: z.string().url().optional(),
  }),
});

const externalLinks = defineCollection({
  schema: z.object({
    title: z.string(),
    lang: z.enum(['ar', 'en']),
    summary: z.string().optional(),
    category: z.string().optional(),
    linkType: z.string().optional(),
    sourceName: z.string().optional(),
    externalUrl: z.string().url().optional(),
    featured: z.boolean().default(false),
  }),
});

const fields = defineCollection({
  schema: z.object({
    title: z.string(),
    lang: z.enum(['ar', 'en']),
    summary: z.string().optional(),
    href: z.string(),
    order: z.number().default(0),
    featured: z.boolean().default(false),
  }),
});

export const collections = {
  articles,
  books,
  editions,
  projects,
  media,
  externalLinks,
  fields,
};
