// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Assessment } from './Assessment';
import { ui } from '../../i18n/ui';
import type { MultipleChoiceChallenge } from './schema';
import { createProgressStore, type ProgressStore, type StorageLike } from '../progress/store';
import { conceptStatus } from '../progress/progress';

afterEach(cleanup);

const opt = (id: string, text: string, correct: boolean) => ({ id, text, correct, explanation: `Explanation of ${text}` });
const challenges: MultipleChoiceChallenge[] = [
  { id: 'one', type: 'multiple-choice', prompt: 'First?', options: [opt('a', 'Right', true), opt('b', 'Wrong', false)] },
  { id: 'two', type: 'multiple-choice', prompt: 'Pick all', options: [opt('a', 'Valid 1', true), opt('b', 'Valid 2', true), opt('c', 'Invalid', false)] },
];
const labels = ui.en.assessment;

class MemoryStorage implements StorageLike {
  data = new Map<string, string>();
  failWrites = false;
  getItem = (k: string) => this.data.get(k) ?? null;
  setItem = (k: string, v: string) => {
    if (this.failWrites) throw new Error('full');
    this.data.set(k, v);
  };
  removeItem = (k: string) => void this.data.delete(k);
}

const mount = (store: ProgressStore) =>
  render(<Assessment conceptId="concept" challenges={challenges} labels={labels} store={store} />);

describe('<Assessment /> saved progress', () => {
  it('resumes answered questions after a reload (US-001)', async () => {
    const storage = new MemoryStorage();
    const user = userEvent.setup();
    mount(createProgressStore(storage));
    await user.click(screen.getByRole('button', { name: /Wrong/ }));
    cleanup();

    mount(createProgressStore(storage));
    const first = screen.getByRole('group', { name: /First\?/ });
    expect(within(first).getByText(labels.incorrect)).toBeTruthy();
    expect(within(first).getByText('Explanation of Right')).toBeTruthy();
    const second = screen.getByRole('group', { name: /Pick all/ });
    expect(within(second).queryByText(labels.incorrect)).toBeNull();
    expect((within(second).getByRole('checkbox', { name: /Valid 1/ }) as HTMLInputElement).disabled).toBe(false);
  });

  it('saves a multi-answer question when it is confirmed, not when it is selected', async () => {
    const store = createProgressStore(new MemoryStorage());
    const user = userEvent.setup();
    mount(store);
    await user.click(screen.getByRole('checkbox', { name: /Valid 1/ }));
    expect(store.get().concepts.concept?.answers.two).toBeUndefined();
    await user.click(screen.getByRole('button', { name: labels.confirm }));
    expect(store.get().concepts.concept?.answers.two).toEqual(['a']);
  });

  it('ignores saved answers to removed challenges and keeps the rest', () => {
    const store = createProgressStore(new MemoryStorage());
    store.update((p) => ({
      ...p,
      concepts: { concept: { answers: { gone: ['a'], one: ['a'] }, last: null, best: null } },
    }));
    mount(store);
    expect(within(screen.getByRole('group', { name: /First\?/ })).getByText(labels.correct)).toBeTruthy();
    expect(screen.getAllByRole('group')).toHaveLength(2);
  });

  it('starts unanswered when the stored data is corrupt', () => {
    const storage = new MemoryStorage();
    storage.setItem('engineering-concepts:progress', '{corrupt');
    mount(createProgressStore(storage));
    expect(screen.getByText(`${labels.answered}:`).textContent).toBeTruthy();
    expect(screen.queryByText(labels.correct)).toBeNull();
    expect(screen.queryByText(labels.incorrect)).toBeNull();
  });
});

describe('<Assessment /> saved results (US-002)', () => {
  const answerAllRight = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: /Right/ }));
    await user.click(screen.getByRole('checkbox', { name: /Valid 1/ }));
    await user.click(screen.getByRole('checkbox', { name: /Valid 2/ }));
    await user.click(screen.getByRole('button', { name: labels.confirm }));
  };

  it('saves the result as last and best on completion', async () => {
    const store = createProgressStore(new MemoryStorage());
    const user = userEvent.setup();
    mount(store);
    await answerAllRight(user);
    expect(store.get().concepts.concept?.last).toEqual({ correct: 2, total: 2 });
    expect(store.get().concepts.concept?.best).toEqual({ correct: 2, total: 2 });
    expect(conceptStatus(store.get(), 'concept')).toBe('mastered');
  });

  it('retrying clears the answers but keeps best and last, even after reload', async () => {
    const storage = new MemoryStorage();
    const user = userEvent.setup();
    mount(createProgressStore(storage));
    await answerAllRight(user);
    await user.click(screen.getByRole('button', { name: labels.repeat }));
    cleanup();

    const store = createProgressStore(storage);
    mount(store);
    expect(screen.queryByText(labels.correct)).toBeNull();
    expect(store.get().concepts.concept?.last).toEqual({ correct: 2, total: 2 });
    expect(store.get().concepts.concept?.best).toEqual({ correct: 2, total: 2 });
  });

  it('a worse retry keeps the best result', async () => {
    const store = createProgressStore(new MemoryStorage());
    const user = userEvent.setup();
    mount(store);
    await answerAllRight(user);
    await user.click(screen.getByRole('button', { name: labels.repeat }));
    await user.click(screen.getByRole('button', { name: /Wrong/ }));
    await user.click(screen.getByRole('checkbox', { name: /Invalid/ }));
    await user.click(screen.getByRole('button', { name: labels.confirm }));
    expect(store.get().concepts.concept?.last).toEqual({ correct: 0, total: 2 });
    expect(store.get().concepts.concept?.best).toEqual({ correct: 2, total: 2 });
  });

  it('shows the answers and the result after reloading a completed assessment, without recording it again', async () => {
    const storage = new MemoryStorage();
    const user = userEvent.setup();
    mount(createProgressStore(storage));
    await answerAllRight(user);
    cleanup();

    const store = createProgressStore(storage);
    const before = store.get();
    mount(store);
    expect(screen.getByText(`${labels.result}: 2/2`)).toBeTruthy();
    expect(store.get()).toBe(before);
  });
});

describe('<Assessment /> unavailable storage (US-003)', () => {
  it('shows no notice when storage works', () => {
    mount(createProgressStore(new MemoryStorage()));
    expect(screen.queryByText(labels.cannotSave)).toBeNull();
  });

  it('shows the notice, and still grades, when storage is blocked', async () => {
    const user = userEvent.setup();
    mount(createProgressStore(null));
    expect(screen.getByText(labels.cannotSave)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /Right/ }));
    expect(within(screen.getByRole('group', { name: /First\?/ })).getByText(labels.correct)).toBeTruthy();
  });

  it('shows the notice when a later write fails', async () => {
    const storage = new MemoryStorage();
    const user = userEvent.setup();
    mount(createProgressStore(storage));
    await user.click(screen.getByRole('button', { name: /Right/ }));
    expect(screen.queryByText(labels.cannotSave)).toBeNull();
    storage.failWrites = true;
    await user.click(screen.getByRole('checkbox', { name: /Valid 1/ }));
    await user.click(screen.getByRole('button', { name: labels.confirm }));
    expect(screen.getByText(labels.cannotSave)).toBeTruthy();
    expect(screen.getAllByText(labels.incorrect).length).toBe(1);
  });
});
