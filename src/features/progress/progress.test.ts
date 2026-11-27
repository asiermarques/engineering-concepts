import { describe, expect, it } from 'vitest';
import {
  CURRENT_VERSION,
  clearAttempt,
  conceptStatus,
  emptyProgress,
  masteredCount,
  parseProgress,
  recordResult,
  restoreState,
  saveAnswer,
  serializeProgress,
} from './progress';
import type { MultipleChoiceChallenge } from '../challenges/schema';

const opt = (id: string, correct: boolean) => ({ id, text: id, correct, explanation: id });
const challenges: MultipleChoiceChallenge[] = [
  { id: 'c1', type: 'multiple-choice', prompt: 'p', options: [opt('a', true), opt('b', false)] },
  { id: 'c2', type: 'multiple-choice', prompt: 'p', options: [opt('a', true), opt('b', true), opt('c', false)] },
];

describe('concept status (BR-001, BR-002)', () => {
  it('is not started without any saved data', () => {
    expect(conceptStatus(emptyProgress(), 'x')).toBe('not-started');
  });

  it('is in progress after at least one answer', () => {
    const p = saveAnswer(emptyProgress(), 'x', 'c1', ['a']);
    expect(conceptStatus(p, 'x')).toBe('in-progress');
  });

  it('is in progress after a completed assessment that was not fully correct', () => {
    const p = recordResult(emptyProgress(), 'x', { correct: 3, total: 4 });
    expect(conceptStatus(p, 'x')).toBe('in-progress');
  });

  it('is mastered after a completed assessment with every question correct', () => {
    const p = recordResult(emptyProgress(), 'x', { correct: 4, total: 4 });
    expect(conceptStatus(p, 'x')).toBe('mastered');
  });

  it('keeps mastered after a worse later attempt', () => {
    let p = recordResult(emptyProgress(), 'x', { correct: 4, total: 4 });
    p = recordResult(clearAttempt(p, 'x'), 'x', { correct: 2, total: 4 });
    expect(conceptStatus(p, 'x')).toBe('mastered');
  });

  it('stays in progress after retrying a non-mastered assessment', () => {
    let p = recordResult(emptyProgress(), 'x', { correct: 2, total: 4 });
    p = clearAttempt(p, 'x');
    expect(conceptStatus(p, 'x')).toBe('in-progress');
  });
});

describe('results (FR-002, FR-003)', () => {
  it('stores the result as last and best', () => {
    const p = recordResult(emptyProgress(), 'x', { correct: 3, total: 4 });
    expect(p.concepts.x!.last).toEqual({ correct: 3, total: 4 });
    expect(p.concepts.x!.best).toEqual({ correct: 3, total: 4 });
  });

  it('keeps the best result when a later one is worse', () => {
    let p = recordResult(emptyProgress(), 'x', { correct: 4, total: 4 });
    p = recordResult(p, 'x', { correct: 2, total: 4 });
    expect(p.concepts.x!.last).toEqual({ correct: 2, total: 4 });
    expect(p.concepts.x!.best).toEqual({ correct: 4, total: 4 });
  });

  it('replaces the best result when a later one is higher', () => {
    let p = recordResult(emptyProgress(), 'x', { correct: 2, total: 4 });
    p = recordResult(p, 'x', { correct: 3, total: 4 });
    expect(p.concepts.x!.best).toEqual({ correct: 3, total: 4 });
  });

  it('clearing an attempt drops the answers but keeps last and best', () => {
    let p = saveAnswer(emptyProgress(), 'x', 'c1', ['a']);
    p = recordResult(p, 'x', { correct: 1, total: 2 });
    p = clearAttempt(p, 'x');
    expect(p.concepts.x!.answers).toEqual({});
    expect(p.concepts.x!.last).toEqual({ correct: 1, total: 2 });
    expect(p.concepts.x!.best).toEqual({ correct: 1, total: 2 });
  });

  it('does not mutate the previous progress', () => {
    const before = emptyProgress();
    saveAnswer(before, 'x', 'c1', ['a']);
    expect(before.concepts).toEqual({});
  });
});

