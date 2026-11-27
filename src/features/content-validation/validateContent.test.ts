import { describe, expect, it } from 'vitest';
import type { MultipleChoiceChallenge } from '../challenges/schema';
import { validateContent, type ContentSnapshot } from './validateContent';
import type { SimulatorSequence } from '../simulators/schema';

const q = (id: string, correctId = 'a'): MultipleChoiceChallenge => ({
  id,
  type: 'multiple-choice',
  prompt: id,
  options: ['a', 'b'].map((o) => ({ id: o, text: o, correct: o === correctId, explanation: 'x' })),
});

const threeQuestions = () => [q('q1'), q('q2'), q('q3')];

const sequence = (): Pick<SimulatorSequence, 'actors' | 'steps'> => ({
  actors: ['A', 'B'],
  steps: [
    { cells: ['read', ''], state: 's1' },
    { cells: ['', 'read'], state: 's2', note: 'n2' },
    { cells: ['write', ''], state: 's3' },
  ],
});

function snapshot(): ContentSnapshot {
  const concepts = (locale: string) => [
    { locale, id: 'race-condition', topic: 'concurrency', order: 1 },
    { locale, id: 'atomicity', topic: 'concurrency', order: 2 },
  ];
  const assessments = (locale: string) => [
    { locale, concept: 'race-condition', challenges: threeQuestions() },
    { locale, concept: 'atomicity', challenges: [q('q4'), q('q5'), q('q6')] },
  ];
  return {
    locales: ['en', 'es'],
    topics: [
      { locale: 'en', id: 'concurrency' },
      { locale: 'es', id: 'concurrency' },
    ],
    concepts: [...concepts('en'), ...concepts('es')],
    assessments: [...assessments('en'), ...assessments('es')],
    simulators: [
      { locale: 'en', concept: 'race-condition', ...sequence() },
      { locale: 'es', concept: 'race-condition', ...sequence() },
    ],
  };
}

const simulatorIn = (s: ContentSnapshot, locale: string) => s.simulators.find((x) => x.locale === locale)!;

