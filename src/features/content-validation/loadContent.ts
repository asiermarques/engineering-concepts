import { getCollection } from 'astro:content';
import type { MultipleChoiceChallenge } from '../challenges/schema';
import { isLocale, locales, type Locale } from '../../i18n/ui';
import { validateContent } from './validateContent';

/**
 * Loads every collection and fails the build with all cross-file violations at once
 * (missing translations, too few challenges, mismatching options, Simulator steps...). Per-file shape is
 * already enforced by the Zod schemas of the collections.
 */
export async function loadContent() {
  const [topics, concepts, assessments, simulators] = await Promise.all([
    getCollection('topics'),
    getCollection('concepts'),
    getCollection('challenges'),
    getCollection('simulators'),
  ]);

  const errors: string[] = [];
  const localeOf = (entryId: string, kind: string): Locale | null => {
    const locale = entryId.split('/')[0];
    if (isLocale(locale)) return locale;
    errors.push(`${kind} file "${entryId}" is not inside a locale folder (${locales.join(', ')})`);
    return null;
  };

  const snapshot = {
    locales: [...locales],
    topics: topics.flatMap((t) => {
      const locale = localeOf(t.id, 'Topic');
      return locale ? [{ locale, id: t.data.id }] : [];
    }),
    concepts: concepts.flatMap((c) => {
      const locale = localeOf(c.id, 'Concept');
      if (!locale) return [];
      if (!c.id.endsWith(`/${c.data.id}`)) {
        errors.push(`Concept file "${c.id}" must be named after its id "${c.data.id}"`);
      }
      return [{ locale, id: c.data.id, topic: c.data.topic, order: c.data.order }];
    }),
    assessments: assessments.flatMap((a) => {
      const locale = localeOf(a.id, 'Challenges');
      if (!locale) return [];
      if (a.id !== `${locale}/${a.data.concept}`) {
        errors.push(`Challenges file "${a.id}" must be named after its concept "${a.data.concept}"`);
      }
      return [{ locale, concept: a.data.concept, challenges: a.data.challenges as MultipleChoiceChallenge[] }];
    }),
    simulators: simulators.flatMap((s) => {
      const locale = localeOf(s.id, 'Simulator');
      if (!locale) return [];
      if (s.id !== `${locale}/${s.data.concept}`) {
        errors.push(`Simulator file "${s.id}" must be named after its concept "${s.data.concept}"`);
      }
      return [{ locale, concept: s.data.concept, actors: s.data.actors, steps: s.data.steps }];
    }),
  };

  errors.push(...validateContent(snapshot));
  if (errors.length > 0) {
    throw new Error(`Content validation failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`);
  }

  return { topics, concepts, assessments };
}

export const entryLocale = (entryId: string): Locale => entryId.split('/')[0] as Locale;
