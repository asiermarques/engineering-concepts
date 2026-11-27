export interface Ordered {
  id: string;
  order: number;
}

export const sortConcepts = <T extends Ordered>(concepts: readonly T[]): T[] =>
  [...concepts].sort((a, b) => a.order - b.order);

export function adjacentConcepts<T extends Ordered>(
  concepts: readonly T[],
  id: string,
): { previous: T | null; next: T | null } {
  const sorted = sortConcepts(concepts);
  const index = sorted.findIndex((c) => c.id === id);
  if (index === -1) throw new Error(`Unknown concept "${id}"`);
  return { previous: sorted[index - 1] ?? null, next: sorted[index + 1] ?? null };
}
