import { z } from 'astro/zod';

const nonEmpty = z.string().trim().min(1);

export const optionSchema = z.object({
  id: nonEmpty,
  text: nonEmpty,
  correct: z.boolean(),
  explanation: nonEmpty,
});

export const multipleChoiceSchema = z
  .object({
    id: nonEmpty,
    type: z.literal('multiple-choice'),
    prompt: nonEmpty,
    options: z.array(optionSchema).min(2),
  })
  .superRefine((challenge, ctx) => {
    if (!challenge.options.some((option) => option.correct)) {
      ctx.addIssue({
        code: 'custom',
        message: `Challenge "${challenge.id}" has no correct option`,
        path: ['options'],
      });
    }
    const ids = challenge.options.map((option) => option.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: 'custom',
        message: `Challenge "${challenge.id}" has duplicated option ids`,
        path: ['options'],
      });
    }
  });

/** Discriminated by `type` so further challenge types can be added later. */
export const challengeSchema = z.discriminatedUnion('type', [multipleChoiceSchema]);

export const assessmentFileSchema = z.object({
  concept: nonEmpty,
  challenges: z.array(challengeSchema),
});

export type Option = z.infer<typeof optionSchema>;
export type MultipleChoiceChallenge = z.infer<typeof multipleChoiceSchema>;
export type Challenge = z.infer<typeof challengeSchema>;
export type AssessmentFile = z.infer<typeof assessmentFileSchema>;
