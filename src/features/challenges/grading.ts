import type { MultipleChoiceChallenge } from './schema';

export interface Grade {
  correct: boolean;
  /** Correct options the learner did not select. */
  missing: string[];
  /** Selected options that are not correct. */
  extra: string[];
}

/** A question admits several answers when more than one option is correct. */
export function isMultiSelect(challenge: MultipleChoiceChallenge): boolean {
  return challenge.options.filter((option) => option.correct).length > 1;
}

export function gradeAnswer(challenge: MultipleChoiceChallenge, selected: readonly string[]): Grade {
  const chosen = new Set(selected);
  const missing = challenge.options.filter((o) => o.correct && !chosen.has(o.id)).map((o) => o.id);
  const extra = challenge.options.filter((o) => !o.correct && chosen.has(o.id)).map((o) => o.id);
  return { correct: missing.length === 0 && extra.length === 0, missing, extra };
}

export interface Result {
  correct: number;
  total: number;
}

export function computeResult(outcomes: readonly boolean[]): Result {
  return { correct: outcomes.filter(Boolean).length, total: outcomes.length };
}
