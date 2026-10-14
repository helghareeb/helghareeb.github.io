// Self-check quizzes. The DSA27 weeks are generated from the course question bank by
// scripts/import_dsa27_quizzes.py into src/data/quizzes/dsa27/weekNN.json; the HTML in those files
// is produced by that script, not typed by hand.

type Lang = 'ar' | 'en';

export type QuizQuestion = {
  id: string;
  level: '' | 'what' | 'how' | 'why';
  stem: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type QuizWeek = {
  week: number;
  title: string;
  questions: QuizQuestion[];
};

const dsa27Files = import.meta.glob<QuizWeek>('../data/quizzes/dsa27/week*.json', { eager: true, import: 'default' });

export const dsa27Weeks: QuizWeek[] = Object.values(dsa27Files).sort((a, b) => a.week - b.week);

export const DSA27_REPO = 'https://github.com/helghareeb/DSA27';

export const getWeekSlug = (week: number) => `week-${String(week).padStart(2, '0')}`;
export const getQuizIndexPath = (lang: Lang) => `/${lang}/quizzes/`;
export const getDsa27WeekPath = (lang: Lang, week: number) => `/${lang}/quizzes/dsa27/${getWeekSlug(week)}/`;
export const getDsa27PdfUrl = (week: number, kind: 'Questions' | 'Answers') =>
  `${DSA27_REPO}/blob/main/docs/pdf/DSA27-QB-Week${String(week).padStart(2, '0')}-${kind}.pdf`;

export const quizLabels = {
  ar: {
    section: 'الاختبارات القصيرة',
    course: 'هياكل البيانات والخوارزميات (DSA27)',
    week: (n: number) => `الأسبوع ${n}`,
    questions: (n: number) => `${n} سؤالًا`,
    score: 'النتيجة',
    answered: 'أُجيب',
    all: 'الكل',
    levels: { what: 'تذكّر', how: 'تطبيق', why: 'تعليل' },
    level: 'المستوى',
    shuffle: 'ترتيب عشوائي',
    retryWrong: 'إعادة الأسئلة الخاطئة فقط',
    showAll: 'عرض كل الأسئلة',
    reset: 'البدء من جديد',
    correct: 'إجابة صحيحة',
    wrong: 'إجابة خاطئة؛ الصحيح',
    explanation: 'الشرح',
    done: (score: number, total: number) => `انتهيت: ${score} من ${total}.`,
    noWrong: 'لا توجد أسئلة خاطئة.',
    practiceNote:
      'هذه اختبارات للتدريب الذاتي، تُحفظ إجاباتك على هذا الجهاز فقط ولا تُرسل إلى أحد. الأسئلة والشرح بالإنجليزية لغة المقرر.',
    otherParts: 'أسئلة المقال وتتبع الشيفرة وتصحيح الأخطاء وكتابة الشيفرة في بنك أسئلة الأسبوع:',
    pdfQuestions: 'بنك الأسئلة (PDF)',
    pdfAnswers: 'الإجابات (PDF)',
    repo: 'مستودع المقرر',
    previous: 'الأسبوع السابق',
    next: 'الأسبوع التالي',
  },
  en: {
    section: 'Quizzes',
    course: 'Data Structures and Algorithms (DSA27)',
    week: (n: number) => `Week ${n}`,
    questions: (n: number) => `${n} questions`,
    score: 'Score',
    answered: 'Answered',
    all: 'All',
    levels: { what: 'Recall', how: 'Apply', why: 'Explain' },
    level: 'Level',
    shuffle: 'Shuffle',
    retryWrong: 'Retry wrong answers only',
    showAll: 'Show all questions',
    reset: 'Start over',
    correct: 'Correct',
    wrong: 'Not quite; the answer is',
    explanation: 'Explanation',
    done: (score: number, total: number) => `Finished: ${score} of ${total}.`,
    noWrong: 'No wrong answers.',
    practiceNote:
      'These quizzes are for self-study. Your answers are saved on this device only and are not sent anywhere.',
    otherParts: "Essay, code-tracing, bug-fixing and coding questions are in the week's question bank:",
    pdfQuestions: 'Question bank (PDF)',
    pdfAnswers: 'Answers (PDF)',
    repo: 'Course repository',
    previous: 'Previous week',
    next: 'Next week',
  },
};
