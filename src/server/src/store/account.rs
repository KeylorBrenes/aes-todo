use sqlx::SqlitePool;

use crate::domain::account::Username;

/// Lo único que el handler necesita distinguir al crear la cuenta.
#[derive(Debug)]
pub enum CreateAccountError {
    AccountExists,
    Database(sqlx::Error),
}

/// Crea la única cuenta y su primera sesión en una transacción: o quedan las dos o ninguna.
/// La clave fija `id = 1` de `account` es la que impide una segunda cuenta, también con
/// dos peticiones a la vez.
pub async fn create_with_session(
    pool: &SqlitePool,
    username: &Username,
    password_hash: &str,
    token_hash: &[u8; 32],
) -> Result<(), CreateAccountError> {
    let mut transaction = pool.begin().await.map_err(CreateAccountError::Database)?;

    sqlx::query("INSERT INTO account (id, username, password_hash) VALUES (1, ?, ?)")
        .bind(username.as_str())
        .bind(password_hash)
        .execute(&mut *transaction)
        .await
        .map_err(classify_insert_error)?;

    sqlx::query("INSERT INTO session (token_hash) VALUES (?)")
        .bind(token_hash.as_slice())
        .execute(&mut *transaction)
        .await
        .map_err(CreateAccountError::Database)?;

    transaction
        .commit()
        .await
        .map_err(CreateAccountError::Database)
}

fn classify_insert_error(error: sqlx::Error) -> CreateAccountError {
    let is_key_conflict = error
        .as_database_error()
        .is_some_and(|database_error| database_error.is_unique_violation());

    if is_key_conflict {
        CreateAccountError::AccountExists
    } else {
        CreateAccountError::Database(error)
    }
}

/// Indica si la cuenta ya fue creada.
pub async fn account_exists(pool: &SqlitePool) -> Result<bool, sqlx::Error> {
    sqlx::query_scalar("SELECT EXISTS (SELECT 1 FROM account)")
        .fetch_one(pool)
        .await
}

/// Usuario de la cuenta si el hash del token corresponde a una sesión guardada.
pub async fn session_username(
    pool: &SqlitePool,
    token_hash: &[u8; 32],
) -> Result<Option<String>, sqlx::Error> {
    sqlx::query_scalar(
        "SELECT account.username FROM account \
         WHERE EXISTS (SELECT 1 FROM session WHERE token_hash = ?)",
    )
    .bind(token_hash.as_slice())
    .fetch_optional(pool)
    .await
}