describe('masteredCount', () => {
  it('counts the mastered concepts among the given ids', () => {
    let p = recordResult(emptyProgress(), 'a', { correct: 2, total: 2 });
    p = recordResult(p, 'b', { correct: 1, total: 2 });
    p = recordResult(p, 'other', { correct: 2, total: 2 });
    expect(masteredCount(p, ['a', 'b', 'c'])).toBe(1);
  });
});

describe('restoreState (BR-004)', () => {
  it('rebuilds the assessment state from saved answers', () => {
    const p = saveAnswer(emptyProgress(), 'x', 'c1', ['b']);
    expect(restoreState(p, 'x', challenges)).toEqual({ c1: { selected: ['b'], submitted: true } });
  });

  it('ignores answers to challenges that no longer exist', () => {
    let p = saveAnswer(emptyProgress(), 'x', 'gone', ['a']);
    p = saveAnswer(p, 'x', 'c1', ['a']);
    expect(Object.keys(restoreState(p, 'x', challenges))).toEqual(['c1']);
  });

  it('treats an answer whose options no longer exist as unanswered', () => {
    const p = saveAnswer(emptyProgress(), 'x', 'c1', ['removed']);
    expect(restoreState(p, 'x', challenges)).toEqual({});
  });

  it('leaves a new challenge unanswered and keeps the previous answers', () => {
    const p = saveAnswer(emptyProgress(), 'x', 'c1', ['a']);
    const state = restoreState(p, 'x', challenges);
    expect(state.c1!.submitted).toBe(true);
    expect(state.c2).toBeUndefined();
  });

  it('returns an empty state for an unknown concept', () => {
    expect(restoreState(emptyProgress(), 'nope', challenges)).toEqual({});
  });
});

describe('parseProgress (BR-005, BR-006)', () => {
  it('round-trips serialized progress', () => {
    let p = saveAnswer(emptyProgress(), 'x', 'c1', ['a']);
    p = recordResult(p, 'x', { correct: 1, total: 2 });
    expect(parseProgress(serializeProgress(p))).toEqual(p);
  });

  it('serializes with the schema version and nothing else', () => {
    expect(Object.keys(JSON.parse(serializeProgress(emptyProgress()))).sort()).toEqual(['concepts', 'version']);
    expect(JSON.parse(serializeProgress(emptyProgress())).version).toBe(CURRENT_VERSION);
  });

  it.each([
    ['not json', '{nope'],
    ['not an object', '[]'],
    ['null', 'null'],
    ['no version', '{"concepts":{}}'],
    ['a future version', JSON.stringify({ version: CURRENT_VERSION + 1, concepts: {} })],
    ['concepts of the wrong type', JSON.stringify({ version: CURRENT_VERSION, concepts: [] })],
    [
      'answers of the wrong type',
      JSON.stringify({ version: CURRENT_VERSION, concepts: { x: { answers: { c1: 'a' }, last: null, best: null } } }),
    ],
    [
      'a score with correct above total',
      JSON.stringify({ version: CURRENT_VERSION, concepts: { x: { answers: {}, last: { correct: 5, total: 4 }, best: null } } }),
    ],
  ])('rejects %s', (_name, raw) => {
    expect(parseProgress(raw)).toBeNull();
  });

  it('migrates an older version with the given migrations', () => {
    const migrations = {
      0: (old: unknown) => {
        const { done } = old as { done: Record<string, number> };
        return {
          version: 1,
          concepts: Object.fromEntries(
            Object.entries(done).map(([id, correct]) => [
              id,
              { answers: {}, last: { correct, total: correct }, best: { correct, total: correct } },
            ]),
          ),
        };
      },
    };
    const parsed = parseProgress(JSON.stringify({ version: 0, done: { x: 3 } }), migrations);
    expect(parsed?.concepts.x?.best).toEqual({ correct: 3, total: 3 });
  });

  it('rejects an older version without a migration path', () => {
    expect(parseProgress(JSON.stringify({ version: 0, concepts: {} }))).toBeNull();
  });
});
