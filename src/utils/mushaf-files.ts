// The PDFs of مصحف الغريب are published from helghareeb/mushaf-gharib to its own GitHub Pages
// site together with manifest.json. The mushaf page renders this list at build time and again in
// the browser from the live manifest, so a new push to that repo shows without rebuilding this site.

export const MUSHAF_BASE = 'https://helghareeb.github.io/mushaf-gharib/';
export const MUSHAF_REPO = 'https://github.com/helghareeb/mushaf-gharib';

export type MushafFile = {
  path: string;
  kind: 'screen' | 'print-interior' | 'cover-soft' | 'cover-hard' | 'other';
  juz: number | null;
  size: number;
  updated: string;
};

export type MushafManifest = {
  commit: string;
  committed: string;
  message: string;
  files: MushafFile[];
};

type Lang = 'ar' | 'en';

const t = {
  ar: {
    updated: 'آخر تحديث للملفات',
    commit: 'الإيداع',
    complete: 'الكتاب كاملًا في ملف واحد',
    completeNote: 'بفهرس وعلامات مرجعية وروابط بين الصفحات. حجمه كبير؛ ملفات الأجزاء أخف للقراءة على الهاتف.',
    volumes: 'المجلدات',
    intro: 'المقدمات',
    juz: (n: number) => `الجزء ${n}`,
    read: 'قراءة',
    download: 'تحميل',
    other: 'ملفات أخرى',
    mushkil: 'مراجعة إحالات ابن قتيبة إلى «تأويل مشكل القرآن»',
    print: 'ملفات المطبعة (PDF/X-3)',
    printNote: 'للطباعة على ورق كريمي غير مصقول، مقاس 17 × 24 سم مع 3 مم زيادة قص.',
    interior: 'المتن',
    soft: 'غلاف عادي',
    hard: 'غلاف مقوّى',
    volume: 'المجلد',
    mb: 'م.ب',
  },
  en: {
    updated: 'Files last updated',
    commit: 'commit',
    complete: 'The complete book in one file',
    completeNote: 'With an index, bookmarks and links between pages. It is large; the volume files are lighter for reading on a phone.',
    volumes: 'Volumes',
    intro: 'Introductions',
    juz: (n: number) => `Juz' ${n}`,
    read: 'Read',
    download: 'Download',
    other: 'Other files',
    mushkil: "Review of Ibn Qutayba's pointers to Ta'wil Mushkil al-Qur'an",
    print: 'Print-shop files (PDF/X-3)',
    printNote: 'For uncoated cream paper, 17 × 24 cm trim with 3 mm bleed.',
    interior: 'Interior',
    soft: 'Softcover',
    hard: 'Hardcover',
    volume: 'Volume',
    mb: 'MB',
  },
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const fileName = (path: string) => path.split('/').pop() ?? path;

export function renderMushafFiles(manifest: MushafManifest, lang: Lang): string {
  const s = t[lang];
  const size = (bytes: number) =>
    `${(bytes / 2 ** 20).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB', { maximumFractionDigits: 1 })} ${s.mb}`;
  const date = new Date(manifest.committed).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const url = (file: MushafFile) => MUSHAF_BASE + file.path.split('/').map(encodeURIComponent).join('/');
  const actions = (file: MushafFile) =>
    `<p class="mushaf-file__actions"><a class="button" href="${url(file)}" target="_blank" rel="noopener">${s.read}</a>` +
    `<a class="button-secondary" href="${url(file)}" download>${s.download}</a></p>`;
  const card = (title: string, file: MushafFile, note = '') =>
    `<article class="content-card mushaf-file"><h3>${escapeHtml(title)}</h3>` +
    `<p class="content-card__meta">${size(file.size)}</p>${note ? `<p>${escapeHtml(note)}</p>` : ''}${actions(file)}</article>`;

  const screen = manifest.files.filter((f) => f.kind === 'screen');
  const complete = screen.find((f) => /_complete\.pdf$/.test(f.path));
  const volumes = screen.filter((f) => f.juz !== null).sort((a, b) => a.juz! - b.juz!);
  const mushkil = screen.find((f) => /mushkil_review\.pdf$/.test(f.path));
  const others = manifest.files.filter(
    (f) => (f.kind === 'screen' && f !== complete && f !== mushkil && f.juz === null) || f.kind === 'other',
  );

  const printRows = Array.from(
    new Set(manifest.files.filter((f) => f.kind !== 'screen' && f.juz !== null).map((f) => f.juz!)),
  )
    .sort((a, b) => a - b)
    .map((juz) => {
      const link = (kind: MushafFile['kind']) => {
        const file = manifest.files.find((f) => f.kind === kind && f.juz === juz);
        return file ? `<a href="${url(file)}" download>${size(file.size)}</a>` : '—';
      };
      return `<tr><th scope="row">${juz === 0 ? s.intro : s.juz(juz)}</th><td>${link('print-interior')}</td><td>${link('cover-soft')}</td><td>${link('cover-hard')}</td></tr>`;
    })
    .join('');

  return [
    `<p class="content-card__meta mushaf-status">${s.updated}: ${date} · ${s.commit} ` +
      `<a href="${MUSHAF_REPO}/commit/${manifest.commit}" dir="ltr">${manifest.commit.slice(0, 7)}</a></p>`,
    complete ? `<div class="mushaf-complete">${card(s.complete, complete, s.completeNote)}</div>` : '',
    volumes.length
      ? `<div class="section-heading"><h2 class="section-title">${s.volumes}</h2></div>` +
        `<div class="mushaf-grid">${volumes.map((f) => card(f.juz === 0 ? s.intro : s.juz(f.juz!), f)).join('')}</div>`
      : '',
    mushkil || others.length
      ? `<div class="section-heading"><h2 class="section-title">${s.other}</h2></div><div class="grid-two">` +
        (mushkil ? card(s.mushkil, mushkil) : '') +
        others.map((f) => card(fileName(f.path), f)).join('') +
        '</div>'
      : '',
    printRows
      ? `<details class="mushaf-print"><summary>${s.print}</summary><p>${s.printNote}</p>` +
        `<div class="mushaf-print__table"><table><thead><tr><th scope="col">${s.volume}</th><th scope="col">${s.interior}</th>` +
        `<th scope="col">${s.soft}</th><th scope="col">${s.hard}</th></tr></thead><tbody>${printRows}</tbody></table></div></details>`
      : '',
  ].join('');
}

export async function fetchMushafManifest(): Promise<MushafManifest | undefined> {
  try {
    const response = await fetch(`${MUSHAF_BASE}manifest.json`);
    return response.ok ? ((await response.json()) as MushafManifest) : undefined;
  } catch {
    return undefined;
  }
}
