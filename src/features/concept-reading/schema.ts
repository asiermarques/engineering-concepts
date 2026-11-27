import { z } from 'astro/zod';

const nonEmpty = z.string().trim().min(1);
export const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'must be a kebab-case slug');

/** Frontmatter of a concept. `id` is stable and identical across locales. */
export const conceptSchema = z.object({
  id: slug,
  title: nonEmpty,
  topic: slug,
  order: z.number().int().positive(),
  learningObjective: nonEmpty,
  summary: nonEmpty,
});

/** Frontmatter of a topic; its body is the presentation text. */
export const topicSchema = z.object({
  id: slug,
  title: nonEmpty,
  summary: nonEmpty,
});

export type ConceptData = z.infer<typeof conceptSchema>;
export type TopicData = z.infer<typeof topicSchema>;
