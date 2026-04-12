const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim();

const truncateText = (value: string, maxLength: number) => {
  if (value.length <= maxLength) return value;

  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
};

export const buildSeoTitle = (
  title: string,
  options: {
    lang: 'ar' | 'en';
    section: string;
  },
) => {
  const normalizedTitle = normalizeText(title);
  const author = options.lang === 'ar' ? 'د. هيثم الغريب' : 'Dr. Haitham A. El-Ghareeb';
  const sectionLabel = normalizeText(options.section);
  const withSection = `${normalizedTitle} | ${sectionLabel}`;

  if (withSection.length <= 68) {
    return withSection;
  }

  const withAuthor = `${normalizedTitle} | ${author}`;

  if (withAuthor.length <= 68) {
    return withAuthor;
  }

  return truncateText(normalizedTitle, 68);
};

export const buildSeoDescription = (
  summary: string | undefined,
  extras: Array<string | undefined>,
  maxLength = 165,
) => {
  const parts = [summary, ...extras]
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => normalizeText(value));

  return truncateText(parts.join(' | '), maxLength);
};
