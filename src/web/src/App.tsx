import { useEffect, useRef, useState } from 'react';
import { checkHealth } from './api/health';
import { getSession } from './api/session';
import { CreateAccountForm } from './CreateAccountForm';
import { texts } from './i18n/es';

type ConnectionState = 'checking' | 'ok' | 'error';

type SessionView = { accountExists: boolean; username: string | null };

const statusText: Record<ConnectionState, string> = {
  checking: texts.checking,
  ok: texts.connected,
  error: '',
};

export function App() {
  const [state, setState] = useState<ConnectionState>('checking');
  const [attempt, setAttempt] = useState(0);
  const retryButtonRef = useRef<HTMLButtonElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const resultRef = useRef<HTMLParagraphElement>(null);
  const retryInProgress = useRef(false);
  const changedByForm = useRef(false);
  const [session, setSession] = useState<SessionView>({ accountExists: false, username: null });

  useEffect(() => {
    let active = true;

    async function connect() {
      const healthy = await checkHealth();
      const result = healthy ? await getSession() : null;

      if (!active) {
        return;
      }

      if (result?.kind === 'ok') {
        setSession({ accountExists: result.accountExists, username: result.username });
        setState('ok');
      } else {
        setState('error');
      }
    }

    void connect();

    return () => {
      active = false;
    };
  }, [attempt]);

  useEffect(() => {
    if (changedByForm.current && session.accountExists) {
      changedByForm.current = false;
      resultRef.current?.focus();
    }
  }, [session]);

  useEffect(() => {
    if (!retryInProgress.current) {
      return;
    }

    if (state === 'error') {
      retryInProgress.current = false;
      retryButtonRef.current?.focus();
    } else if (state === 'ok') {
      retryInProgress.current = false;
      statusRef.current?.focus();
    }
  }, [state]);

  function retry() {
    retryInProgress.current = true;
    statusRef.current?.focus();
    setState('checking');
    setAttempt((value) => value + 1);
  }

  function showSession(next: SessionView) {
    changedByForm.current = true;
    setSession(next);
  }

  return (
    <main className="page">
      <section className="card">
        <h1 className="title">{texts.appName}</h1>

        <p
          className={statusText[state] === '' ? 'status status-empty' : 'status'}
          role="status"
          ref={statusRef}
          tabIndex={-1}
        >
          {statusText[state]}
        </p>

        {state === 'error' && (
          <div className="notice">
            <p className="notice-text" role="alert">
              {texts.disconnected}
            </p>
            <button type="button" className="action-button" onClick={retry} ref={retryButtonRef}>
              {texts.retry}
            </button>
          </div>
        )}

        {state === 'ok' && !session.accountExists && (
          <CreateAccountForm
            onCreated={(username) => showSession({ accountExists: true, username })}
            onExists={() => showSession({ accountExists: true, username: null })}
          />
        )}

        {state === 'ok' && session.accountExists && (
          <p className="screen-text" tabIndex={-1} ref={resultRef}>
            {session.username === null ? texts.accountExists : texts.signedInAs(session.username)}
          </p>
        )}
      </section>
    </main>
  );
}
