// Videos are hosted in public Google Drive folders. Each playlist's video list lives in
// src/data/videos/<slug>.json. Course recordings are refreshed with scripts/fetch_drive_folder.py (the
// order, Arabic titles and repository folders are edited by hand and survive a refresh); the da'wah
// playlists are written by make_site_data.py in the video production repo (E:\work\sada-video).

import bookSummaries from '../data/videos/book-summaries.json';
import dsa20 from '../data/videos/dsa20.json';
import lawQalu from '../data/videos/law-qalu.json';
import quranRecitations from '../data/videos/quran-recitations.json';

type Lang = 'ar' | 'en';

export type Video = {
  key: string;
  title: string;
  titleAr: string;
  order: number;
  repoPath: string;
  id: string;
  fileName: string;
  modified: string;
  // da'wah videos only
  summary?: Record<Lang, string>;
  verses?: Record<Lang, string>;
  duration?: string;
  descId?: string;
  mobile?: string[];
  status?: string[];
  article?: Record<Lang, string>;
  thumb?: string; // site-hosted poster frame, preferred over Drive's thumbnail
};

export type Playlist = {
  slug: string;
  kind: 'dawah' | 'course';
  title: Record<Lang, string>;
  course: Record<Lang, string>;
  year: string;
  summary: Record<Lang, string>;
  folderId: string;
  repoUrl?: string;
  videos: Video[];
};

const byOrder = (videos: unknown) => [...(videos as Video[])].sort((a, b) => a.order - b.order);

export const playlists: Playlist[] = [
  {
    slug: 'law-qalu',
    kind: 'dawah',
    title: { ar: 'لو قالوا', en: 'If They Said (Law Qalu)' },
    course: { ar: 'سلسلة «لو قالوا»', en: 'Law Qalu series' },
    year: '2026',
    summary: {
      ar: 'أسئلة وشبهات عن المسيح عيسى ابن مريم عليهما السلام، والجواب عنها من آيات القرآن الكريم بتلاوة الشيخ محمود خليل الحصري رحمه الله، مع الترجمة الإنجليزية. لكل حلقة نسخة أفقية، ونسخة للجوال، ونسخة مضغوطة لحالات واتساب، وملف وصف.',
      en: "Questions and claims about the Messiah, Jesus son of Mary (peace be upon them both), answered from the verses of the Qur'an, recited by Sheikh Mahmoud Khalil Al-Husary, with an English translation. Each episode has a landscape version, a mobile version, a compressed copy for WhatsApp statuses, and a description file.",
    },
    folderId: '1Li_CPXHb44UU5O2kKXCGROugDgtEgT2w',
    videos: byOrder(lawQalu),
  },
  {
    slug: 'quran-recitations',
    kind: 'dawah',
    title: { ar: 'تلاوات مرئية', en: "Qur'an Recitations" },
    course: { ar: 'تلاوات', en: 'Recitations' },
    year: '2026',
    summary: {
      ar: 'سور وآيات بتلاوة الشيخ محمود خليل الحصري رحمه الله، بالرسم العثماني مع الترجمة الإنجليزية.',
      en: 'Surahs and verses recited by Sheikh Mahmoud Khalil Al-Husary, in Uthmani script with an English translation.',
    },
    folderId: '1xgfJlyagJaci23KyyAdEMR9fvUv01Dgo',
    videos: byOrder(quranRecitations),
  },
  {
    slug: 'book-summaries',
    kind: 'dawah',
    title: { ar: 'ملخصات كتب مرئية', en: 'Video Book Summaries' },
    course: { ar: 'ملخصات كتب', en: 'Book summaries' },
    year: '2026',
    summary: {
      ar: 'ملخصات مرئية لكتب نافعة، مع رابط المقال المكتوب في هذا الموقع.',
      en: 'Video summaries of beneficial books, each linked to its written article on this site.',
    },
    folderId: '1T9I-jbjCZAjMmywJMoakdjtPr5PxpJWF',
    videos: byOrder(bookSummaries),
  },
  {
    slug: 'dsa20',
    kind: 'course',
    title: {
      ar: 'هياكل البيانات والخوارزميات: تسجيلات 2019/2020',
      en: 'Data Structures and Algorithms: 2019/2020 Recordings',
    },
    course: { ar: 'هياكل البيانات والخوارزميات', en: 'Data Structures and Algorithms' },
    year: '2019/2020',
    summary: {
      ar: 'تسجيلات مقرر هياكل البيانات والخوارزميات بكلية الحاسبات والمعلومات بجامعة المنصورة: من لغات البرمجة وأساسيات Python والبرمجة كائنية التوجه، إلى أنواع البيانات المجردة والمصفوفات والمجموعات والخرائط، ثم تعقيد الخوارزميات. لكل تسجيل رابط إلى شيفرته في مستودع المقرر على GitHub. التسجيلات بالعربية.',
      en: 'Recordings of the Data Structures and Algorithms course at the Faculty of Computers and Information, Mansoura University: programming languages, Python basics and object-oriented programming, then abstract data types, arrays, sets and maps, and algorithm complexity. Each recording links to its code in the course repository on GitHub. The recordings are in Arabic.',
    },
    folderId: '1RmLTdls3ibxA4-ZrY-6eVhfEjQSI0yv2',
    repoUrl: 'https://github.com/helghareeb/DSA20/tree/Week-06',
    videos: byOrder(dsa20),
  },
];

