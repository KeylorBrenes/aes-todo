import { useRef, useState, type FormEvent } from 'react';
import { createAccount } from './api/account';
import { texts } from './i18n/es';

type Props = {
  onCreated: (username: string) => void;
  onExists: () => void;
};

export function CreateAccountForm({ onCreated, onExists }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const submitting = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting.current) {
      return;
    }

    submitting.current = true;
    const result = await createAccount(username, password);
    submitting.current = false;

    if (result.kind === 'created') {
      onCreated(result.username);
    } else if (result.kind === 'exists') {
      onExists();
    }
  }

  return (
    <>
      <h2 className="section-title">{texts.createAccountHeading}</h2>

      <form className="form" noValidate onSubmit={(event) => void submit(event)}>
        <div className="field">
          <label htmlFor="account-username">{texts.usernameLabel}</label>
          <input
            id="account-username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="account-password">{texts.passwordLabel}</label>
          <input
            id="account-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="account-repeat">{texts.repeatPasswordLabel}</label>
          <input
            id="account-repeat"
            type="password"
            autoComplete="new-password"
            value={repeat}
            onChange={(event) => setRepeat(event.target.value)}
          />
        </div>

        <button type="submit" className="action-button">
          {texts.createAccountButton}
        </button>
      </form>
    </>
  );
}