describe('validateContent', () => {
  it('passes for complete, consistent content', () => {
    expect(validateContent(snapshot())).toEqual([]);
  });

  it('fails when a concept lacks a translation, naming concept and locale', () => {
    const s = snapshot();
    s.concepts = s.concepts.filter((c) => !(c.locale === 'en' && c.id === 'atomicity'));
    expect(validateContent(s)).toContain('Concept "atomicity" is missing the "en" translation');
  });

  it('fails when a topic lacks a translation', () => {
    const s = snapshot();
    s.topics = s.topics.filter((t) => t.locale === 'en');
    expect(validateContent(s)).toContain('Topic "concurrency" is missing the "es" translation');
  });

  it('fails when a challenge exists in one locale only, naming challenge and locale', () => {
    const s = snapshot();
    const es = s.assessments.find((a) => a.locale === 'es' && a.concept === 'race-condition')!;
    es.challenges = es.challenges.filter((c) => c.id !== 'q3').concat(q('q9'), q('q10'));
    const errors = validateContent(s);
    expect(errors).toContain('Challenge "q3" of concept "race-condition" is missing the "es" translation');
    expect(errors).toContain('Challenge "q9" of concept "race-condition" is missing the "en" translation');
  });

  it('fails when a concept has fewer than 3 challenges, naming the concept', () => {
    const s = snapshot();
    for (const a of s.assessments.filter((a) => a.concept === 'atomicity')) a.challenges = [q('q4'), q('q5')];
    const errors = validateContent(s);
    expect(errors).toContain('Concept "atomicity" has 2 challenges in "en"; the minimum is 3');
    expect(errors).toContain('Concept "atomicity" has 2 challenges in "es"; the minimum is 3');
  });

  it('fails when a concept has no assessment at all', () => {
    const s = snapshot();
    s.assessments = s.assessments.filter((a) => a.concept !== 'atomicity');
    expect(validateContent(s)).toContain('Concept "atomicity" has 0 challenges in "en"; the minimum is 3');
  });

  it('fails when the correct option differs between locales, naming challenge and option', () => {
    const s = snapshot();
    const es = s.assessments.find((a) => a.locale === 'es' && a.concept === 'race-condition')!;
    es.challenges[0] = q('q1', 'b');
    const errors = validateContent(s);
    expect(errors).toContain(
      'Challenge "q1": option "a" is correct in "en" but not in "es"',
    );
  });

  it('fails when the option ids differ between locales', () => {
    const s = snapshot();
    const es = s.assessments.find((a) => a.locale === 'es' && a.concept === 'race-condition')!;
    es.challenges[0] = { ...q('q1'), options: [...q('q1').options, { id: 'c', text: 'c', correct: false, explanation: 'x' }] };
    expect(validateContent(s)).toContain('Challenge "q1": option "c" exists in "es" but not in "en"');
  });

  it('fails on duplicated challenge ids within a locale', () => {
    const s = snapshot();
    const en = s.assessments.find((a) => a.locale === 'en' && a.concept === 'atomicity')!;
    en.challenges[0] = q('q1');
    expect(validateContent(s)).toContain('Duplicated challenge id "q1" in "en"');
  });

  it('fails when an assessment points to a missing concept', () => {
    const s = snapshot();
    s.assessments.push({ locale: 'en', concept: 'ghost', challenges: threeQuestions() });
    expect(validateContent(s)).toContain('Assessment in "en" points to unknown concept "ghost"');
  });

  it('fails when a concept points to a missing topic', () => {
    const s = snapshot();
    s.concepts = s.concepts.map((c) => (c.id === 'atomicity' ? { ...c, topic: 'nope' } : c));
    expect(validateContent(s)).toContain('Concept "atomicity" (en) points to unknown topic "nope"');
  });

  it('fails when order or topic differ between locales', () => {
    const s = snapshot();
    s.concepts = s.concepts.map((c) => (c.locale === 'es' && c.id === 'atomicity' ? { ...c, order: 5 } : c));
    expect(validateContent(s)).toContain('Concept "atomicity" has a different order in "es" and "en"');
  });

  it('reports all errors together, not only the first', () => {
    const s = snapshot();
    s.topics = s.topics.filter((t) => t.locale === 'en');
    s.concepts = s.concepts.filter((c) => !(c.locale === 'es' && c.id === 'atomicity'));
    expect(validateContent(s).length).toBeGreaterThanOrEqual(2);
  });

  describe('simulators', () => {
    it('fails when the step count differs between locales, naming the concept and both counts', () => {
      const s = snapshot();
      simulatorIn(s, 'es').steps.pop();
      expect(validateContent(s)).toContain('Simulator "race-condition" has 2 steps in "es" but 3 in "en"');
    });

    it('fails when the number of actors differs between locales', () => {
      const s = snapshot();
      const es = simulatorIn(s, 'es');
      es.actors = ['A', 'B', 'C'];
      es.steps = es.steps.map((step) => ({ ...step, cells: [...step.cells, ''] }));
      expect(validateContent(s)).toContain('Simulator "race-condition" has 3 actors in "es" but 2 in "en"');
    });

    it('fails when a step note exists in one locale only, naming the step and the missing locale', () => {
      const s = snapshot();
      simulatorIn(s, 'en').steps[2]!.note = 'only in en';
      delete simulatorIn(s, 'es').steps[1]!.note;
      const errors = validateContent(s);
      expect(errors).toContain('Simulator "race-condition": step 3 has a note in "en" but not in "es"');
      expect(errors).toContain('Simulator "race-condition": step 2 has a note in "en" but not in "es"');
    });

    it('fails when a simulator lacks a translation', () => {
      const s = snapshot();
      s.simulators = s.simulators.filter((x) => x.locale === 'en');
      expect(validateContent(s)).toContain('Simulator "race-condition" is missing the "es" translation');
    });

    it('fails when a simulator points to a missing concept', () => {
      const s = snapshot();
      s.simulators.push({ locale: 'en', concept: 'ghost', ...sequence() }, { locale: 'es', concept: 'ghost', ...sequence() });
      expect(validateContent(s)).toContain('Simulator in "en" points to unknown concept "ghost"');
    });

    it('fails on two simulators for the same concept in one locale', () => {
      const s = snapshot();
      s.simulators.push({ locale: 'en', concept: 'race-condition', ...sequence() });
      expect(validateContent(s)).toContain('Duplicated simulator "race-condition" in "en"');
    });
  });
});
