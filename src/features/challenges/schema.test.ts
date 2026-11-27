import { describe, expect, it } from 'vitest';
import { challengeSchema } from './schema';

const valid = {
  id: 'q1',
  type: 'multiple-choice',
  prompt: 'Which one?',
  options: [
    { id: 'a', text: 'A', correct: true, explanation: 'Because' },
    { id: 'b', text: 'B', correct: false, explanation: 'Not because' },
  ],
};

describe('challengeSchema', () => {
  it('accepts a well-formed multiple-choice challenge', () => {
    expect(challengeSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a challenge without any correct option, naming the challenge', () => {
    const bad = { ...valid, options: valid.options.map((o) => ({ ...o, correct: false })) };
    const result = challengeSchema.safeParse(bad);
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain('Challenge \\"q1\\" has no correct option');
  });

  it('rejects an option without explanation', () => {
    const bad = { ...valid, options: [{ ...valid.options[0], explanation: '' }, valid.options[1]] };
    expect(challengeSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects an unknown challenge type', () => {
    expect(challengeSchema.safeParse({ ...valid, type: 'find-the-bug' }).success).toBe(false);
  });

  it('rejects duplicated option ids', () => {
    const bad = { ...valid, options: [valid.options[0], { ...valid.options[1], id: 'a' }] };
    expect(challengeSchema.safeParse(bad).success).toBe(false);
  });
});
