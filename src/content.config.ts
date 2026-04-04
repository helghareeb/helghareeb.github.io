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

export const collections = {
  articles,
  books,
  editions,
  projects,
};
