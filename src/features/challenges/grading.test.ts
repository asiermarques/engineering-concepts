import { describe, expect, it } from 'vitest';
import { gradeAnswer, isMultiSelect, computeResult } from './grading';
import type { MultipleChoiceChallenge } from './schema';

const option = (id: string, correct: boolean) => ({
  id,
  text: `Option ${id}`,
  correct,
  explanation: `Why ${id}`,
});

const single: MultipleChoiceChallenge = {
  id: 'q-single',
  type: 'multiple-choice',
  prompt: 'Pick one',
  options: [option('a', false), option('b', true), option('c', false)],
};

const multi: MultipleChoiceChallenge = {
  id: 'q-multi',
  type: 'multiple-choice',
  prompt: 'Pick all that apply',
  options: [option('a', true), option('b', true), option('c', false), option('d', false)],
};

describe('isMultiSelect', () => {
  it('is deduced from the number of correct options', () => {
    expect(isMultiSelect(single)).toBe(false);
    expect(isMultiSelect(multi)).toBe(true);
  });
});

describe('gradeAnswer', () => {
  it('marks the single correct option as correct', () => {
    expect(gradeAnswer(single, ['b'])).toEqual({ correct: true, missing: [], extra: [] });
  });

  it('marks a wrong single option as incorrect and reports the correct one as missing', () => {
    expect(gradeAnswer(single, ['a'])).toEqual({ correct: false, missing: ['b'], extra: ['a'] });
  });

  it('accepts exactly the correct set for multi-select, in any order', () => {
    expect(gradeAnswer(multi, ['b', 'a'])).toEqual({ correct: true, missing: [], extra: [] });
  });

  it('fails an incomplete multi-select selection and reports what is missing', () => {
    expect(gradeAnswer(multi, ['a'])).toEqual({ correct: false, missing: ['b'], extra: [] });
  });

  it('fails a multi-select selection with extras and reports what is extra', () => {
    expect(gradeAnswer(multi, ['a', 'b', 'c'])).toEqual({ correct: false, missing: [], extra: ['c'] });
  });

  it('fails a mixed selection and reports both missing and extra', () => {
    expect(gradeAnswer(multi, ['a', 'c'])).toEqual({ correct: false, missing: ['b'], extra: ['c'] });
  });
});

describe('computeResult', () => {
  it('counts correct answers over the total number of challenges', () => {
    expect(computeResult([true, true, false, true])).toEqual({ correct: 3, total: 4 });
  });

  it('handles an empty assessment', () => {
    expect(computeResult([])).toEqual({ correct: 0, total: 0 });
  });
});
