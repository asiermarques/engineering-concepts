import { useReducer, type ReactNode } from 'react';
import type { AssessmentLabels } from '../../i18n/ui';
import { initialState, reduce, summary, type QuestionState } from './assessmentState';
import { gradeAnswer, isMultiSelect } from './grading';
import { splitInlineCode } from './inline';
import type { MultipleChoiceChallenge } from './schema';

interface Props {
  challenges: MultipleChoiceChallenge[];
  labels: AssessmentLabels;
  /** Id of the heading that receives focus after repeating the assessment. */
  headingId?: string;
}

const Inline = ({ text }: { text: string }): ReactNode =>
  splitInlineCode(text).map((part, i) => (part.code ? <code key={i}>{part.text}</code> : part.text));

export function Assessment({ challenges, labels, headingId }: Props) {
  const [state, dispatch] = useReducer(
    (s: ReturnType<typeof initialState>, a: Parameters<typeof reduce>[2]) => reduce(challenges, s, a),
    undefined,
    initialState,
  );
  const { result } = summary(challenges, state);

  const repeat = () => {
    dispatch({ type: 'reset' });
    if (headingId) document.getElementById(headingId)?.focus();
  };

  return (
    <div className="assessment">
      <ol className="assessment__questions">
        {challenges.map((challenge) => (
          <li key={challenge.id}>
            <Question
              challenge={challenge}
              question={state[challenge.id] ?? { selected: [], submitted: false }}
              labels={labels}
              onChoose={(optionId) => dispatch({ type: 'choose', challengeId: challenge.id, optionId })}
              onToggle={(optionId) => dispatch({ type: 'toggle', challengeId: challenge.id, optionId })}
              onConfirm={() => dispatch({ type: 'confirm', challengeId: challenge.id })}
            />
          </li>
        ))}
      </ol>
      <div className="assessment__result" role="status" aria-live="polite">
        {result && <p className="assessment__result-text">{`${labels.result}: ${result.correct}/${result.total}`}</p>}
      </div>
      {result && (
        <button type="button" className="button" onClick={repeat}>
          {labels.repeat}
        </button>
      )}
    </div>
  );
}

interface QuestionProps {
  challenge: MultipleChoiceChallenge;
  question: QuestionState;
  labels: AssessmentLabels;
  onChoose: (optionId: string) => void;
  onToggle: (optionId: string) => void;
  onConfirm: () => void;
}

function Question({ challenge, question, labels, onChoose, onToggle, onConfirm }: QuestionProps) {
  const multi = isMultiSelect(challenge);
  const { submitted, selected } = question;
  const grade = submitted ? gradeAnswer(challenge, selected) : null;
  const promptId = `${challenge.id}-prompt`;

  return (
    <div role="group" aria-labelledby={promptId} className="question">
      <p id={promptId} className="question__prompt">
        <Inline text={challenge.prompt} />
      </p>
      {multi && !submitted && <p className="question__hint">{labels.selectAll}</p>}
      <ul className="question__options">
        {challenge.options.map((option) => {
          const isSelected = selected.includes(option.id);
          const status = submitted ? optionStatus(option.correct, isSelected, multi, labels) : null;
          return (
            <li key={option.id} className={`option${isSelected ? ' option--selected' : ''}`}>
              {multi ? (
                <label className="option__control">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={submitted}
                    onChange={() => onToggle(option.id)}
                  />
                  <span><Inline text={option.text} /></span>
                </label>
              ) : (
                <button
                  type="button"
                  className="option__control option__button"
                  disabled={submitted}
                  onClick={() => onChoose(option.id)}
                >
                  <Inline text={option.text} />
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
