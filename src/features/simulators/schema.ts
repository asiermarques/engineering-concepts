import { z } from 'astro/zod';

const nonEmpty = z.string().trim().min(1);

/** One Step of a Simulator: what each actor does (empty when it doesn't act), the resulting state and an optional note. */
export const stepSchema = z.object({
  cells: z.array(z.string()),
  state: nonEmpty,
  note: nonEmpty.optional(),
});

/** A Simulator sequence: one file per Locale, named after the Concept it belongs to. */
export const simulatorFileSchema = z
  .object({
    concept: nonEmpty,
    caption: nonEmpty,
    actors: z.array(nonEmpty).min(1),
    steps: z.array(stepSchema).min(1),
  })
  .superRefine((sequence, ctx) => {
    sequence.steps.forEach((step, index) => {
      const where = `Simulator "${sequence.concept}": step ${index + 1}`;
      if (step.cells.length !== sequence.actors.length) {
        ctx.addIssue({
          code: 'custom',
          message: `${where} has ${step.cells.length} cells but there are ${sequence.actors.length} actors`,
          path: ['steps', index, 'cells'],
        });
      } else if (step.cells.every((cell) => cell.trim() === '')) {
        ctx.addIssue({ code: 'custom', message: `${where} has no actor acting`, path: ['steps', index, 'cells'] });
      }
    });
  });

export type Step = z.infer<typeof stepSchema>;
export type SimulatorSequence = z.infer<typeof simulatorFileSchema>;
