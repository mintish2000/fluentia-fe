export type QuestionAnswerType = 'single' | 'multi' | 'text';

/**
 * Returns true if quiz title belongs to placement test flow.
 */
export function isPlacementQuizTitle(title: string): boolean {
  const normalized = (title || '').trim().toLowerCase();
  return normalized === 'placement test' || normalized.includes('placement');
}

/**
 * Parses options metadata for quiz/placement questions.
 */
export function parseQuestionMeta(
  rawOptions: string,
): { type: QuestionAnswerType; options: string[] } {
  try {
    const parsed = JSON.parse(rawOptions);
    if (Array.isArray(parsed)) {
      return {
        type: 'single',
        options: parsed.map((option) => String(option)),
      };
    }
    if (typeof parsed === 'object' && parsed !== null) {
      const typeValue = String(
        (parsed as { type?: string; questionType?: string }).type ??
          (parsed as { type?: string; questionType?: string }).questionType ??
          'single',
      );
      const normalizedType =
        typeValue === 'multi' || typeValue === 'text' ? typeValue : 'single';
      const rawOptionList = (parsed as { options?: unknown[]; choices?: unknown[] }).options;
      const legacyChoiceList = (parsed as { options?: unknown[]; choices?: unknown[] }).choices;
      const optionsSource = Array.isArray(rawOptionList)
        ? rawOptionList
        : Array.isArray(legacyChoiceList)
          ? legacyChoiceList
          : [];
      const options = Array.from(
        new Set(
          optionsSource
            .map((option) => String(option).trim())
            .filter(Boolean),
        ),
      );
      return {
        type: normalizedType,
        options,
      };
    }
  } catch {
    // Backward compatibility with legacy delimited strings.
  }

  return {
    type: 'single',
    options: rawOptions
      .split(/\||,/)
      .map((value) => value.trim())
      .filter(Boolean),
  };
}

/**
 * Parses only the option list from backend options payload.
 */
export function parseQuestionOptions(rawOptions: string): string[] {
  return parseQuestionMeta(rawOptions).options;
}

/**
 * Normalizes answer payload to support stable comparisons.
 */
export function normalizeComparableAnswer(answer: string): string {
  const raw = (answer || '').trim().toLowerCase();
  if (!raw.includes('||')) {
    return raw;
  }

  return raw
    .split('||')
    .map((value) => value.trim())
    .filter(Boolean)
    .sort()
    .join('||');
}
