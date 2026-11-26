export const texts = {
  appName: 'aes-todo',
  checking: 'Conectando…',
  connected: 'Conectado con el servidor',
  disconnected: 'No se pudo conectar con el servidor',
  retry: 'Reintentar',
  createAccountHeading: 'Crear la cuenta',
  usernameLabel: 'Usuario',
  passwordLabel: 'Contraseña',
  repeatPasswordLabel: 'Repetir la contraseña',
  createAccountButton: 'Crear cuenta',
  accountExists: 'La cuenta ya está creada.',
  signedInAs: (username: string) => `Sesión iniciada como ${username}`,
} as const;
