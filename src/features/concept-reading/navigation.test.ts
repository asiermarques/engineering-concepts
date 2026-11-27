import { describe, expect, it } from 'vitest';
import { adjacentConcepts, sortConcepts } from './navigation';

const concepts = [
  { id: 'atomicity', order: 2 },
  { id: 'race-condition', order: 1 },
  { id: 'mutex', order: 3 },
];

describe('sortConcepts', () => {
  it('orders concepts by their topic order', () => {
    expect(sortConcepts(concepts).map((c) => c.id)).toEqual(['race-condition', 'atomicity', 'mutex']);
  });
});

describe('adjacentConcepts', () => {
  it('has no previous on the first concept', () => {
    const { previous, next } = adjacentConcepts(concepts, 'race-condition');
    expect(previous).toBeNull();
    expect(next?.id).toBe('atomicity');
  });

  it('links both ways in the middle', () => {
    const { previous, next } = adjacentConcepts(concepts, 'atomicity');
    expect(previous?.id).toBe('race-condition');
    expect(next?.id).toBe('mutex');
  });

  it('has no next on the last concept', () => {
    const { previous, next } = adjacentConcepts(concepts, 'mutex');
    expect(previous?.id).toBe('atomicity');
    expect(next).toBeNull();
  });

  it('throws for an unknown concept', () => {
    expect(() => adjacentConcepts(concepts, 'nope')).toThrow('nope');
  });
});
