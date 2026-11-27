import { computeResult, gradeAnswer, isMultiSelect, type Result } from './grading';
import type { MultipleChoiceChallenge } from './schema';

export interface QuestionState {
  selected: string[];
  submitted: boolean;
}

/** In-memory state of an assessment, keyed by challenge id. Persisted by the Assessment island through `features/progress`; the reducer itself stays pure. */
export type AssessmentState = Record<string, QuestionState>;

export type Action =
  | { type: 'choose'; challengeId: string; optionId: string }
  | { type: 'toggle'; challengeId: string; optionId: string }
  | { type: 'confirm'; challengeId: string }
  | { type: 'reset' };

export const initialState = (): AssessmentState => ({});

export function reduce(
  challenges: readonly MultipleChoiceChallenge[],
  state: AssessmentState,
  action: Action,
): AssessmentState {
  if (action.type === 'reset') return initialState();

  const challenge = challenges.find((c) => c.id === action.challengeId);
  if (!challenge) return state;
  const current = state[challenge.id] ?? { selected: [], submitted: false };
  if (current.submitted) return state;

  switch (action.type) {
    case 'choose':
      if (isMultiSelect(challenge)) return state;
      return { ...state, [challenge.id]: { selected: [action.optionId], submitted: true } };
    case 'toggle': {
      if (!isMultiSelect(challenge)) return state;
      const selected = current.selected.includes(action.optionId)
        ? current.selected.filter((id) => id !== action.optionId)
        : [...current.selected, action.optionId];
      return { ...state, [challenge.id]: { selected, submitted: false } };
    }
    case 'confirm':
      if (!isMultiSelect(challenge) || current.selected.length === 0) return state;
      return { ...state, [challenge.id]: { ...current, submitted: true } };
  }
}

export interface Summary {
  answered: number;
  total: number;
  /** Only present once every question has been answered. */
  result: Result | null;
}

export function summary(challenges: readonly MultipleChoiceChallenge[], state: AssessmentState): Summary {
  const answeredChallenges = challenges.filter((c) => state[c.id]?.submitted);
  const complete = answeredChallenges.length === challenges.length && challenges.length > 0;
  return {
    answered: answeredChallenges.length,
    total: challenges.length,
    result: complete
      ? computeResult(challenges.map((c) => gradeAnswer(c, state[c.id]?.selected ?? []).correct))
      : null,
  };
}
