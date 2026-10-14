// Course recordings are hosted in public Google Drive folders. Each playlist's video list lives in
// src/data/videos/<slug>.json and is refreshed with scripts/fetch_drive_folder.py; the order, Arabic
// titles and repository folders in that file are edited by hand and survive a refresh.

import dsa20 from '../data/videos/dsa20.json';

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
};

export type Playlist = {
  slug: string;
  title: Record<Lang, string>;
  course: Record<Lang, string>;
  year: string;
  summary: Record<Lang, string>;
  folderId: string;
  repoUrl: string;
  videos: Video[];
};

export const playlists: Playlist[] = [
  {
    slug: 'dsa20',
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
    videos: [...(dsa20 as Video[])].sort((a, b) => a.order - b.order),
  },
];

export const getPlaylistPath = (lang: Lang, slug: string) => `/${lang}/videos/${slug}/`;
export const getFolderUrl = (playlist: Playlist) => `https://drive.google.com/drive/folders/${playlist.folderId}`;
export const getWatchUrl = (video: Video) => `https://drive.google.com/file/d/${video.id}/view`;
export const getDownloadUrl = (video: Video) =>
  `https://drive.usercontent.google.com/download?id=${video.id}&export=download`;
export const getThumbnailUrl = (video: Video) => `https://drive.google.com/thumbnail?id=${video.id}&sz=w640`;
export const getRepoUrl = (playlist: Playlist, video: Video) =>
  video.repoPath ? `${playlist.repoUrl}/${video.repoPath}` : playlist.repoUrl;
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
    quotaNote:
      'The recordings are kept on Google Drive. If Drive says the download quota has been exceeded, watch the recording with the Watch button or try again a day later. For a large file Drive warns that it cannot scan it for viruses; choose "Download anyway".',
  },
};
