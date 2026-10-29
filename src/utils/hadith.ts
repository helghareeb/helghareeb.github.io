// Hadith section (Level 1): one record per hadith in src/data/hadith/<book>.json, written by
// tools/build_site_data.py in the hadith-audio repo (E:\work\hadith-audio). Records are built to
// grow: audio, video, sharh and fawaid are present and empty until they exist.

import bukhari from '../data/hadith/bukhari.json';
import bukhariNotes from '../data/hadith/notes/bukhari.json';

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

export const books: Book[] = [withNotes(bukhari as Book, bukhariNotes as Notes)];

export const hadithPath = (lang: Lang, book: string, n: number) => `/${lang}/hadith/${book}/${n}/`;
export const kitabPath = (lang: Lang, book: string, slug: string) => `/${lang}/hadith/${book}/${slug}/`;
/** Arabic-Indic digits for Arabic pages (١٢٣); Western digits elsewhere. */
export const num = (lang: Lang, n: number | string) =>
  lang === 'ar' ? String(n).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]) : String(n);

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
    reader: 'القراءة',
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
    reader: 'Recitation',
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
