import { useRef, useState, type FormEvent } from 'react';
import { createAccount } from './api/account';
import { checkAccountForm, missingCharacters, type AccountFormErrors } from './accountRules';
import { texts } from './i18n/es';

type Props = {
  onCreated: (username: string) => void;
  onExists: () => void;
};

function hasErrors(errors: AccountFormErrors): boolean {
  return Boolean(errors.username || errors.password || errors.repeat);
}

export function CreateAccountForm({ onCreated, onExists }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [errors, setErrors] = useState<AccountFormErrors>({});
  const [failed, setFailed] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const repeatRef = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);

  const missing = missingCharacters(password);
  const passwordDescription =
    [missing > 0 ? 'password-hint' : '', errors.password ? 'password-error' : '']
      .filter(Boolean)
      .join(' ') || undefined;

  function focusFirstError(nextErrors: AccountFormErrors) {
    if (nextErrors.username) {
      usernameRef.current?.focus();
    } else if (nextErrors.password) {
      passwordRef.current?.focus();
    } else if (nextErrors.repeat) {
      repeatRef.current?.focus();
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting.current) {
      return;
    }

    submitting.current = true;
    setFailed(false);

    const nextErrors = checkAccountForm({ username, password, repeat });

    if (hasErrors(nextErrors)) {
      submitting.current = false;
      setErrors(nextErrors);
      focusFirstError(nextErrors);
      return;
    }

    setErrors({});
    const result = await createAccount(username, password);
    submitting.current = false;

    if (result.kind === 'created') {
      onCreated(result.username);
    } else if (result.kind === 'exists') {
      onExists();
    } else if (result.kind === 'invalid') {
      const serverErrors: AccountFormErrors = {};
      if (result.fields.username) {
        serverErrors.username = true;
      }
      if (result.fields.password) {
        serverErrors.password = true;
      }
      setErrors(serverErrors);
      focusFirstError(serverErrors);
    } else {
      setFailed(true);
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
            ref={usernameRef}
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={username}
            aria-invalid={errors.username ? 'true' : undefined}
            aria-describedby={errors.username ? 'username-error' : undefined}
            onChange={(event) => setUsername(event.target.value)}
          />
          {errors.username && (
            <p id="username-error" className="field-error">
              {texts.usernameError}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="account-password">{texts.passwordLabel}</label>
          <input
            id="account-password"
            ref={passwordRef}
            type={passwordVisible ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            aria-invalid={errors.password ? 'true' : undefined}
            aria-describedby={passwordDescription}
            onChange={(event) => setPassword(event.target.value)}
          />
          {missing > 0 && (
            <p id="password-hint" className="field-hint">
              {missing === 1 ? texts.missingOne : texts.missingMany(missing)}
            </p>
          )}
          {errors.password && (
            <p id="password-error" className="field-error">
              {texts.passwordError}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="account-repeat">{texts.repeatPasswordLabel}</label>
          <input
            id="account-repeat"
            ref={repeatRef}
            type={passwordVisible ? 'text' : 'password'}
            autoComplete="new-password"
            value={repeat}
            aria-invalid={errors.repeat ? 'true' : undefined}
            aria-describedby={errors.repeat ? 'repeat-error' : undefined}
            onChange={(event) => setRepeat(event.target.value)}
          />
          {errors.repeat && (
            <p id="repeat-error" className="field-error">
              {texts.repeatError}
            </p>
          )}
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => setPasswordVisible((visible) => !visible)}
        >
          {passwordVisible ? texts.hidePassword : texts.showPassword}
        </button>

        <button type="submit" className="action-button">
          {texts.createAccountButton}
        </button>

        {failed && (
          <p role="alert" className="notice-text">
            {texts.createFailed}
          </p>
        )}
      </form>
    </>
  );
}
