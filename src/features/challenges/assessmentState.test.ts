import { describe, expect, it } from 'vitest';
import type { MultipleChoiceChallenge } from './schema';
import { initialState, reduce, summary } from './assessmentState';

const opt = (id: string, correct: boolean) => ({ id, text: id, correct, explanation: `why ${id}` });
const single: MultipleChoiceChallenge = {
  id: 's',
  type: 'multiple-choice',
  prompt: 'p',
  options: [opt('a', true), opt('b', false)],
};
const multi: MultipleChoiceChallenge = {
  id: 'm',
  type: 'multiple-choice',
  prompt: 'p',
  options: [opt('a', true), opt('b', true), opt('c', false)],
};
const challenges = [single, multi];

describe('assessment state', () => {
  it('starts with nothing answered and no result', () => {
    const s = initialState();
    expect(summary(challenges, s)).toEqual({ answered: 0, total: 2, result: null });
  });

  it('grades a single-select question as soon as an option is chosen', () => {
    const s = reduce(challenges, initialState(), { type: 'choose', challengeId: 's', optionId: 'a' });
    expect(s['s']).toEqual({ selected: ['a'], submitted: true });
  });

  it('ignores a second choice on an already answered question', () => {
    let s = reduce(challenges, initialState(), { type: 'choose', challengeId: 's', optionId: 'b' });
    s = reduce(challenges, s, { type: 'choose', challengeId: 's', optionId: 'a' });
    expect(s['s']).toEqual({ selected: ['b'], submitted: true });
  });

  it('toggles options of a multi-select question without grading', () => {
    let s = reduce(challenges, initialState(), { type: 'toggle', challengeId: 'm', optionId: 'a' });
    s = reduce(challenges, s, { type: 'toggle', challengeId: 'm', optionId: 'b' });
    s = reduce(challenges, s, { type: 'toggle', challengeId: 'm', optionId: 'a' });
    expect(s['m']).toEqual({ selected: ['b'], submitted: false });
  });

  it('cannot confirm an empty selection', () => {
    const s = reduce(challenges, initialState(), { type: 'confirm', challengeId: 'm' });
    expect(s['m']?.submitted ?? false).toBe(false);
  });

  it('locks a multi-select question once confirmed', () => {
    let s = reduce(challenges, initialState(), { type: 'toggle', challengeId: 'm', optionId: 'a' });
    s = reduce(challenges, s, { type: 'confirm', challengeId: 'm' });
    s = reduce(challenges, s, { type: 'toggle', challengeId: 'm', optionId: 'b' });
    expect(s['m']).toEqual({ selected: ['a'], submitted: true });
  });

  it('shows the result only when every question is answered', () => {
    let s = reduce(challenges, initialState(), { type: 'choose', challengeId: 's', optionId: 'a' });
    expect(summary(challenges, s).result).toBeNull();
    s = reduce(challenges, s, { type: 'toggle', challengeId: 'm', optionId: 'a' });
    s = reduce(challenges, s, { type: 'confirm', challengeId: 'm' });
    expect(summary(challenges, s)).toEqual({ answered: 2, total: 2, result: { correct: 1, total: 2 } });
  });

  it('resets everything, including unconfirmed selections', () => {
    let s = reduce(challenges, initialState(), { type: 'choose', challengeId: 's', optionId: 'a' });
    s = reduce(challenges, s, { type: 'toggle', challengeId: 'm', optionId: 'a' });
    expect(reduce(challenges, s, { type: 'reset' })).toEqual(initialState());
  });
});
