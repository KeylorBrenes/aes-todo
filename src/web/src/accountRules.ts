export type AccountFormValues = {
  username: string;
  password: string;
  repeat: string;
};

export type AccountFormErrors = {
  username?: true;
  password?: true;
  repeat?: true;
};

const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,32}$/;
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 128;

/** Cuenta puntos de código Unicode, igual que el servidor. */
function characterCount(text: string): number {
  return [...text].length;
}

/**
 * Reglas de usuario, contraseña y repetición en el cliente, idénticas a las del servidor
 * para el usuario y la contraseña. Sin textos: el formulario elige el mensaje.
 */
export function checkAccountForm(values: AccountFormValues): AccountFormErrors {
  const errors: AccountFormErrors = {};
  const passwordLength = characterCount(values.password);

  if (!USERNAME_PATTERN.test(values.username)) {
    errors.username = true;
  }

  if (passwordLength < PASSWORD_MIN_LENGTH || passwordLength > PASSWORD_MAX_LENGTH) {
    errors.password = true;
  }

  if (values.repeat !== values.password) {
    errors.repeat = true;
  }

  return errors;
}

/** Caracteres que faltan para el mínimo de la contraseña, nunca negativos. */
export function missingCharacters(password: string): number {
  return Math.max(0, PASSWORD_MIN_LENGTH - characterCount(password));
}
