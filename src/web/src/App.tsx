import { useEffect, useState } from 'react';
import { checkHealth } from './api/health';
import { texts } from './i18n/es';

type ConnectionState = 'checking' | 'ok' | 'error';

export function App() {
  const [state, setState] = useState<ConnectionState>('checking');
  const [attempt, setAttempt] = useState(0);

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

  function retry() {
    setState('checking');
    setAttempt((value) => value + 1);
  }

  return (
    <main className="page">
      <section className="card">
        <h1 className="title">{texts.appName}</h1>

        {state === 'ok' && (
          <p className="status" role="status">
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
            <button type="button" className="retry" onClick={retry}>
              {texts.retry}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
