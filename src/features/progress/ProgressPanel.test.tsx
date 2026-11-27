// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgressPanel } from './ProgressPanel';
import { ui } from '../../i18n/ui';
import { createProgressStore } from './store';
import { conceptStatus, emptyProgress, recordResult, serializeProgress } from './progress';

afterEach(cleanup);

const labels = ui.en.progress;
const mastered = recordResult(emptyProgress(), 'x', { correct: 2, total: 2 });

const setup = (initial = mastered) => {
  const store = createProgressStore(null);
  store.update(() => initial);
  const download = vi.fn();
  render(<ProgressPanel labels={labels} store={store} download={download} />);
  return { store, download, user: userEvent.setup() };
};

const fileInput = () => document.querySelector<HTMLInputElement>('input[type="file"]')!;
const file = (text: string) => new File([text], 'progress.json', { type: 'application/json' });

describe('<ProgressPanel /> reset (US-006)', () => {
  it('asks for an in-page confirmation and resets when confirmed', async () => {
    const { store, user } = setup();
    await user.click(screen.getByRole('button', { name: labels.reset }));
    expect(screen.getByText(labels.resetConfirm)).toBeTruthy();
    expect(conceptStatus(store.get(), 'x')).toBe('mastered');
    await user.click(screen.getByRole('button', { name: labels.resetConfirmYes }));
    expect(conceptStatus(store.get(), 'x')).toBe('not-started');
    expect(screen.getByText(labels.resetDone)).toBeTruthy();
    expect(screen.queryByText(labels.resetConfirm)).toBeNull();
  });

  it('changes nothing when cancelled', async () => {
    const { store, user } = setup();
    await user.click(screen.getByRole('button', { name: labels.reset }));
    await user.click(screen.getByRole('button', { name: labels.cancel }));
    expect(conceptStatus(store.get(), 'x')).toBe('mastered');
    expect(screen.queryByText(labels.resetConfirm)).toBeNull();
  });

  it('can be reached, confirmed and cancelled with the keyboard only', async () => {
    const { store, user } = setup();
    screen.getByRole('button', { name: labels.reset }).focus();
    await user.keyboard('{Enter}');
    // focus moves into the confirmation
    expect(document.activeElement).toBe(screen.getByRole('button', { name: labels.cancel }));
    await user.keyboard('{Escape}');
    expect(screen.queryByText(labels.resetConfirm)).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: labels.reset }));
    expect(conceptStatus(store.get(), 'x')).toBe('mastered');

    await user.keyboard('{Enter}');
    await user.tab(); // Cancel -> confirm
    expect(document.activeElement).toBe(screen.getByRole('button', { name: labels.resetConfirmYes }));
    await user.keyboard('{Enter}');
    expect(conceptStatus(store.get(), 'x')).toBe('not-started');
  });
});

describe('<ProgressPanel /> export (US-007)', () => {
  it('downloads the saved progress with its schema version', async () => {
    const { download, user } = setup();
    await user.click(screen.getByRole('button', { name: labels.export }));
    expect(download).toHaveBeenCalledTimes(1);
    const [filename, text] = download.mock.calls[0]!;
    expect(filename).toMatch(/\.json$/);
    expect(text).toBe(serializeProgress(mastered));
    expect(JSON.parse(text).version).toBe(1);
  });

  it('exports empty progress that can be imported', async () => {
    const { download, user } = setup(emptyProgress());
    await user.click(screen.getByRole('button', { name: labels.export }));
    expect(createProgressStore(null).import(download.mock.calls[0]![1])).toBe(true);
  });
});

describe('<ProgressPanel /> import (US-008)', () => {
  it('replaces the progress after confirmation', async () => {
    const { store, user } = setup(emptyProgress());
    await user.upload(fileInput(), file(serializeProgress(mastered)));
    expect(await screen.findByText(labels.importConfirm)).toBeTruthy();
    expect(conceptStatus(store.get(), 'x')).toBe('not-started');
    await user.click(screen.getByRole('button', { name: labels.importConfirmYes }));
    expect(conceptStatus(store.get(), 'x')).toBe('mastered');
    expect(screen.getByText(labels.importDone)).toBeTruthy();
  });

  it('keeps the current progress when the confirmation is cancelled', async () => {
    const { store, user } = setup();
    await user.upload(fileInput(), file(serializeProgress(emptyProgress())));
    await user.click(await screen.findByRole('button', { name: labels.cancel }));
    expect(conceptStatus(store.get(), 'x')).toBe('mastered');
  });

  it('rejects an invalid file with a message and changes nothing', async () => {
    const { store, user } = setup();
    await user.upload(fileInput(), file('not a progress file'));
    expect(await screen.findByText(labels.importInvalid)).toBeTruthy();
    expect(screen.queryByText(labels.importConfirm)).toBeNull();
    expect(conceptStatus(store.get(), 'x')).toBe('mastered');
  });

  it('opens the file picker from the visible import button', async () => {
    const { user } = setup();
    const click = vi.spyOn(fileInput(), 'click');
    await user.click(screen.getByRole('button', { name: labels.import }));
    expect(click).toHaveBeenCalled();
  });
});
