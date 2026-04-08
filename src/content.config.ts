import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
  schema: z.object({
    title: z.string(),
    lang: z.enum(['ar', 'en']),
    date: z.string().optional(),
    summary: z.string().optional(),
    category: z.string().optional(),
    series: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const books = defineCollection({
  schema: z.object({
    title: z.string(),
    lang: z.enum(['ar', 'en']),
    summary: z.string().optional(),
    status: z.string().optional(),
  }),
});

const editions = defineCollection({
  schema: z.object({
    title: z.string(),
    lang: z.enum(['ar', 'en']),
    summary: z.string().optional(),
    status: z.string().optional(),
  }),
});

const projects = defineCollection({
  schema: z.object({
    title: z.string(),
    lang: z.enum(['ar', 'en']),
    summary: z.string().optional(),
    status: z.string().optional(),
  }),
});

const media = defineCollection({
  schema: z.object({
    title: z.string(),
    lang: z.enum(['ar', 'en']),
    summary: z.string().optional(),
    type: z.string().optional(),
    status: z.string().optional(),
    externalUrl: z.string().url().optional(),
  }),
});

const externalLinks = defineCollection({
  schema: z.object({
    title: z.string(),
    lang: z.enum(['ar', 'en']),
    summary: z.string().optional(),
    category: z.string().optional(),
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
