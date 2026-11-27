// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { AUTOPLAY_PACE_MS, Simulator } from './Simulator';
import type { SimulatorSequence } from './schema';
import { ui } from '../../i18n/ui';

afterEach(cleanup);

const labels = ui.en.simulator;

const sequence: Omit<SimulatorSequence, 'concept'> = {
  caption: 'Two clients race for one row.',
  actors: ['Client A', 'Client B', 'Row'],
  steps: [
    { cells: ['read v3', '', 'v3'], state: 'row at version 3' },
    { cells: ['', 'read v3', 'v3'], state: 'both hold version 3', note: 'No lock was taken.' },
    { cells: ['write → 1 row', '', 'v4'], state: 'row at version 4' },
    { cells: ['', 'write → 0 rows', 'v4'], state: 'conflict for B' },
  ],
};

const setup = (s = sequence) => render(<Simulator sequence={s} labels={labels}><p>static fallback</p></Simulator>);
const control = (name: string) => screen.getByRole('button', { name });
const isDisabled = (name: string) => control(name).getAttribute('aria-disabled') === 'true';
const rows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1);
const counter = () => document.querySelector('.simulator__counter')?.textContent;
const live = () => document.querySelector('[aria-live="polite"]')?.textContent;
const press = (name: string) => act(() => void fireEvent.click(control(name)));

describe('<Simulator />', () => {
  it('renders only the static fallback before hydrating (no-JS output)', () => {
    const html = renderToString(<Simulator sequence={sequence} labels={labels}><p>static fallback</p></Simulator>);
    expect(html).toContain('static fallback');
    expect(html).not.toContain('simulator__counter');
  });

  it('starts on step 1: caption, only step 1 revealed and current, its state, Previous disabled', () => {
    setup();
    expect(screen.queryByText('static fallback')).toBeNull();
    expect(screen.getByText(sequence.caption)).toBeTruthy();
    expect(counter()).toBe('Step 1/4');
    expect(rows()).toHaveLength(1);
    expect(rows()[0]!.getAttribute('aria-current')).toBe('step');
    expect(document.querySelector('.simulator__state')?.textContent).toContain('row at version 3');
    expect(document.querySelector('.simulator__note')).toBeNull();
    expect(isDisabled('Previous')).toBe(true);
    expect(isDisabled('Next')).toBe(false);
    expect(live()).toBe('');
  });

  it('shows one lane header per actor', () => {
    setup();
    for (const actor of sequence.actors) expect(screen.getByRole('columnheader', { name: actor })).toBeTruthy();
  });

  it('Next reveals and highlights the next step, shows its state and its note', () => {
    setup();
    press('Next');
    expect(counter()).toBe('Step 2/4');
    expect(rows()).toHaveLength(2);
    expect(rows()[0]!.getAttribute('aria-current')).toBeNull();
    expect(rows()[1]!.getAttribute('aria-current')).toBe('step');
    expect(document.querySelector('.simulator__state')?.textContent).toContain('both hold version 3');
    expect(document.querySelector('.simulator__note')?.textContent).toContain('No lock was taken.');
    press('Next');
    expect(document.querySelector('.simulator__note')).toBeNull();
  });

  it('announces each step change: step, acting actors, state and note', () => {
    setup();
    press('Next');
    expect(live()).toBe('Step 2 of 4. Client B: read v3. Row: v3. State: both hold version 3. Note: No lock was taken.');
    press('Previous');
    expect(live()).toBe('Step 1 of 4. Client A: read v3. Row: v3. State: row at version 3.');
  });

  it('disables Next on the last step and ignores presses on disabled controls', () => {
    setup();
    for (let i = 0; i < 5; i++) press('Next');
    expect(counter()).toBe('Step 4/4');
    expect(isDisabled('Next')).toBe(true);
    expect(isDisabled('Play')).toBe(true);
    press('Next');
    expect(counter()).toBe('Step 4/4');
  });

  it('Restart returns to step 1 with only step 1 revealed', () => {
    setup();
    expect(isDisabled('Restart')).toBe(true);
    press('Next');
    press('Next');
    press('Restart');
    expect(counter()).toBe('Step 1/4');
    expect(rows()).toHaveLength(1);
  });

  it('a single-step sequence renders with every control disabled', () => {
    setup({ caption: 'One step.', actors: ['Only'], steps: [{ cells: ['acts'], state: 'done' }] });
    expect(counter()).toBe('Step 1/1');
    for (const name of ['Restart', 'Previous', 'Play', 'Next']) expect(isDisabled(name)).toBe(true);
  });

  it('never touches browser storage', () => {
    const get = vi.spyOn(Storage.prototype, 'getItem');
    const set = vi.spyOn(Storage.prototype, 'setItem');
    setup();
    press('Next');
    press('Restart');
    expect(get).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('two Simulators on one page step independently', () => {
    render(
      <>
        <Simulator sequence={sequence} labels={labels}>{null}</Simulator>
        <Simulator sequence={sequence} labels={labels}>{null}</Simulator>
      </>,
    );
    act(() => void fireEvent.click(screen.getAllByRole('button', { name: 'Next' })[0]!));
    const counters = [...document.querySelectorAll('.simulator__counter')].map((c) => c.textContent);
    expect(counters).toEqual(['Step 2/4', 'Step 1/4']);
  });

  describe('autoplay', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());
    // Each step's timer is scheduled after React re-renders, so advance in pace-sized chunks.
    const wait = (ms: number) => {
      for (let left = ms; left > 0; left -= AUTOPLAY_PACE_MS) {
        act(() => void vi.advanceTimersByTime(Math.min(left, AUTOPLAY_PACE_MS)));
      }
    };

    it('never starts on its own', () => {
      setup();
      wait(AUTOPLAY_PACE_MS * 5);
      expect(counter()).toBe('Step 1/4');
      expect(control('Play')).toBeTruthy();
    });

    it('advances one step per fixed pace and stops on the last step, showing Play again', () => {
      setup();
      press('Play');
      expect(control('Pause')).toBeTruthy();
      expect(live()).toBe('Playing');
      wait(AUTOPLAY_PACE_MS - 1);
      expect(counter()).toBe('Step 1/4');
      wait(1);
      expect(counter()).toBe('Step 2/4');
      wait(AUTOPLAY_PACE_MS * 10);
      expect(counter()).toBe('Step 4/4');
      expect(isDisabled('Next')).toBe(true);
      expect(control('Play')).toBeTruthy();
    });

    it('Pause stops it and is announced', () => {
      setup();
      press('Play');
      wait(AUTOPLAY_PACE_MS);
      press('Pause');
      expect(live()).toBe('Paused');
      wait(AUTOPLAY_PACE_MS * 3);
      expect(counter()).toBe('Step 2/4');
    });

    it.each([
      ['Previous', 'Step 2/4'],
      ['Next', 'Step 4/4'],
      ['Restart', 'Step 1/4'],
    ])('%s during autoplay pauses it and applies the requested step', (name, expected) => {
      setup();
      press('Play');
      wait(AUTOPLAY_PACE_MS * 2);
      expect(counter()).toBe('Step 3/4');
      press(name);
      expect(counter()).toBe(expected);
      expect(control('Play')).toBeTruthy();
      wait(AUTOPLAY_PACE_MS * 3);
      expect(counter()).toBe(expected);
    });
  });
});
