import { useEffect, useRef, useState } from 'react';
import { checkHealth } from './api/health';
import { texts } from './i18n/es';

type ConnectionState = 'checking' | 'ok' | 'error';

export function App() {
  const [state, setState] = useState<ConnectionState>('checking');
  const [attempt, setAttempt] = useState(0);
  const retryButtonRef = useRef<HTMLButtonElement>(null);
  const connectedStatusRef = useRef<HTMLParagraphElement>(null);
  const retryInProgress = useRef(false);

  useEffect(() => {
    let active = true;

    void checkHealth().then((healthy) => {
      if (active) {
        setState(healthy ? 'ok' : 'error');
      }
    });

    return () => {
      active = false;
    };
  }, [attempt]);

  useEffect(() => {
    if (!retryInProgress.current) {
      return;
    }

    if (state === 'error') {
      retryInProgress.current = false;
      retryButtonRef.current?.focus();
    } else if (state === 'ok') {
      retryInProgress.current = false;
      connectedStatusRef.current?.focus();
    }
  }, [state]);

  function retry() {
    retryInProgress.current = true;
    setState('checking');
    setAttempt((value) => value + 1);
  }

  return (
    <main className="page">
      <section className="card">
        <h1 className="title">{texts.appName}</h1>

        {state === 'ok' && (
          <p className="status" role="status" ref={connectedStatusRef} tabIndex={-1}>
            {texts.connected}
          </p>
        )}

        {state === 'checking' && (
          <p className="status" role="status">
            {texts.checking}
          </p>
        )}

        {state === 'error' && (
          <div className="notice">
            <p className="notice-text" role="alert">
              {texts.disconnected}
            </p>
            <button type="button" className="retry" onClick={retry} ref={retryButtonRef}>
              {texts.retry}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
