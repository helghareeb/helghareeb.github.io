// Hadith section (Level 1): one record per hadith in src/data/hadith/<book>.json, written by
// tools/build_site_data.py in the hadith-audio repo (E:\work\hadith-audio). Records are built to
// grow: audio, video, sharh and fawaid are present and empty until they exist.

import bukhari from '../data/hadith/bukhari.json';

type Lang = 'ar' | 'en';

export type Gharib = { word: string; meaning: string; source: string };
export type Hadith = {
  n: number;
  bab: { ar: string };
  isnad: string;
  matn: string;
  gharib: Gharib[];
  grade: Record<Lang, string>;
  takhrij: Record<Lang, string>;
  en: { narrator: string; text: string; source: string };
  audio: { reader: Record<Lang, string>; id: string | null };
  video: { id: string } | null;
  sharh: { ar: string; source?: string } | null;
  fawaid: { ar: string }[];
};
export type Kitab = { slug: string; ar: string; en: string; first: number; last: number; hadith: Hadith[] };
export type Book = { book: { id: string; ar: string; en: string }; kutub: Kitab[] };

export const books: Book[] = [bukhari as Book];

export const hadithPath = (lang: Lang, book: string, n: number) => `/${lang}/hadith/${book}/${n}/`;
export const kitabPath = (lang: Lang, book: string, slug: string) => `/${lang}/hadith/${book}/${slug}/`;
export const audioUrl = (id: string) => `https://drive.usercontent.google.com/download?id=${id}&export=download`;

/** Letters only, without vowel marks or tatweel, with ى→ي, for matching gharib words in the text. */
export const bare = (s: string) =>
  s
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/[^\u0621-\u064A]/g, '');

/** Split text into tokens, marking each that matches a gharib word (by bare form, ignoring a leading و/ف). */
export function markGharib(text: string, gharib: Gharib[]) {
  const keys = new Map(gharib.map((g, i) => [bare(g.word), i]));
  return text.split(/(\s+)/).map((tok) => {
    const b = bare(tok);
    let i = keys.get(b);
    if (i === undefined && /^[وف]/.test(b)) i = keys.get(b.slice(1));
    if (i === undefined) for (const [k, v] of keys) if (k.length > 3 && (b.startsWith(k) || k.startsWith(b)) && Math.abs(k.length - b.length) <= 2) { i = v; break; }
    return { tok, g: i === undefined ? null : gharib[i] };
  });
}

export const hadithLabels = {
  ar: {
    section: 'الحديث النبوي',
    gharib: 'غريب الحديث',
    grade: 'الحكم',
    takhrij: 'التخريج',
    english: 'الترجمة الإنجليزية',
    reader: 'التلاوة',
    audioSoon: 'يُضاف الصوت بعد التقسيم والمراجعة',
    sharh: 'شرح موجز',
    fawaid: 'فوائد',
    soon: 'يُضاف لاحقًا بإذن الله',
    hadith: (n: number) => `الحديث ${n}`,
    count: (n: number) => (n === 1 ? 'حديث واحد' : n === 2 ? 'حديثان' : n <= 10 ? `${n} أحاديث` : `${n} حديثًا`),
    share: 'مشاركة عبر واتساب',
    report: 'الإبلاغ عن خطأ',
    open: 'صفحة الحديث',
    kitab: 'الكتاب',
  },
  en: {
    section: 'Hadith',
    gharib: 'Rare words (gharib)',
    grade: 'Grade',
    takhrij: 'Reference',
    english: 'English translation',
    reader: 'Recitation',
    audioSoon: 'Audio will be added after splitting and review',
    sharh: 'Brief explanation',
    fawaid: 'Benefits',
    soon: 'To be added, God willing',
    hadith: (n: number) => `Hadith ${n}`,
    count: (n: number) => (n === 1 ? '1 hadith' : `${n} hadith`),
    share: 'Share on WhatsApp',
    report: 'Report an error',
    open: 'Hadith page',
    kitab: 'Book',
  },
};
