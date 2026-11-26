use argon2::password_hash::rand_core::OsRng;
use argon2::password_hash::{PasswordHasher, SaltString};
use argon2::{Argon2, password_hash};

const USERNAME_MIN: usize = 3;
const USERNAME_MAX: usize = 32;
const PASSWORD_MIN: usize = 12;
const PASSWORD_MAX: usize = 128;

/// Usuario válido, guardado en minúsculas.
#[derive(Debug, PartialEq, Eq)]
pub struct Username(String);

impl Username {
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

/// Contraseña válida (de 12 a 128 caracteres). No se imprime ni se serializa.
pub struct Password(String);

impl Password {
    fn as_str(&self) -> &str {
        &self.0
    }
}

/// Errores por campo de `validate`: `"invalid"` para el usuario y `"length"` para la contraseña.
#[derive(Debug, Default, PartialEq, Eq)]
pub struct FieldErrors {
    pub username: Option<&'static str>,
    pub password: Option<&'static str>,
}

/// Comprueba los dos campos y devuelve todos los errores juntos.
pub fn validate(username: &str, password: &str) -> Result<(Username, Password), FieldErrors> {
    let username_ok = is_valid_username(username);
    let password_ok = is_valid_password(password);

    if username_ok && password_ok {
        return Ok((
            Username(username.to_ascii_lowercase()),
            Password(password.to_string()),
        ));
    }

    Err(FieldErrors {
        username: (!username_ok).then_some("invalid"),
        password: (!password_ok).then_some("length"),
    })
}

fn is_valid_username(username: &str) -> bool {
    let length = username.chars().count();

    (USERNAME_MIN..=USERNAME_MAX).contains(&length)
        && username
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | '-'))
}

fn is_valid_password(password: &str) -> bool {
    (PASSWORD_MIN..=PASSWORD_MAX).contains(&password.chars().count())
}

/// Hash Argon2id de la contraseña, en formato PHC, con una sal aleatoria.
pub fn hash_password(password: &Password) -> Result<String, password_hash::Error> {
    let salt = SaltString::generate(&mut OsRng);
    let hash = Argon2::default().hash_password(password.as_str().as_bytes(), &salt)?;

    Ok(hash.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn password_of(length: usize) -> String {
        "a".repeat(length)
    }

    #[test]
    fn el_usuario_se_guarda_en_minusculas() {
        let (username, _) = validate("Ana.Perez_1-x", &password_of(12)).unwrap();

        assert_eq!(username.as_str(), "ana.perez_1-x");
    }

    #[test]
    fn el_usuario_acepta_los_limites_de_largo() {
        assert!(validate(&"a".repeat(3), &password_of(12)).is_ok());
        assert!(validate(&"a".repeat(32), &password_of(12)).is_ok());
    }

    #[test]
    fn el_usuario_rechaza_fuera_de_los_limites_de_largo() {
        for username in ["", "ab", &"a".repeat(33)] {
            let errors = validate(username, &password_of(12)).err().unwrap();
            assert_eq!(errors.username, Some("invalid"), "usuario: {username:?}");
            assert_eq!(errors.password, None);
        }
    }

    #[test]
    fn el_usuario_rechaza_espacios_acentos_y_emojis() {
        for username in ["ana perez", " ana", "ana ", "josé", "añb", "ana😀"] {
            let errors = validate(username, &password_of(12)).err().unwrap();
            assert_eq!(errors.username, Some("invalid"), "usuario: {username:?}");
        }
    }

    #[test]
    fn la_contrasena_acepta_los_limites_de_largo() {
        assert!(validate("ana", &password_of(12)).is_ok());
        assert!(validate("ana", &password_of(128)).is_ok());
    }

    #[test]
    fn la_contrasena_rechaza_fuera_de_los_limites_de_largo() {
        for password in [password_of(0), password_of(11), password_of(129)] {
            let errors = validate("ana", &password).err().unwrap();
            assert_eq!(errors.password, Some("length"));
            assert_eq!(errors.username, None);
        }
    }

    #[test]
    fn la_contrasena_cuenta_puntos_de_codigo_y_no_bytes() {
        assert!(validate("ana", &"😀".repeat(12)).is_ok());
        assert!(validate("ana", &"😀".repeat(128)).is_ok());
        assert!(validate("ana", &"😀".repeat(11)).is_err());
        assert!(validate("ana", &"😀".repeat(129)).is_err());
    }

    #[test]
    fn devuelve_los_errores_de_los_dos_campos_juntos() {
        let errors = validate("a", "corta").err().unwrap();

        assert_eq!(
            errors,
            FieldErrors {
                username: Some("invalid"),
                password: Some("length"),
            }
        );
    }

    #[test]
    fn el_hash_es_argon2id_en_formato_phc_y_no_contiene_la_contrasena() {
        let (_, password) = validate("ana", "una frase larga y secreta").unwrap();

        let first = hash_password(&password).unwrap();
        let second = hash_password(&password).unwrap();

        assert!(first.starts_with("$argon2id$"), "hash: {first}");
        assert!(!first.contains("una frase larga y secreta"));
        assert_ne!(first, second, "cada hash lleva su propia sal");
    }
}
