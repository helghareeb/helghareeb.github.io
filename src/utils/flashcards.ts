import type { CollectionEntry } from 'astro:content';

export type FlashcardSessionCard = {
  id: string;
  order: number;
  question: string;
  answer: string;
  mode: 'training' | 'test' | 'review';
};

export function getDeckRouteSlug(slug: string) {
  return slug.replace(/-(ar|en)$/, '');
}

export function serializeFlashcards(entries: CollectionEntry<'flashcards'>[]): FlashcardSessionCard[] {
  return entries.map((entry) => ({
    id: entry.id,
    order: entry.data.order,
    question: entry.data.question,
    answer: entry.data.answer,
    mode: entry.data.mode,
  }));
}
