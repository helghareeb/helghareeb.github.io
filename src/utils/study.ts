import type { CollectionEntry } from 'astro:content';
import { getEntryRouteSlug } from './content-routing';

type StudyBenefitEntry = CollectionEntry<'studyBenefits'>;

export function getStudyBenefitRouteSlug(slug: string) {
  return getEntryRouteSlug(slug);
}

export function getStudyBenefitBookPath(lang: 'ar' | 'en', fieldSlug: string, bookSlug: string) {
  return `/${lang}/study/benefits/${fieldSlug}/${bookSlug}/`;
}

export function groupStudyBenefits(entries: StudyBenefitEntry[]) {
  const groups = new Map<
    string,
    {
      field: string;
      fieldSlug: string;
      bookTitle: string;
      bookSlug: string;
      teacher?: string;
      sourceSeries?: string;
      entries: StudyBenefitEntry[];
    }
  >();

  for (const entry of entries) {
    const key = `${entry.data.fieldSlug}::${entry.data.bookSlug}`;
    const existing = groups.get(key);

    if (existing) {
      existing.entries.push(entry);
      continue;
    }

    groups.set(key, {
      field: entry.data.field,
      fieldSlug: entry.data.fieldSlug,
      bookTitle: entry.data.bookTitle,
      bookSlug: entry.data.bookSlug,
      teacher: entry.data.teacher,
      sourceSeries: entry.data.sourceSeries,
      entries: [entry],
    });
  }

  const locale = entries[0]?.data.lang === 'en' ? 'en' : 'ar';

  return Array.from(groups.values()).sort((a, b) => {
    const fieldCompare = a.field.localeCompare(b.field, locale);
    if (fieldCompare !== 0) return fieldCompare;

    return a.bookTitle.localeCompare(b.bookTitle, locale);
  });
}
