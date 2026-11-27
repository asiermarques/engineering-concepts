// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { paintTopicCards, paintTopicMap } from './paint';
import { emptyProgress, recordResult, saveAnswer } from './progress';
import { ui } from '../../i18n/ui';

const labels = ui.en.progress;

const mapHtml = `
<ol data-progress-map>
  <li class="stage" data-concept-id="a"><span class="stage__num">01</span><span class="stage__status"></span></li>
  <li class="stage" data-concept-id="b"><span class="stage__num">02</span><span class="stage__status"></span></li>
  <li class="stage" data-concept-id="c"><span class="stage__num">03</span><span class="stage__status"></span></li>
</ol>`;

const cardsHtml = `
<ul>
  <li class="topic-card" data-topic-concepts="a,b,c,d"><span class="topic-card__mastered"></span></li>
  <li class="topic-card" data-topic-concepts="x,y"><span class="topic-card__mastered"></span></li>
</ul>`;

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('paintTopicMap (US-004)', () => {
  it('marks mastered, in-progress and not-started concepts with text', () => {
    document.body.innerHTML = mapHtml;
    let progress = recordResult(emptyProgress(), 'a', { correct: 4, total: 4 });
    progress = saveAnswer(progress, 'b', 'q1', ['x']);
    paintTopicMap(document.body, progress, labels);
    const [a, b, c] = Array.from(document.querySelectorAll<HTMLElement>('.stage')) as [HTMLElement, HTMLElement, HTMLElement];
    expect(a.dataset.status).toBe('mastered');
    expect(a.querySelector('.stage__status')?.textContent).toContain(labels.status.mastered);
    expect(b.dataset.status).toBe('in-progress');
    expect(b.querySelector('.stage__status')?.textContent).toContain(labels.status['in-progress']);
    expect(c.dataset.status).toBe('not-started');
    expect(c.querySelector('.stage__status')?.textContent).toContain(labels.status['not-started']);
  });

  it('shows the last Result, which can be lower than the mastered best', () => {
    document.body.innerHTML = mapHtml;
    let progress = recordResult(emptyProgress(), 'a', { correct: 4, total: 4 });
    progress = recordResult(progress, 'a', { correct: 2, total: 4 });
    paintTopicMap(document.body, progress, labels);
    const a = document.querySelector<HTMLElement>('.stage')!;
    expect(a.dataset.status).toBe('mastered');
    expect(a.querySelector('.stage__status')?.textContent).toContain('2/4');
  });

  it('shows no Result for a concept without one', () => {
    document.body.innerHTML = mapHtml;
    paintTopicMap(document.body, saveAnswer(emptyProgress(), 'a', 'q', ['x']), labels);
    expect(document.querySelector('.stage__status')?.textContent).not.toMatch(/\d\/\d/);
  });

  it('repaints from scratch when progress is reset', () => {
    document.body.innerHTML = mapHtml;
    paintTopicMap(document.body, recordResult(emptyProgress(), 'a', { correct: 1, total: 1 }), labels);
    paintTopicMap(document.body, emptyProgress(), labels);
    const a = document.querySelector<HTMLElement>('.stage')!;
    expect(a.dataset.status).toBe('not-started');
    expect(a.querySelector('.stage__status')?.textContent).not.toContain(labels.status.mastered);
  });
});

describe('paintTopicCards (US-005)', () => {
  it('shows the mastered count of each topic', () => {
    document.body.innerHTML = cardsHtml;
    let progress = recordResult(emptyProgress(), 'a', { correct: 2, total: 2 });
    progress = recordResult(progress, 'b', { correct: 2, total: 2 });
    progress = recordResult(progress, 'c', { correct: 1, total: 2 });
    paintTopicCards(document.body, progress, labels);
    const [first, second] = Array.from(document.querySelectorAll('.topic-card__mastered')) as [Element, Element];
    expect(first.textContent).toBe(`2/4 ${labels.masteredUnit}`);
    expect(second.textContent).toBe(`0/2 ${labels.masteredUnit}`);
  });
});
