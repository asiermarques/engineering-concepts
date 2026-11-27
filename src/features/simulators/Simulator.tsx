import { useEffect, useReducer, useState, type ReactNode } from 'react';
import type { SimulatorLabels } from '../../i18n/ui';
import type { SimulatorSequence } from './schema';

/** Single fixed autoplay pace (requirement 003, assumption): one step every 1.6 s. */
export const AUTOPLAY_PACE_MS = 1600;

interface Props {
  sequence: Omit<SimulatorSequence, 'concept'>;
  labels: SimulatorLabels;
  /** The Static walkthrough: the no-JS output, replaced once the island hydrates. */
  children: ReactNode;
}

type Announcement = 'step' | 'playing' | 'paused' | null;
interface State {
  step: number;
  playing: boolean;
  announcement: Announcement;
}
type Action = 'restart' | 'previous' | 'next' | 'tick' | 'play' | 'pause';

const start: State = { step: 0, playing: false, announcement: null };

function reduce(last: number, state: State, action: Action): State {
  switch (action) {
    // Any manual step change pauses autoplay (EDGE-001).
    case 'restart':
      return { step: 0, playing: false, announcement: 'step' };
    case 'previous':
      return { step: Math.max(state.step - 1, 0), playing: false, announcement: 'step' };
    case 'next':
      return { step: Math.min(state.step + 1, last), playing: false, announcement: 'step' };
    case 'tick': {
      const step = Math.min(state.step + 1, last);
      return { step, playing: state.playing && step < last, announcement: 'step' };
    }
    case 'play':
      return state.step < last ? { ...state, playing: true, announcement: 'playing' } : state;
    case 'pause':
      return { ...state, playing: false, announcement: 'paused' };
  }
}

export function Simulator({ sequence, labels, children }: Props) {
  const { caption, actors, steps } = sequence;
  const last = steps.length - 1;
  const [hydrated, setHydrated] = useState(false);
  const [{ step, playing, announcement }, dispatch] = useReducer((s: State, a: Action) => reduce(last, s, a), start);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => dispatch('tick'), AUTOPLAY_PACE_MS);
    return () => clearTimeout(timer);
  }, [playing, step]);

  if (!hydrated) return <>{children}</>;

  const current = steps[step]!;
  const total = steps.length;
  const describe = () => {
    const acting = current.cells.flatMap((cell, i) => (cell.trim() ? [`${actors[i]}: ${cell}.`] : []));
    const note = current.note ? [`${labels.note}: ${current.note}`] : [];
    return [`${labels.step} ${step + 1} ${labels.of} ${total}.`, ...acting, `${labels.state}: ${current.state}.`, ...note].join(' ');
  };
  const message = { step: describe(), playing: labels.playing, paused: labels.paused }[announcement ?? 'step'];

  const control = (name: string, glyph: string, action: Action, enabled: boolean, primary = false) => (
    <button
      type="button"
      className={primary ? 'button' : 'button button--quiet'}
      aria-disabled={!enabled}
      onClick={() => enabled && dispatch(action)}
    >
      <span className="button__glyph" aria-hidden="true">{glyph}</span>
      {name}
    </button>
  );

  return (
    <figure className="simulator">
      <figcaption>{caption}</figcaption>
      <div className="simulator__lanes">
        <table style={{ ['--lanes' as string]: actors.length }}>
          <thead>
            <tr>
              <th scope="col">
                <span aria-hidden="true">#</span>
                <span className="sr-only">{labels.step}</span>
              </th>
              {actors.map((actor) => (
                <th scope="col" key={actor}>{actor}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {steps.slice(0, step + 1).map((s, i) => (
              <tr key={i} aria-current={i === step ? 'step' : undefined} className={i === step ? 'simulator__step simulator__step--current' : 'simulator__step'}>
                <th scope="row">
                  {i === step && <span className="simulator__marker" aria-hidden="true">▶</span>}
                  {i + 1}
                </th>
                {s.cells.map((cell, c) => (
                  <td key={c}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="simulator__readout">
        <p className="simulator__state">
          <span className="simulator__label">{labels.state}</span> {current.state}
        </p>
        {current.note && (
          <p className="simulator__note">
            <span className="simulator__label">{labels.note}</span> {current.note}
          </p>
        )}
      </div>
      <div className="simulator__controls" role="group" aria-label={labels.controls}>
        <p className="simulator__position">
          <span className="simulator__counter" aria-hidden="true">{labels.step} {step + 1}/{total}</span>
          <span className="sr-only">{labels.step} {step + 1} {labels.of} {total}</span>
        </p>
        <div className="simulator__buttons">
          {control(labels.restart, '↺', 'restart', step > 0)}
          {control(labels.previous, '◀', 'previous', step > 0)}
          {playing ? control(labels.pause, '❚❚', 'pause', true) : control(labels.play, '▷', 'play', step < last)}
          {control(labels.next, '▶', 'next', step < last, true)}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">{announcement ? message : ''}</p>
    </figure>
  );
}
