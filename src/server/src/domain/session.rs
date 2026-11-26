use base64::Engine;
use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use sha2::{Digest, Sha256};

const TOKEN_BYTES: usize = 32;

/// Token de sesión: el valor viaja en la cookie y solo su hash se guarda.
pub struct SessionToken(String);

impl SessionToken {
    /// Token nuevo con 32 bytes aleatorios.
    pub fn generate() -> Result<Self, getrandom::Error> {
        let mut bytes = [0u8; TOKEN_BYTES];
        getrandom::fill(&mut bytes)?;

        Ok(Self(URL_SAFE_NO_PAD.encode(bytes)))
    }

    /// Reconstruye el token desde el valor de la cookie, sin validarlo contra la base.
    pub fn from_cookie_value(value: &str) -> Self {
        Self(value.to_string())
    }

    /// Valor que va en la cookie (base64url sin relleno).
    pub fn value(&self) -> &str {
        &self.0
    }

    /// SHA-256 del valor del token, que es lo único que se guarda.
    pub fn hash(&self) -> [u8; 32] {
        Sha256::digest(self.0.as_bytes()).into()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn el_valor_es_base64url_sin_relleno_de_32_bytes() {
        let token = SessionToken::generate().unwrap();

        assert_eq!(token.value().len(), 43);
        assert!(
            token
                .value()
                .chars()
                .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
        );
    }

    #[test]
    fn dos_tokens_generados_son_distintos() {
        let first = SessionToken::generate().unwrap();
        let second = SessionToken::generate().unwrap();

        assert_ne!(first.value(), second.value());
    }

    #[test]
    fn el_hash_es_el_sha256_del_valor_como_texto() {
        let token = SessionToken::from_cookie_value("abc");

        let expected: [u8; 32] = [
            0xba, 0x78, 0x16, 0xbf, 0x8f, 0x01, 0xcf, 0xea, 0x41, 0x41, 0x40, 0xde, 0x5d, 0xae,
            0x22, 0x23, 0xb0, 0x03, 0x61, 0xa3, 0x96, 0x17, 0x7a, 0x9c, 0xb4, 0x10, 0xff, 0x61,
            0xf2, 0x00, 0x15, 0xad,
        ];
        assert_eq!(token.hash(), expected);
    }

    #[test]
    fn el_token_de_la_cookie_conserva_su_valor_y_su_hash() {
        let token = SessionToken::generate().unwrap();

        let from_cookie = SessionToken::from_cookie_value(token.value());

        assert_eq!(from_cookie.value(), token.value());
        assert_eq!(from_cookie.hash(), token.hash());
    }
}
