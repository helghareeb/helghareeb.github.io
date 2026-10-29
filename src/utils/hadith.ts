// Hadith section (Level 1): one record per hadith in src/data/hadith/<book>.json, written by
// tools/build_site_data.py in the hadith-audio repo (E:\work\hadith-audio). Records are built to
// grow: audio, video, sharh and fawaid are present and empty until they exist.

import bukhari from '../data/hadith/bukhari.json';
import bukhariNotes from '../data/hadith/notes/bukhari.json';
import malik from '../data/hadith/malik.json';
import malikNotes from '../data/hadith/notes/malik.json';

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
  audio: { reader: Record<Lang, string>; id: string | null; player?: string | null };
  video: { id: string } | null;
  sharh: { ar: string; source?: string } | null;
  fawaid: { ar: string }[];
  notesStatus?: 'review' | 'approved';
};
export type Kitab = { slug: string; ar: string; en: string; first: number; last: number; hadith: Hadith[] };
export type Book = { book: { id: string; ar: string; en: string }; kutub: Kitab[] };

type Notes = Record<string, { status: 'review' | 'approved'; sharh?: string; fawaid?: string[] } | string>;

/** Merge the hand-written commentary and benefits (src/data/hadith/notes/<book>.json) into the records. */
function withNotes(book: Book, notes: Notes): Book {
  for (const k of book.kutub)
    for (const h of k.hadith) {
      const n = notes[String(h.n)];
      if (!n || typeof n === 'string') continue;
      if (n.sharh) h.sharh = { ar: n.sharh };
      if (n.fawaid) h.fawaid = n.fawaid.map((ar) => ({ ar }));
      h.notesStatus = n.status;
    }
  return book;
}

export const books: Book[] = [
  withNotes(bukhari as Book, bukhariNotes as Notes),
  withNotes(malik as Book, malikNotes as Notes),
];

// Each book is its own GitHub Pages site (repo helghareeb/hadith-<book>) under the same domain, so every
// book has its own 1 GB, and readers move between it and the main site without noticing. A book site is
// this same project built with HADITH_BOOK=<book> (see astro.config.mjs); the main site links to it.
export const HADITH_BOOK: string | undefined = process.env.HADITH_BOOK || undefined;
export const BOOK_SITES = ['malik', 'bukhari']; // books whose repo exists; the others are still pages of the main site
export const hasBookSite = (book: string) => BOOK_SITES.includes(book);
export const bookSite = (book: string) => `/hadith-${book}`;
const base = (lang: Lang, book: string) => (hasBookSite(book) ? `${bookSite(book)}/${lang}` : `/${lang}/hadith/${book}`);
export const hadithPath = (lang: Lang, book: string, n: number) => `${base(lang, book)}/${n}/`;
export const kitabPath = (lang: Lang, book: string, slug: string) => `${base(lang, book)}/${slug}/`;
/** Arabic-Indic digits for Arabic pages (١٢٣); Western digits elsewhere. */
export const num = (lang: Lang, n: number | string) =>
  lang === 'ar' ? String(n).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]) : String(n);

// Drive refuses its files to another site's <audio> element, and its embedded player never loads for
// audio files there; it does play videos. So each hadith's audio is also published as a light MP4
// (one still card + the audio): `player` is that file's Drive id, played in Drive's player on demand.
export const audioPreviewUrl = (id: string) => `https://drive.google.com/file/d/${id}/preview`;

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
    reader: 'القراءة',
    listen: 'استماع',
    audioSoon: 'يُضاف الصوت بعد التقسيم والمراجعة',
    sharh: 'شرح موجز',
    fawaid: 'فوائد',
    soon: 'يُضاف لاحقًا بإذن الله',
    review: 'قيد المراجعة',
    hadith: (n: number) => `الحديث ${num('ar', n)}`,
    count: (n: number) => (n === 1 ? 'حديث واحد' : n === 2 ? 'حديثان' : n <= 10 ? `${num('ar', n)} أحاديث` : `${num('ar', n)} حديثًا`),
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
    reader: 'Reading',
    listen: 'Listen',
    audioSoon: 'Audio will be added after splitting and review',
    sharh: 'Brief explanation',
    fawaid: 'Benefits',
    soon: 'To be added, God willing',
    review: 'Under review',
    hadith: (n: number) => `Hadith ${n}`,
    count: (n: number) => (n === 1 ? '1 hadith' : `${n} hadith`),
    share: 'Share on WhatsApp',
    report: 'Report an error',
    open: 'Hadith page',
    kitab: 'Book',
  },
};
