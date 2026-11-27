// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Assessment } from './Assessment';
import { ui } from '../../i18n/ui';
import type { MultipleChoiceChallenge } from './schema';
import { createProgressStore } from '../progress/store';

afterEach(cleanup);

const opt = (id: string, text: string, correct: boolean) => ({
  id,
  text,
  correct,
  explanation: `Explanation of ${text}`,
});

const challenges: MultipleChoiceChallenge[] = [
  {
    id: 'one',
    type: 'multiple-choice',
    prompt: 'Which is right?',
    options: [opt('a', 'Right', true), opt('b', 'Wrong', false)],
  },
  {
    id: 'two',
    type: 'multiple-choice',
    prompt: 'Pick all valid ones',
    options: [opt('a', 'Valid 1', true), opt('b', 'Valid 2', true), opt('c', 'Invalid', false)],
  },
];

const labels = ui.en.assessment;
const setup = () => render(<Assessment conceptId="test" challenges={challenges} labels={labels} store={createProgressStore(null)} />);

describe('<Assessment />', () => {
  it('grades a single-answer question immediately and shows every explanation', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: /Right/ }));
    const group = screen.getByRole('group', { name: /Which is right/ });
    expect(within(group).getByText(labels.correct)).toBeTruthy();
    expect(within(group).getByText('Explanation of Right')).toBeTruthy();
    expect(within(group).getByText('Explanation of Wrong')).toBeTruthy();
  });

  it('flags a wrong choice with text and points to the correct option', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: /Wrong/ }));
    const group = screen.getByRole('group', { name: /Which is right/ });
    expect(within(group).getByText(labels.incorrect)).toBeTruthy();
    expect(within(group).getByText(labels.correctOption)).toBeTruthy();
    expect(within(group).getByText('Explanation of Right')).toBeTruthy();
  });

  it('does not change an answered question', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: /Wrong/ }));
    await user.click(screen.getByRole('button', { name: /Right/ }));
    const group = screen.getByRole('group', { name: /Which is right/ });
    expect(within(group).getByText(labels.incorrect)).toBeTruthy();
    expect(within(group).queryByText(labels.correct)).toBeNull();
  });

  it('announces that several options must be chosen and requires confirmation', async () => {
    const user = userEvent.setup();
    setup();
    const group = screen.getByRole('group', { name: /Pick all valid ones/ });
    expect(within(group).getByText(labels.selectAll)).toBeTruthy();
    const confirm = within(group).getByRole('button', { name: labels.confirm }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    await user.click(within(group).getByRole('checkbox', { name: /Valid 1/ }));
    expect(confirm.disabled).toBe(false);
    expect(within(group).queryByText(labels.incorrect)).toBeNull();
  });

  it('reports missing and extra options for a partial multi-select', async () => {
    const user = userEvent.setup();
    setup();
    const group = screen.getByRole('group', { name: /Pick all valid ones/ });
    await user.click(within(group).getByRole('checkbox', { name: /Valid 1/ }));
    await user.click(within(group).getByRole('checkbox', { name: /Invalid/ }));
    await user.click(within(group).getByRole('button', { name: labels.confirm }));
    expect(within(group).getByText(labels.incorrect)).toBeTruthy();
    expect(within(group).getByText(labels.missingOption)).toBeTruthy();
    expect(within(group).getByText(labels.extraOption)).toBeTruthy();
  });

  it('shows the Result only when finished, announces it, and can repeat from scratch', async () => {
    const user = userEvent.setup();
    setup();
    expect(screen.queryByText(/Result/)).toBeNull();
    await user.click(screen.getByRole('button', { name: /Right/ }));
    expect(screen.queryByText(/Result/)).toBeNull();
    const group = screen.getByRole('group', { name: /Pick all valid ones/ });
    await user.click(within(group).getByRole('checkbox', { name: /Valid 1/ }));
    await user.click(within(group).getByRole('checkbox', { name: /Valid 2/ }));
    await user.click(within(group).getByRole('button', { name: labels.confirm }));

    const result = screen.getByText(`${labels.result}: 2/2`);
    expect(result.closest('[role="status"]')).not.toBeNull();

    await user.click(screen.getByRole('button', { name: labels.repeat }));
    expect(screen.queryByText(/Result/)).toBeNull();
    expect(screen.queryByText('Explanation of Right')).toBeNull();
    const again = screen.getByRole('group', { name: /Pick all valid ones/ });
    expect((within(again).getByRole('checkbox', { name: /Valid 1/ }) as HTMLInputElement).checked).toBe(false);
  });
});
