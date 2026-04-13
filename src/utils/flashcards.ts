import type { CollectionEntry } from 'astro:content';

export type FlashcardSessionCard = {
  id: string;
  order: number;
  orderLabel?: string;
  question: string;
  answer: string;
  mode: 'training' | 'test' | 'review';
};

export function getDeckRouteSlug(slug: string) {
  return slug.replace(/-(ar|en)$/, '');
}

function splitNumberedSegments(content: string) {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const segments: Array<{ number: number; text: string }> = [];
  const intro: string[] = [];
  let current: { number: number; lines: string[] } | null = null;

  for (const line of lines) {
    const match = line.match(/^(\d+)\.\s*(.+)$/);
    if (match) {
      if (current) {
        segments.push({
          number: current.number,
          text: current.lines.join('\n').trim(),
        });
      }
      current = {
        number: Number(match[1]),
        lines: [match[2].trim()],
      };
      continue;
    }

    if (current) {
      current.lines.push(line);
    } else {
      intro.push(line);
    }
  }

  if (current) {
    segments.push({
      number: current.number,
      text: current.lines.join('\n').trim(),
    });
  }

  return {
    intro: intro.join('\n').trim(),
    segments,
  };
}

function expandCompoundFlashcard(card: FlashcardSessionCard): FlashcardSessionCard[] {
  const questionParts = splitNumberedSegments(card.question);
  const answerParts = splitNumberedSegments(card.answer);

  if (questionParts.segments.length < 2) {
    return [card];
  }

  const answerByNumber = new Map(answerParts.segments.map((segment) => [segment.number, segment.text]));
  const canSplit = questionParts.segments.every((segment) => answerByNumber.has(segment.number));

  if (!canSplit) {
    return [card];
  }

  return questionParts.segments.map((segment, index) => ({
    ...card,
    id: `${card.id}::${segment.number}`,
    order: card.order * 100 + index + 1,
    orderLabel: `${card.order}-${segment.number}`,
    question: questionParts.intro ? `${questionParts.intro}\n${segment.text}` : segment.text,
    answer: answerByNumber.get(segment.number) || '',
  }));
}

export function serializeFlashcards(entries: CollectionEntry<'flashcards'>[]): FlashcardSessionCard[] {
  return entries.flatMap((entry) =>
    expandCompoundFlashcard({
      id: entry.id,
      order: entry.data.order,
      question: entry.data.question,
      answer: entry.data.answer,
      mode: entry.data.mode,
    }),
  );
}
