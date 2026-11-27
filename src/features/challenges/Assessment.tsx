import { useEffect, useReducer, useRef, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import type { AssessmentLabels } from '../../i18n/ui';
import { initialState, reduce, summary, type QuestionState } from './assessmentState';
import { gradeAnswer, isMultiSelect } from './grading';
import { splitInlineCode } from './inline';
import type { MultipleChoiceChallenge } from './schema';
import { getProgressStore } from '../progress/browser';
import { clearAttempt, recordResult, restoreState, saveAnswer } from '../progress/progress';
import type { ProgressStore } from '../progress/store';

interface Props {
  /** Stable id of the Concept; Progress is saved under it. */
  conceptId: string;
  challenges: MultipleChoiceChallenge[];
  labels: AssessmentLabels;
  /** Id of the heading that receives focus after repeating the assessment. */
  headingId?: string;
  /** Defaults to the browser's shared store. */
  store?: ProgressStore;
}

const Inline = ({ text }: { text: string }): ReactNode =>
  splitInlineCode(text).map((part, i) => (part.code ? <code key={i}>{part.text}</code> : part.text));

export function Assessment({ conceptId, challenges, labels, headingId, store = getProgressStore() }: Props) {
  const [state, dispatch] = useReducer(
    (s: ReturnType<typeof initialState>, a: Parameters<typeof reduce>[2]) => reduce(challenges, s, a),
    undefined,
    () => restoreState(store.get(), conceptId, challenges),
  );
  const { result, answered, total } = summary(challenges, state);
  const canSave = useSyncExternalStore(store.subscribe, store.canSave, () => true);

  // Persist every change after the first render: answers as they are graded, the Result on completion.
  const saved = useRef(state);
  useEffect(() => {
    const previous = saved.current;
    if (previous === state) return;
    saved.current = state;
    store.update((progress) => {
      let next = clearAttempt(progress, conceptId);
      for (const [challengeId, question] of Object.entries(state)) {
        if (question.submitted) next = saveAnswer(next, conceptId, challengeId, question.selected);
      }
      const completed = summary(challenges, state).result;
      return completed && !summary(challenges, previous).result ? recordResult(next, conceptId, completed) : next;
    });
  }, [state, store, conceptId, challenges]);

  const repeat = () => {
    dispatch({ type: 'reset' });
    if (headingId) document.getElementById(headingId)?.focus();
  };

  return (
    <div className={`assessment${result ? ' assessment--done' : ''}`}>
      {!canSave && <p className="notice" role="status">{labels.cannotSave}</p>}
      <div className="meter">
        <p className="meter__text">
          {labels.answered}: <strong>{answered}/{total}</strong>
        </p>
        <ol className="meter__track" aria-hidden="true">
          {challenges.map((challenge) => {
            const q = state[challenge.id];
            const kind = q?.submitted ? (gradeAnswer(challenge, q.selected).correct ? 'ok' : 'bad') : 'pending';
            return <li key={challenge.id} className={`meter__cell meter__cell--${kind}`} />;
          })}
        </ol>
      </div>
      <ol className="assessment__questions">
        {challenges.map((challenge, index) => (
          <li key={challenge.id}>
            <Question
              challenge={challenge}
              number={index + 1}
              total={total}
              question={state[challenge.id] ?? { selected: [], submitted: false }}
              labels={labels}
              onChoose={(optionId) => dispatch({ type: 'choose', challengeId: challenge.id, optionId })}
              onToggle={(optionId) => dispatch({ type: 'toggle', challengeId: challenge.id, optionId })}
              onConfirm={() => dispatch({ type: 'confirm', challengeId: challenge.id })}
            />
          </li>
        ))}
      </ol>
      <div className={result ? 'result result--visible' : 'result'}>
        <div className="assessment__result" role="status" aria-live="polite">
          {result && (
            <p className="assessment__result-text">{`${labels.result}: ${result.correct}/${result.total}`}</p>
          )}
        </div>
        {result && (
          <>
            <ol className="result__stars" aria-hidden="true">
              {Array.from({ length: result.total }, (_, i) => (
                <li key={i} className={i < result.correct ? 'result__star result__star--on' : 'result__star'} style={{ '--i': i } as CSSProperties} />
              ))}
            </ol>
            <button type="button" className="button" onClick={repeat}>
              <span aria-hidden="true" className="button__glyph">↻</span> {labels.repeat}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

interface QuestionProps {
  challenge: MultipleChoiceChallenge;
  number: number;
  total: number;
  question: QuestionState;
  labels: AssessmentLabels;
  onChoose: (optionId: string) => void;
  onToggle: (optionId: string) => void;
  onConfirm: () => void;
}

function Question({ challenge, number, total, question, labels, onChoose, onToggle, onConfirm }: QuestionProps) {
  const multi = isMultiSelect(challenge);
  const { submitted, selected } = question;
  const grade = submitted ? gradeAnswer(challenge, selected) : null;
  const promptId = `${challenge.id}-prompt`;

  return (
    <div
      role="group"
      aria-labelledby={promptId}
      className={`question${submitted ? (grade?.correct ? ' question--ok' : ' question--bad') : ''}`}
    >
      <p className="question__tag" aria-hidden="true">
        <span>{labels.question}</span> {number}/{total}
      </p>
      <p id={promptId} className="question__prompt">
        <Inline text={challenge.prompt} />
      </p>
      {multi && !submitted && <p className="question__hint">{labels.selectAll}</p>}
      <ul className="question__options">
        {challenge.options.map((option, index) => {
          const isSelected = selected.includes(option.id);
          const status = submitted ? optionStatus(option.correct, isSelected, multi, labels) : null;
          const classes = ['option', isSelected && 'option--selected', status && `option--${status.kind}`, submitted && !status && 'option--neutral']
            .filter(Boolean)
            .join(' ');
          return (
            <li key={option.id} className={classes}>
              {multi ? (
                <label className="option__control">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={submitted}
                    onChange={() => onToggle(option.id)}
                  />
                  <span className="option__text"><Inline text={option.text} /></span>
                </label>
              ) : (
                <button
                  type="button"
                  className="option__control option__button"
                  disabled={submitted}
                  onClick={() => onChoose(option.id)}
                >
                  <span className="option__key" aria-hidden="true">{String.fromCharCode(65 + index)}</span>
                  <span className="option__text"><Inline text={option.text} /></span>
                </button>
              )}
              {submitted && (
                <div className="option__feedback">
                  <p className="option__badges">
                    {isSelected && <span className="badge">{labels.yourAnswer}</span>}
                    {status && (
                      <span className={`badge badge--${status.kind}`}>
                        <span aria-hidden="true">{status.icon}</span> <span>{status.label}</span>
                      </span>
                    )}
                  </p>
                  <p className="option__explanation"><Inline text={option.explanation} /></p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {multi && !submitted && (
        <button type="button" className="button" disabled={selected.length === 0} onClick={onConfirm}>
          {labels.confirm}
        </button>
      )}
      <div role="status" aria-live="polite" className="question__verdict">
        {grade && (
          <p className={grade.correct ? 'verdict verdict--ok' : 'verdict verdict--bad'}>
            <span aria-hidden="true">{grade.correct ? '✓' : '✗'}</span>{' '}
            <span>{grade.correct ? labels.correct : labels.incorrect}</span>
          </p>
        )}
      </div>
    </div>
  );
}

function optionStatus(correct: boolean, selected: boolean, multi: boolean, labels: AssessmentLabels) {
  if (correct && (selected || !multi)) return { kind: 'ok', icon: '✓', label: labels.correctOption };
  if (correct) return { kind: 'missing', icon: '!', label: labels.missingOption };
  if (selected) return { kind: 'bad', icon: '✗', label: labels.extraOption };
  return null;
}
