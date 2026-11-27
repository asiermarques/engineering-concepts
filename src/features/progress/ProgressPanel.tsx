import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { ProgressLabels } from '../../i18n/ui';
import { getProgressStore } from './browser';
import { parseProgress } from './progress';
import type { ProgressStore } from './store';

interface Props {
  labels: ProgressLabels;
  /** Defaults to the browser's shared store. */
  store?: ProgressStore;
  /** Defaults to a browser file download. */
  download?: (filename: string, text: string) => void;
}

type Pending = { kind: 'reset' } | { kind: 'import'; raw: string } | null;

function downloadFile(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const readText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

/** Reset, export and import of the Learner's Progress, with in-page confirmations (no browser dialogs). */
export function ProgressPanel({ labels, store = getProgressStore(), download = downloadFile }: Props) {
  const [pending, setPending] = useState<Pending>(null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const resetButton = useRef<HTMLButtonElement>(null);
  const importButton = useRef<HTMLButtonElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (pending) cancelButton.current?.focus();
  }, [pending]);

  const cancel = () => {
    const trigger = pending?.kind === 'import' ? importButton : resetButton;
    setPending(null);
    trigger.current?.focus();
  };

  const confirm = () => {
    if (!pending) return;
    if (pending.kind === 'reset') {
      store.reset();
      setMessage({ text: labels.resetDone, error: false });
    } else {
      const ok = store.import(pending.raw);
      setMessage(ok ? { text: labels.importDone, error: false } : { text: labels.importInvalid, error: true });
    }
    setPending(null);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const raw = await readText(file).catch(() => '');
    if (fileInput.current) fileInput.current.value = '';
    if (parseProgress(raw)) {
      setMessage(null);
      setPending({ kind: 'import', raw });
    } else {
      setPending(null);
      setMessage({ text: labels.importInvalid, error: true });
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') cancel();
  };

  return (
    <section className="progress-panel" aria-labelledby="progress-heading">
      <h2 id="progress-heading" className="progress-panel__title">{labels.heading}</h2>
      <p className="progress-panel__description">{labels.description}</p>
      <div className="progress-panel__actions">
        <button type="button" className="button" onClick={() => download('engineering-concepts-progress.json', store.export())}>
          {labels.export}
        </button>
        <button type="button" className="button" ref={importButton} onClick={() => fileInput.current?.click()}>
          {labels.import}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => void onFile(event.target.files?.[0])}
        />
        <button type="button" className="button button--danger" ref={resetButton} onClick={() => { setMessage(null); setPending({ kind: 'reset' }); }}>
          {labels.reset}
        </button>
      </div>
      {pending && (
        <div className="progress-panel__confirm" role="group" aria-labelledby="progress-confirm-text" onKeyDown={onKeyDown}>
          <p id="progress-confirm-text">{pending.kind === 'reset' ? labels.resetConfirm : labels.importConfirm}</p>
          <div className="progress-panel__actions">
            <button type="button" className="button" ref={cancelButton} onClick={cancel}>{labels.cancel}</button>
            <button type="button" className="button button--danger" onClick={confirm}>
              {pending.kind === 'reset' ? labels.resetConfirmYes : labels.importConfirmYes}
            </button>
          </div>
        </div>
      )}
      <p role="status" aria-live="polite" className={message?.error ? 'progress-panel__message progress-panel__message--error' : 'progress-panel__message'}>
        {message?.text}
      </p>
    </section>
  );
}
