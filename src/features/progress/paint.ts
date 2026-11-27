import type { ProgressLabels } from '../../i18n/ui';
import { conceptStatus, masteredCount, type Progress } from './progress';

/** Fills the status of each Concept on the topic map (`[data-concept-id]`). Text, not color alone. */
export function paintTopicMap(root: ParentNode, progress: Progress, labels: ProgressLabels): void {
  for (const item of root.querySelectorAll<HTMLElement>('[data-concept-id]')) {
    const id = item.dataset.conceptId!;
    const status = conceptStatus(progress, id);
    const last = progress.concepts[id]?.last;
    item.dataset.status = status;
    const target = item.querySelector('.stage__status');
    if (target) {
      target.textContent = last
        ? `${labels.status[status]} · ${labels.lastResult} ${last.correct}/${last.total}`
        : labels.status[status];
    }
  }
}

/** Fills the mastered count of each topic card on the home page (`[data-topic-concepts]`). */
export function paintTopicCards(root: ParentNode, progress: Progress, labels: ProgressLabels): void {
  for (const card of root.querySelectorAll<HTMLElement>('[data-topic-concepts]')) {
    const ids = card.dataset.topicConcepts!.split(',').filter(Boolean);
    const target = card.querySelector('.topic-card__mastered');
    if (target) target.textContent = `${masteredCount(progress, ids)}/${ids.length} ${labels.masteredUnit}`;
  }
}
