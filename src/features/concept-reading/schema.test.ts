import { describe, expect, it } from 'vitest';
import { conceptSchema } from './schema';

const valid = {
  id: 'race-condition',
  title: 'Race condition',
  topic: 'concurrency',
  order: 1,
  learningObjective: 'Explain why read-check-write is not safe.',
  summary: 'Two requests interleave.',
};

describe('conceptSchema', () => {
  it('accepts a complete concept', () => {
    expect(conceptSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a concept without learning objective, naming the missing field', () => {
    const { learningObjective: _omit, ...rest } = valid;
    const result = conceptSchema.safeParse(rest);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['learningObjective']);
  });

  it('rejects an empty learning objective', () => {
    expect(conceptSchema.safeParse({ ...valid, learningObjective: '  ' }).success).toBe(false);
  });

  it('rejects ids that are not stable kebab-case slugs', () => {
    expect(conceptSchema.safeParse({ ...valid, id: 'Race Condition' }).success).toBe(false);
  });
});