export const getPlaylistPath = (lang: Lang, slug: string) => `/${lang}/videos/${slug}/`;
export const getFolderUrl = (playlist: Playlist) => `https://drive.google.com/drive/folders/${playlist.folderId}`;
export const getWatchUrl = (video: Video) => `https://drive.google.com/file/d/${video.id}/view`;
export const getDownloadUrl = (video: Video) =>
  `https://drive.usercontent.google.com/download?id=${video.id}&export=download`;
export const getThumbnailUrl = (video: Video) => video.thumb ?? `https://drive.google.com/thumbnail?id=${video.id}&sz=w640`;
export const getRepoUrl = (playlist: Playlist, video: Video) =>
  video.repoPath ? `${playlist.repoUrl}/${video.repoPath}` : playlist.repoUrl;
export const getPreviewUrl = (id: string) => `https://drive.google.com/file/d/${id}/preview`;
export const getFileDownloadUrl = (id: string) => `https://drive.usercontent.google.com/download?id=${id}&export=download`;
export const getWhatsAppUrl = (text: string, url: string) =>
  `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;

export const videoLabels = {
  ar: {
    section: 'المرئيات',
    videos: (n: number) => (n === 1 ? 'تسجيل واحد' : n === 2 ? 'تسجيلان' : n <= 10 ? `${n} تسجيلات` : `${n} تسجيلًا`),
    number: (n: number) => `${n}`,
    watch: 'مشاهدة',
    download: 'تحميل',
    code: 'الشيفرة على GitHub',
    share: 'مشاركة عبر واتساب',
    folder: 'المجلد على Google Drive',
    repo: 'مستودع المقرر',
    open: 'فتح القائمة',
    mobile: 'نسخة الجوال',
    status: 'حالة واتساب',
    description: 'ملف الوصف',
    verses: 'الآيات',
    article: 'المقال المكتوب',
    play: 'تشغيل هنا',
    part: (n: number) => `الجزء ${n}`,
    dawahSection: 'مرئيات دعوية',
    courseSection: 'تسجيلات المقررات',
    dawahVideos: (n: number) => (n === 1 ? 'مرئي واحد' : n === 2 ? 'مرئيان' : n <= 10 ? `${n} مرئيات` : `${n} مرئيًا`),
    dawahNote:
      'المرئيات محفوظة على Google Drive. يمكن مشاهدتها هنا مباشرة، أو تحميلها ونشرها بلا قيد مع ذكر المصدر. نسخة الجوال عمودية بالجودة الكاملة، ونسخة حالة واتساب مضغوطة (أقل من 10 م.ب). ',
    quotaNote:
      'التسجيلات محفوظة على Google Drive. إذا ظهرت رسالة بأن عدد مرات التحميل تجاوز الحد، فشاهد التسجيل من زر «مشاهدة» أو أعد المحاولة بعد يوم. وعند تحميل ملف كبير يعرض Drive تنبيهًا بأنه لا يستطيع فحصه من الفيروسات؛ اختر «التنزيل على أي حال».',
  },
  en: {
    section: 'Videos',
    videos: (n: number) => (n === 1 ? '1 recording' : `${n} recordings`),
    number: (n: number) => `${n}`,
    watch: 'Watch',
    download: 'Download',
    code: 'Code on GitHub',
    share: 'Share on WhatsApp',
    folder: 'Folder on Google Drive',
    repo: 'Course repository',
    open: 'Open playlist',
    mobile: 'Mobile version',
    status: 'WhatsApp status',
    description: 'Description file',
    verses: 'Verses',
    article: 'Written article',
    play: 'Play here',
    part: (n: number) => `Part ${n}`,
    dawahSection: "Da'wah videos",
    courseSection: 'Course recordings',
    dawahVideos: (n: number) => (n === 1 ? '1 video' : `${n} videos`),
    dawahNote:
      'The videos are kept on Google Drive. Watch them here, or download and share them freely with attribution. The mobile version is vertical at full quality; the WhatsApp status copy is compressed (under 10 MB). ',
    quotaNote:
      'The recordings are kept on Google Drive. If Drive says the download quota has been exceeded, watch the recording with the Watch button or try again a day later. For a large file Drive warns that it cannot scan it for viruses; choose "Download anyway".',
  },
};
