use axum::http::{HeaderMap, header};

use crate::domain::session::SessionToken;

const COOKIE_NAME: &str = "aes_session";

/// Valor de la cookie `aes_session` en cualquiera de las cabeceras `Cookie`, si viene.
pub(crate) fn read(headers: &HeaderMap) -> Option<SessionToken> {
    headers
        .get_all(header::COOKIE)
        .iter()
        .filter_map(|value| value.to_str().ok())
        .flat_map(|line| line.split(';'))
        .find_map(|pair| {
            pair.trim()
                .strip_prefix(COOKIE_NAME)
                .and_then(|rest| rest.strip_prefix('='))
        })
        .map(SessionToken::from_cookie_value)
}

/// Valor de `Set-Cookie` de la sesión: sin `Max-Age` ni `Expires` (dura hasta US-003).
pub(crate) fn set_cookie(token: &SessionToken) -> String {
    format!(
        "{COOKIE_NAME}={}; HttpOnly; SameSite=Strict; Path=/",
        token.value()
    )
}
