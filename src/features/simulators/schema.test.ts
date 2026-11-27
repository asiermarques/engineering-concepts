import { describe, expect, it } from 'vitest';
import { simulatorFileSchema } from './schema';

const valid = {
  concept: 'optimistic-locking',
  caption: 'Two clients edit the same row.',
  actors: ['Client A', 'Client B', 'Row'],
  steps: [
    { cells: ['read v3', '', 'v3'], state: 'row version 3' },
    { cells: ['', 'read v3', 'v3'], state: 'row version 3', note: 'Both hold version 3.' },
  ],
};

const issues = (input: unknown) => JSON.stringify(simulatorFileSchema.safeParse(input).error?.issues ?? []);

describe('simulatorFileSchema', () => {
  it('accepts a well-formed sequence, with and without step notes', () => {
    expect(simulatorFileSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an empty sequence', () => {
    expect(simulatorFileSchema.safeParse({ ...valid, steps: [] }).success).toBe(false);
  });

  it('rejects a sequence without actors', () => {
    expect(simulatorFileSchema.safeParse({ ...valid, actors: [], steps: [{ cells: [], state: 's' }] }).success).toBe(false);
  });

  it('rejects a step without state', () => {
    const bad = { ...valid, steps: [{ cells: ['a', '', 'b'] }] };
    expect(simulatorFileSchema.safeParse(bad).success).toBe(false);
    expect(simulatorFileSchema.safeParse({ ...valid, steps: [{ cells: ['a', '', 'b'], state: ' ' }] }).success).toBe(false);
  });

  it('rejects a step whose cells do not match its actors, naming the step', () => {
    const bad = { ...valid, steps: [valid.steps[0], { cells: ['only one'], state: 's' }] };
    expect(simulatorFileSchema.safeParse(bad).success).toBe(false);
    expect(issues(bad)).toContain('Simulator \\"optimistic-locking\\": step 2 has 1 cells but there are 3 actors');
  });

  it('rejects an empty note (omit it instead)', () => {
    const bad = { ...valid, steps: [{ ...valid.steps[0], note: '' }] };
    expect(simulatorFileSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects a step where no actor acts', () => {
    const bad = { ...valid, steps: [{ cells: ['', ' ', ''], state: 's' }] };
    expect(issues(bad)).toContain('Simulator \\"optimistic-locking\\": step 1 has no actor acting');
  });
});
