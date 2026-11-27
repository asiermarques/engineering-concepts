import type { AssessmentState } from '../challenges/assessmentState';
import type { Result } from '../challenges/grading';
import type { MultipleChoiceChallenge } from '../challenges/schema';

/** Pure model of the Learner's Progress. Keyed by stable concept, challenge and option ids (BR-003). */

export const CURRENT_VERSION = 1;

export type ConceptStatus = 'not-started' | 'in-progress' | 'mastered';

export interface ConceptProgress {
  /** Selected option ids of every graded question of the current attempt, by challenge id. */
  answers: Record<string, string[]>;
  last: Result | null;
  best: Result | null;
}

export interface Progress {
  version: typeof CURRENT_VERSION;
  concepts: Record<string, ConceptProgress>;
}

/** Each migration takes the data of version N and returns the data of version N + 1. */
export type Migrations = Record<number, (old: unknown) => unknown>;

export const migrations: Migrations = {};

export const emptyProgress = (): Progress => ({ version: CURRENT_VERSION, concepts: {} });

const emptyConcept = (): ConceptProgress => ({ answers: {}, last: null, best: null });

const withConcept = (progress: Progress, conceptId: string, change: (c: ConceptProgress) => ConceptProgress): Progress => ({
  ...progress,
  concepts: { ...progress.concepts, [conceptId]: change(progress.concepts[conceptId] ?? emptyConcept()) },
});

export function conceptStatus(progress: Progress, conceptId: string): ConceptStatus {
  const concept = progress.concepts[conceptId];
  if (!concept) return 'not-started';
  if (concept.best && concept.best.correct === concept.best.total) return 'mastered';
  if (concept.last || concept.best || Object.keys(concept.answers).length > 0) return 'in-progress';
  return 'not-started';
}

export function masteredCount(progress: Progress, conceptIds: readonly string[]): number {
  return conceptIds.filter((id) => conceptStatus(progress, id) === 'mastered').length;
}

export const saveAnswer = (progress: Progress, conceptId: string, challengeId: string, selected: readonly string[]): Progress =>
  withConcept(progress, conceptId, (c) => ({ ...c, answers: { ...c.answers, [challengeId]: [...selected] } }));

export const recordResult = (progress: Progress, conceptId: string, result: Result): Progress =>
  withConcept(progress, conceptId, (c) => ({
    ...c,
    last: result,
    best: c.best && c.best.correct / c.best.total >= result.correct / result.total ? c.best : result,
  }));

/** Retrying starts a new attempt: answers are dropped, last and best Result are kept (FR-003). */
export const clearAttempt = (progress: Progress, conceptId: string): Progress =>
  withConcept(progress, conceptId, (c) => ({ ...c, answers: {} }));

/**
 * Rebuilds the in-memory assessment state from saved answers against the current content (BR-004):
 * answers to removed challenges are ignored, answers with unknown options count as unanswered.
 */
export function restoreState(progress: Progress, conceptId: string, challenges: readonly MultipleChoiceChallenge[]): AssessmentState {
  const answers = progress.concepts[conceptId]?.answers ?? {};
  const state: AssessmentState = {};
  for (const challenge of challenges) {
    const selected = answers[challenge.id];
    if (!selected || selected.length === 0) continue;
    const known = new Set(challenge.options.map((o) => o.id));
    if (selected.every((id) => known.has(id))) state[challenge.id] = { selected: [...selected], submitted: true };
  }
  return state;
}

export const serializeProgress = (progress: Progress): string => JSON.stringify(progress, null, 2);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isScore = (value: unknown): value is Result =>
  isRecord(value) &&
  Number.isInteger(value.correct) &&
  Number.isInteger(value.total) &&
  (value.total as number) >= 1 &&
  (value.correct as number) >= 0 &&
  (value.correct as number) <= (value.total as number);

function validate(data: unknown): Progress | null {
  if (!isRecord(data) || data.version !== CURRENT_VERSION || !isRecord(data.concepts)) return null;
  const concepts: Record<string, ConceptProgress> = {};
  for (const [id, raw] of Object.entries(data.concepts)) {
    if (!isRecord(raw) || !isRecord(raw.answers)) return null;
    const answers: Record<string, string[]> = {};
    for (const [challengeId, selected] of Object.entries(raw.answers)) {
      if (!Array.isArray(selected) || !selected.every((s) => typeof s === 'string')) return null;
      answers[challengeId] = selected;
    }
    const { last, best } = raw;
    if ((last !== null && !isScore(last)) || (best !== null && !isScore(best))) return null;
    concepts[id] = { answers, last: last as Result | null, best: best as Result | null };
  }
  return { version: CURRENT_VERSION, concepts };
}

/** Parses, migrates and validates saved or imported data. Returns null when it can't be used (BR-005, BR-006). */
export function parseProgress(raw: string, available: Migrations = migrations): Progress | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  try {
    while (isRecord(data) && typeof data.version === 'number' && data.version < CURRENT_VERSION) {
      const migrate = available[data.version];
      if (!migrate) return null;
      data = migrate(data);
    }
  } catch {
    return null;
  }
  return validate(data);
}
