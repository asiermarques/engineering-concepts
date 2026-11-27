import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { assessmentFileSchema } from './features/challenges/schema';
import { conceptSchema, topicSchema } from './features/concept-reading/schema';
import { simulatorFileSchema } from './features/simulators/schema';

// Entry ids follow the file path: `<locale>/...`, so the locale is always the first segment.
const topics = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/topics' }),
  schema: topicSchema,
});

const concepts = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/concepts' }),
  schema: conceptSchema,
});

const challenges = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/challenges' }),
  schema: assessmentFileSchema,
});

// One Simulator sequence per Locale and Concept: `simulators/<locale>/<concept>.yaml`.
const simulators = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/simulators' }),
  schema: simulatorFileSchema,
});

export const collections = { topics, concepts, challenges, simulators };
