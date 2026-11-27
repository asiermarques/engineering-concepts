import type { MultipleChoiceChallenge } from '../challenges/schema';
import type { SimulatorSequence } from '../simulators/schema';

export const MIN_CHALLENGES = 3;

export interface ContentSnapshot {
  locales: readonly string[];
  topics: { locale: string; id: string }[];
  concepts: { locale: string; id: string; topic: string; order: number }[];
  assessments: { locale: string; concept: string; challenges: MultipleChoiceChallenge[] }[];
  simulators: ({ locale: string; concept: string } & Pick<SimulatorSequence, 'actors' | 'steps'>)[];
}

/**
 * Cross-file content rules that a per-file schema cannot express (requirement 001: BR-001, BR-002,
 * BR-004; requirement 003: BR-001, BR-002 for Simulators).
 * Returns every violation, not only the first one.
 */
export function validateContent(content: ContentSnapshot): string[] {
  const errors: string[] = [];
  const [reference, ...others] = content.locales;
  if (!reference) return ['No locales configured'];

  const conceptIds = unique(content.concepts.map((c) => c.id));
  const topicIds = unique(content.topics.map((t) => t.id));

  for (const id of topicIds) {
    for (const locale of content.locales) {
      if (!content.topics.some((t) => t.locale === locale && t.id === id)) {
        errors.push(`Topic "${id}" is missing the "${locale}" translation`);
      }
    }
  }

  for (const locale of content.locales) {
    const seen = new Set<string>();
    for (const c of content.concepts.filter((c) => c.locale === locale)) {
      if (seen.has(c.id)) errors.push(`Duplicated concept id "${c.id}" in "${locale}"`);
      seen.add(c.id);
      if (!topicIds.includes(c.topic) || !content.topics.some((t) => t.locale === locale && t.id === c.topic)) {
        errors.push(`Concept "${c.id}" (${locale}) points to unknown topic "${c.topic}"`);
      }
    }
  }

  for (const id of conceptIds) {
    for (const locale of content.locales) {
      if (!content.concepts.some((c) => c.locale === locale && c.id === id)) {
        errors.push(`Concept "${id}" is missing the "${locale}" translation`);
      }
    }
    const base = content.concepts.find((c) => c.locale === reference && c.id === id);
    for (const locale of others) {
      const other = content.concepts.find((c) => c.locale === locale && c.id === id);
      if (base && other) {
        if (base.order !== other.order) errors.push(`Concept "${id}" has a different order in "${locale}" and "${reference}"`);
        if (base.topic !== other.topic) errors.push(`Concept "${id}" has a different topic in "${locale}" and "${reference}"`);
      }
    }
  }

  for (const a of content.assessments) {
    if (!content.concepts.some((c) => c.locale === a.locale && c.id === a.concept)) {
      errors.push(`Assessment in "${a.locale}" points to unknown concept "${a.concept}"`);
    }
  }

  const challengesOf = (locale: string, concept: string) =>
    content.assessments.filter((a) => a.locale === locale && a.concept === concept).flatMap((a) => a.challenges);

  for (const locale of content.locales) {
    const seen = new Set<string>();
    for (const a of content.assessments.filter((a) => a.locale === locale)) {
      for (const c of a.challenges) {
        if (seen.has(c.id)) errors.push(`Duplicated challenge id "${c.id}" in "${locale}"`);
        seen.add(c.id);
      }
    }
  }

  for (const concept of conceptIds) {
    for (const locale of content.locales) {
      if (!content.concepts.some((c) => c.locale === locale && c.id === concept)) continue;
      const count = challengesOf(locale, concept).length;
      if (count < MIN_CHALLENGES) {
        errors.push(`Concept "${concept}" has ${count} challenges in "${locale}"; the minimum is ${MIN_CHALLENGES}`);
      }
    }

    const baseChallenges = challengesOf(reference, concept);
    const allIds = unique(content.locales.flatMap((l) => challengesOf(l, concept).map((c) => c.id)));
    for (const id of allIds) {
      for (const locale of content.locales) {
        if (!challengesOf(locale, concept).some((c) => c.id === id)) {
          errors.push(`Challenge "${id}" of concept "${concept}" is missing the "${locale}" translation`);
        }
      }
    }

    for (const locale of others) {
      for (const base of baseChallenges) {
        const other = challengesOf(locale, concept).find((c) => c.id === base.id);
        if (other) errors.push(...compareOptions(base, reference, other, locale));
      }
    }
  }

  errors.push(...validateSimulators(content, conceptIds));
  return errors;
}

function validateSimulators(content: ContentSnapshot, conceptIds: string[]): string[] {
  const errors: string[] = [];
  const [reference, ...others] = content.locales;
  const find = (locale: string, concept: string) =>
    content.simulators.find((s) => s.locale === locale && s.concept === concept);

  for (const locale of content.locales) {
    const seen = new Set<string>();
    for (const s of content.simulators.filter((s) => s.locale === locale)) {
      if (seen.has(s.concept)) errors.push(`Duplicated simulator "${s.concept}" in "${locale}"`);
      seen.add(s.concept);
      if (!conceptIds.includes(s.concept)) errors.push(`Simulator in "${locale}" points to unknown concept "${s.concept}"`);
    }
  }

  for (const concept of unique(content.simulators.map((s) => s.concept))) {
    for (const locale of content.locales) {
      if (!find(locale, concept)) errors.push(`Simulator "${concept}" is missing the "${locale}" translation`);
    }
    const base = reference ? find(reference, concept) : undefined;
    for (const locale of others) {
      const other = find(locale, concept);
      if (!base || !other) continue;
      if (other.steps.length !== base.steps.length) {
        errors.push(`Simulator "${concept}" has ${other.steps.length} steps in "${locale}" but ${base.steps.length} in "${reference}"`);
      }
      if (other.actors.length !== base.actors.length) {
        errors.push(`Simulator "${concept}" has ${other.actors.length} actors in "${locale}" but ${base.actors.length} in "${reference}"`);
      }
      const shared = Math.min(base.steps.length, other.steps.length);
      for (let i = 0; i < shared; i++) {
        const [inBase, inOther] = [Boolean(base.steps[i]!.note), Boolean(other.steps[i]!.note)];
        if (inBase && !inOther) errors.push(`Simulator "${concept}": step ${i + 1} has a note in "${reference}" but not in "${locale}"`);
        if (inOther && !inBase) errors.push(`Simulator "${concept}": step ${i + 1} has a note in "${locale}" but not in "${reference}"`);
      }
    }
  }
  return errors;
}

function compareOptions(a: MultipleChoiceChallenge, aLocale: string, b: MultipleChoiceChallenge, bLocale: string): string[] {
  const errors: string[] = [];
  for (const option of a.options) {
    const twin = b.options.find((o) => o.id === option.id);
    if (!twin) errors.push(`Challenge "${a.id}": option "${option.id}" exists in "${aLocale}" but not in "${bLocale}"`);
    else if (option.correct && !twin.correct) {
      errors.push(`Challenge "${a.id}": option "${option.id}" is correct in "${aLocale}" but not in "${bLocale}"`);
    } else if (!option.correct && twin.correct) {
      errors.push(`Challenge "${a.id}": option "${option.id}" is correct in "${bLocale}" but not in "${aLocale}"`);
    }
  }
  for (const option of b.options) {
    if (!a.options.some((o) => o.id === option.id)) {
      errors.push(`Challenge "${a.id}": option "${option.id}" exists in "${bLocale}" but not in "${aLocale}"`);
    }
  }
  return errors;
}

const unique = <T>(values: T[]): T[] => [...new Set(values)];
