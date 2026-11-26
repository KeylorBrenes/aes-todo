import { describe, expect, it } from 'vitest';
import { checkAccountForm, missingCharacters } from './accountRules';

const VALID_PASSWORD = '123456789012';

/** Formulario con valores válidos por defecto; cada prueba cambia solo lo que le interesa. */
function form(overrides: Partial<{ username: string; password: string; repeat: string }> = {}) {
  return {
    username: 'valido',
    password: VALID_PASSWORD,
    repeat: VALID_PASSWORD,
    ...overrides,
  };
}

describe('checkAccountForm: usuario', () => {
  it('acepta los límites de 3 y 32 caracteres', () => {
    expect(checkAccountForm(form({ username: 'abc' }))).toEqual({});
    expect(checkAccountForm(form({ username: 'a'.repeat(32) }))).toEqual({});
  });

  it('rechaza 2 y 33 caracteres', () => {
    expect(checkAccountForm(form({ username: 'ab' }))).toEqual({ username: true });
    expect(checkAccountForm(form({ username: 'a'.repeat(33) }))).toEqual({ username: true });
  });

  it('rechaza espacios y acentos', () => {
    expect(checkAccountForm(form({ username: 'con espacio' }))).toEqual({ username: true });
    expect(checkAccountForm(form({ username: 'josé' }))).toEqual({ username: true });
  });

  it('acepta letras sin acento, números, punto, guion bajo y guion, sin recortar', () => {
    expect(checkAccountForm(form({ username: 'Ana_1.x-y' }))).toEqual({});
    expect(checkAccountForm(form({ username: ' valido' }))).toEqual({ username: true });
  });
});

describe('checkAccountForm: contraseña', () => {
  it('acepta los límites de 12 y 128 caracteres', () => {
    expect(checkAccountForm(form({ password: '123456789012', repeat: '123456789012' }))).toEqual({});
    expect(
      checkAccountForm(form({ password: 'p'.repeat(128), repeat: 'p'.repeat(128) })),
    ).toEqual({});
  });

  it('rechaza 11 y 129 caracteres', () => {
    expect(checkAccountForm(form({ password: '12345678901', repeat: '12345678901' }))).toEqual({
      password: true,
    });
    expect(
      checkAccountForm(form({ password: 'p'.repeat(129), repeat: 'p'.repeat(129) })),
    ).toEqual({ password: true });
  });

  it('cuenta puntos de código Unicode: 11 emojis no llegan y 12 sí', () => {
    const short = '😀'.repeat(11);
    const longEnough = '😀'.repeat(12);

    expect(checkAccountForm(form({ password: short, repeat: short }))).toEqual({
      password: true,
    });
    expect(checkAccountForm(form({ password: longEnough, repeat: longEnough }))).toEqual({});
  });
});

describe('checkAccountForm: repetición', () => {
  it('exige que la repetición coincida aunque la contraseña sea válida', () => {
    expect(checkAccountForm(form({ repeat: '123456789013' }))).toEqual({ repeat: true });
  });

  it('marca también la contraseña cuando la repetición distinta acompaña a una inválida', () => {
    expect(
      checkAccountForm(form({ password: '12345678901', repeat: '12345678902' })),
    ).toEqual({ password: true, repeat: true });
  });

  it('no devuelve errores con un formulario válido', () => {
    expect(checkAccountForm(form())).toEqual({});
  });
});

describe('missingCharacters', () => {
  it('devuelve 12 con el campo vacío, 11 con uno y 0 desde el mínimo', () => {
    expect(missingCharacters('')).toBe(12);
    expect(missingCharacters('a')).toBe(11);
    expect(missingCharacters('abcdefghijk')).toBe(1);
    expect(missingCharacters('abcdefghijkl')).toBe(0);
    expect(missingCharacters('a'.repeat(20))).toBe(0);
  });

  it('cuenta emojis como un carácter cada uno', () => {
    expect(missingCharacters('😀')).toBe(11);
    expect(missingCharacters('😀'.repeat(11))).toBe(1);
    expect(missingCharacters('😀'.repeat(12))).toBe(0);
  });
});
