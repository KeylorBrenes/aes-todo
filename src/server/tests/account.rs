use std::error::Error;

use aes_todo_server::http::{AppState, app};
use aes_todo_server::store;
use axum::Router;
use axum::body::Body;
use axum::http::{HeaderMap, Method, Request, StatusCode, header};
use http_body_util::BodyExt;
use serde_json::{Value, json};
use sha2::{Digest, Sha256};
use sqlx::SqlitePool;
use tempfile::TempDir;
use tower::ServiceExt;

const PASSWORD: &str = "una frase larga y secreta";

/// App recién arrancada sobre una base temporal sin cuenta.
struct TestApp {
    router: Router,
    pool: SqlitePool,
    _dir: TempDir,
}

struct Reply {
    status: StatusCode,
    headers: HeaderMap,
    text: String,
}

impl Reply {
    fn json(&self) -> Result<Value, Box<dyn Error>> {
        Ok(serde_json::from_str(&self.text)?)
    }

    fn set_cookie(&self) -> Option<&str> {
        self.headers
            .get(header::SET_COOKIE)
            .and_then(|value| value.to_str().ok())
    }
}

async fn start() -> Result<TestApp, Box<dyn Error>> {
    let dir = TempDir::new()?;
    let db_path = dir.path().join("aes-todo.db");
    let web_dist = dir.path().join("web");
    std::fs::create_dir(&web_dist)?;
    std::fs::write(
        web_dist.join("index.html"),
        "<!doctype html><html lang=\"es\"><title>aes-todo</title></html>",
    )?;
    let url = format!("sqlite:{}", db_path.display());
    let pool = store::open(&url).await?;
    let router = app(AppState {
        pool: pool.clone(),
        web_dist,
    });

    Ok(TestApp {
        router,
        pool,
        _dir: dir,
    })
}

async fn request(
    router: &Router,
    method: Method,
    uri: &str,
    content_type: Option<&str>,
    cookie: Option<&str>,
    body: String,
) -> Result<Reply, Box<dyn Error>> {
    let mut builder = Request::builder().method(method).uri(uri);
    if let Some(content_type) = content_type {
        builder = builder.header(header::CONTENT_TYPE, content_type);
    }
    if let Some(cookie) = cookie {
        builder = builder.header(header::COOKIE, cookie);
    }
    let response = router
        .clone()
        .oneshot(builder.body(Body::from(body))?)
        .await?;
    let status = response.status();
    let headers = response.headers().clone();
    let bytes = response.into_body().collect().await?.to_bytes();

    Ok(Reply {
        status,
        headers,
        text: String::from_utf8(bytes.to_vec())?,
    })
}

async fn get_session(router: &Router, cookie: Option<&str>) -> Result<Reply, Box<dyn Error>> {
    request(
        router,
        Method::GET,
        "/api/session",
        None,
        cookie,
        String::new(),
    )
    .await
}

async fn post_account(router: &Router, body: Value) -> Result<Reply, Box<dyn Error>> {
    post_raw(router, Some("application/json"), body.to_string()).await
}

async fn post_raw(
    router: &Router,
    content_type: Option<&str>,
    body: String,
) -> Result<Reply, Box<dyn Error>> {
    request(
        router,
        Method::POST,
        "/api/account",
        content_type,
        None,
        body,
    )
    .await
}

fn credentials(username: &str, password: &str) -> Value {
    json!({ "username": username, "password": password })
}

fn session_cookie_pair(reply: &Reply) -> Result<String, Box<dyn Error>> {
    let set_cookie = reply.set_cookie().ok_or("falta Set-Cookie")?;
    let pair = set_cookie.split(';').next().ok_or("Set-Cookie vacío")?;

    Ok(pair.to_string())
}

async fn account_rows(pool: &SqlitePool) -> Result<i64, Box<dyn Error>> {
    let total = sqlx::query_scalar("SELECT COUNT(*) FROM account")
        .fetch_one(pool)
        .await?;

    Ok(total)
}

async fn session_rows(pool: &SqlitePool) -> Result<i64, Box<dyn Error>> {
    let total = sqlx::query_scalar("SELECT COUNT(*) FROM session")
        .fetch_one(pool)
        .await?;

    Ok(total)
}

#[tokio::test]
async fn session_without_account_reports_no_account_and_no_user() -> Result<(), Box<dyn Error>> {
    let app = start().await?;

    let reply = get_session(&app.router, None).await?;

    assert_eq!(reply.status, StatusCode::OK);
    assert_eq!(
        reply.json()?,
        json!({ "accountExists": false, "username": null })
    );
    Ok(())
}

#[tokio::test]
async fn session_with_account_and_no_cookie_has_no_user() -> Result<(), Box<dyn Error>> {
    let app = start().await?;
    post_account(&app.router, credentials("ana", PASSWORD)).await?;

    let reply = get_session(&app.router, None).await?;

    assert_eq!(reply.status, StatusCode::OK);
    assert_eq!(
        reply.json()?,
        json!({ "accountExists": true, "username": null })
    );
    Ok(())
}

#[tokio::test]
async fn session_with_a_valid_cookie_returns_the_username() -> Result<(), Box<dyn Error>> {
    let app = start().await?;
    let created = post_account(&app.router, credentials("Ana", PASSWORD)).await?;
    let cookie = session_cookie_pair(&created)?;

    let reply = get_session(&app.router, Some(&cookie)).await?;

    assert_eq!(reply.status, StatusCode::OK);
    assert_eq!(
        reply.json()?,
        json!({ "accountExists": true, "username": "ana" })
    );
    Ok(())
}

#[tokio::test]
async fn session_finds_the_cookie_among_others_and_in_several_headers() -> Result<(), Box<dyn Error>>
{
    let app = start().await?;
    let created = post_account(&app.router, credentials("ana", PASSWORD)).await?;
    let pair = session_cookie_pair(&created)?;

    let among_others = format!("tema=oscuro; {pair} ;otra=1");
    let reply = get_session(&app.router, Some(&among_others)).await?;
    assert_eq!(reply.json()?["username"], "ana");

    let response = app
        .router
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/session")
                .header(header::COOKIE, "tema=oscuro")
                .header(header::COOKIE, pair)
                .body(Body::empty())?,
        )
        .await?;
    let bytes = response.into_body().collect().await?.to_bytes();
    let body: Value = serde_json::from_slice(&bytes)?;
    assert_eq!(body["username"], "ana");
    Ok(())
}

#[tokio::test]
async fn session_with_an_unknown_or_malformed_cookie_has_no_user() -> Result<(), Box<dyn Error>> {
    let app = start().await?;
    post_account(&app.router, credentials("ana", PASSWORD)).await?;

    for cookie in [
        "aes_session=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        "aes_session=",
        "aes_session=%%% no es base64 %%%",
        "aes_session",
        "otra=1",
        ";;;",
    ] {
        let reply = get_session(&app.router, Some(cookie)).await?;

        assert_eq!(reply.status, StatusCode::OK, "cookie: {cookie}");
        assert_eq!(
            reply.json()?,
            json!({ "accountExists": true, "username": null }),
            "cookie: {cookie}"
        );
    }
    Ok(())
}

#[tokio::test]
async fn session_reports_database_unavailable_when_the_pool_is_closed() -> Result<(), Box<dyn Error>>
{
    let app = start().await?;
    app.pool.close().await;

    let reply = get_session(&app.router, None).await?;

    assert_eq!(reply.status, StatusCode::SERVICE_UNAVAILABLE);
    assert_eq!(reply.json()?["error"]["code"], "database_unavailable");
    Ok(())
}

#[tokio::test]
async fn creating_the_account_returns_201_the_lowercase_username_and_the_session_cookie()
-> Result<(), Box<dyn Error>> {
    let app = start().await?;

    let reply = post_account(&app.router, credentials("Ana.Perez", PASSWORD)).await?;

    assert_eq!(reply.status, StatusCode::CREATED, "cuerpo: {}", reply.text);
    assert_eq!(reply.json()?, json!({ "username": "ana.perez" }));
    let set_cookie = reply.set_cookie().ok_or("falta Set-Cookie")?;
    assert!(set_cookie.starts_with("aes_session="), "{set_cookie}");
    assert!(
        set_cookie.ends_with("; HttpOnly; SameSite=Strict; Path=/"),
        "{set_cookie}"
    );
    assert!(!set_cookie.contains("Max-Age") && !set_cookie.contains("Expires"));
    assert!(!set_cookie.contains("Secure"));
    Ok(())
}

#[tokio::test]
async fn the_account_stores_an_argon2id_hash_and_the_session_stores_only_the_token_hash()
-> Result<(), Box<dyn Error>> {
    let app = start().await?;

    let reply = post_account(&app.router, credentials("ana", PASSWORD)).await?;

    let (username, password_hash): (String, String) =
        sqlx::query_as("SELECT username, password_hash FROM account WHERE id = 1")
            .fetch_one(&app.pool)
            .await?;
    assert_eq!(username, "ana");
    assert!(password_hash.starts_with("$argon2id$"), "{password_hash}");
    assert!(!password_hash.contains(PASSWORD));

    let pair = session_cookie_pair(&reply)?;
    let token = pair
        .strip_prefix("aes_session=")
        .ok_or("cookie sin nombre")?;
    let expected_hash = Sha256::digest(token.as_bytes());
    let stored: Vec<Vec<u8>> = sqlx::query_scalar("SELECT token_hash FROM session")
        .fetch_all(&app.pool)
        .await?;
    assert_eq!(stored, vec![expected_hash.to_vec()]);
    assert_ne!(stored[0], token.as_bytes());
    Ok(())
}

#[tokio::test]
async fn invalid_username_returns_400_with_only_that_field() -> Result<(), Box<dyn Error>> {
    let app = start().await?;

    let reply = post_account(&app.router, credentials("a b", PASSWORD)).await?;

    assert_eq!(reply.status, StatusCode::BAD_REQUEST);
    let body = reply.json()?;
    assert_eq!(body["error"]["code"], "validation_failed");
    assert!(body["error"]["message"].is_string());
    assert_eq!(body["error"]["fields"], json!({ "username": "invalid" }));
    assert_eq!(account_rows(&app.pool).await?, 0);
    assert_eq!(session_rows(&app.pool).await?, 0);
    assert_eq!(reply.set_cookie(), None);
    Ok(())
}

#[tokio::test]
async fn invalid_password_returns_400_with_only_that_field() -> Result<(), Box<dyn Error>> {
    let app = start().await?;

    let reply = post_account(&app.router, credentials("ana", "corta")).await?;

    assert_eq!(reply.status, StatusCode::BAD_REQUEST);
    let body = reply.json()?;
    assert_eq!(body["error"]["code"], "validation_failed");
    assert_eq!(body["error"]["fields"], json!({ "password": "length" }));
    assert_eq!(account_rows(&app.pool).await?, 0);
    Ok(())
}

#[tokio::test]
async fn both_invalid_fields_are_reported_together() -> Result<(), Box<dyn Error>> {
    let app = start().await?;

    let reply = post_account(&app.router, credentials("a", "corta")).await?;

    assert_eq!(reply.status, StatusCode::BAD_REQUEST);
    assert_eq!(
        reply.json()?["error"]["fields"],
        json!({ "username": "invalid", "password": "length" })
    );
    Ok(())
}

#[tokio::test]
async fn length_boundaries_are_accepted_and_rejected_as_specified() -> Result<(), Box<dyn Error>> {
    let cases: Vec<(String, String, StatusCode)> = vec![
        ("a".repeat(3), "p".repeat(12), StatusCode::CREATED),
        ("a".repeat(32), "p".repeat(128), StatusCode::CREATED),
        ("a".repeat(2), "p".repeat(12), StatusCode::BAD_REQUEST),
        ("a".repeat(33), "p".repeat(12), StatusCode::BAD_REQUEST),
        ("ana".to_string(), "p".repeat(11), StatusCode::BAD_REQUEST),
        ("ana".to_string(), "p".repeat(129), StatusCode::BAD_REQUEST),
        ("ana".to_string(), "😀".repeat(12), StatusCode::CREATED),
        ("ana".to_string(), "😀".repeat(11), StatusCode::BAD_REQUEST),
        ("ana".to_string(), "😀".repeat(128), StatusCode::CREATED),
        ("ana".to_string(), "😀".repeat(129), StatusCode::BAD_REQUEST),
        ("ana😀".to_string(), "p".repeat(12), StatusCode::BAD_REQUEST),
    ];

    for (username, password, expected) in cases {
        let app = start().await?;

        let reply = post_account(&app.router, credentials(&username, &password)).await?;

        assert_eq!(
            reply.status,
            expected,
            "usuario de {} caracteres, contraseña de {} caracteres",
            username.chars().count(),
            password.chars().count()
        );
    }
    Ok(())
}

#[tokio::test]
async fn a_second_account_gets_409_and_the_existing_one_does_not_change()
-> Result<(), Box<dyn Error>> {
    let app = start().await?;
    post_account(&app.router, credentials("ana", PASSWORD)).await?;
    let before: (String, String) =
        sqlx::query_as("SELECT username, password_hash FROM account WHERE id = 1")
            .fetch_one(&app.pool)
            .await?;

    let reply = post_account(&app.router, credentials("otra", "otra frase muy larga")).await?;

    assert_eq!(reply.status, StatusCode::CONFLICT);
    assert_eq!(reply.json()?["error"]["code"], "account_exists");
    assert_eq!(reply.set_cookie(), None);
    let after: (String, String) =
        sqlx::query_as("SELECT username, password_hash FROM account WHERE id = 1")
            .fetch_one(&app.pool)
            .await?;
    assert_eq!(before, after);
    assert_eq!(account_rows(&app.pool).await?, 1);
    assert_eq!(session_rows(&app.pool).await?, 1);
    Ok(())
}

#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
async fn two_simultaneous_creations_yield_one_201_and_one_409() -> Result<(), Box<dyn Error>> {
    let app = start().await?;

    let (first, second) = tokio::join!(
        tokio::spawn({
            let router = app.router.clone();
            async move {
                post_account(&router, credentials("ana", PASSWORD))
                    .await
                    .map(|r| r.status)
                    .map_err(|e| e.to_string())
            }
        }),
        tokio::spawn({
            let router = app.router.clone();
            async move {
                post_account(&router, credentials("beto", PASSWORD))
                    .await
                    .map(|r| r.status)
                    .map_err(|e| e.to_string())
            }
        }),
    );
    let mut statuses = vec![first??, second??];
    statuses.sort();

    assert_eq!(statuses, vec![StatusCode::CREATED, StatusCode::CONFLICT]);
    assert_eq!(account_rows(&app.pool).await?, 1);
    assert_eq!(session_rows(&app.pool).await?, 1);
    Ok(())
}

#[tokio::test]
async fn a_failed_creation_leaves_no_account_and_no_session() -> Result<(), Box<dyn Error>> {
    let app = start().await?;
    sqlx::query("DROP TABLE session").execute(&app.pool).await?;

    let reply = post_account(&app.router, credentials("ana", PASSWORD)).await?;

    assert_eq!(reply.status, StatusCode::SERVICE_UNAVAILABLE);
    assert_eq!(reply.json()?["error"]["code"], "database_unavailable");
    assert_eq!(account_rows(&app.pool).await?, 0);
    Ok(())
}

#[tokio::test]
async fn creation_reports_database_unavailable_when_the_pool_is_closed()
-> Result<(), Box<dyn Error>> {
    let app = start().await?;
    app.pool.close().await;

    let reply = post_account(&app.router, credentials("ana", PASSWORD)).await?;

    assert_eq!(reply.status, StatusCode::SERVICE_UNAVAILABLE);
    assert_eq!(reply.json()?["error"]["code"], "database_unavailable");
    Ok(())
}

#[tokio::test]
async fn bodies_that_are_not_valid_json_with_both_fields_return_invalid_body()
-> Result<(), Box<dyn Error>> {
    let app = start().await?;
    let cases: Vec<(Option<&str>, String)> = vec![
        (Some("application/json"), String::new()),
        (Some("application/json"), "no es json".to_string()),
        (Some("application/json"), "{}".to_string()),
        (
            Some("application/json"),
            json!({ "username": "ana" }).to_string(),
        ),
        (
            Some("application/json"),
            json!({ "username": 1, "password": 2 }).to_string(),
        ),
        (None, credentials("ana", PASSWORD).to_string()),
        (Some("text/plain"), credentials("ana", PASSWORD).to_string()),
    ];

    for (content_type, body) in cases {
        let reply = post_raw(&app.router, content_type, body.clone()).await?;

        assert_eq!(
            reply.status,
            StatusCode::BAD_REQUEST,
            "{content_type:?} {body:?}"
        );
        assert_eq!(reply.json()?["error"]["code"], "invalid_body");
        assert!(reply.json()?["error"].get("fields").is_none());
    }
    assert_eq!(account_rows(&app.pool).await?, 0);
    Ok(())
}

#[tokio::test]
async fn the_two_routes_reject_other_methods_with_the_uniform_error() -> Result<(), Box<dyn Error>>
{
    let app = start().await?;
    let cases = [
        (Method::POST, "/api/session"),
        (Method::PUT, "/api/session"),
        (Method::DELETE, "/api/session"),
        (Method::GET, "/api/account"),
        (Method::PUT, "/api/account"),
        (Method::DELETE, "/api/account"),
    ];

    for (method, uri) in cases {
        let reply = request(&app.router, method.clone(), uri, None, None, String::new()).await?;

        assert_eq!(
            reply.status,
            StatusCode::METHOD_NOT_ALLOWED,
            "{method} {uri}"
        );
        assert_eq!(reply.json()?["error"]["code"], "method_not_allowed");
    }
    Ok(())
}

#[tokio::test]
async fn the_two_routes_with_a_trailing_slash_return_the_uniform_not_found()
-> Result<(), Box<dyn Error>> {
    let app = start().await?;

    for uri in ["/api/session/", "/api/account/"] {
        let reply = request(&app.router, Method::GET, uri, None, None, String::new()).await?;

        assert_eq!(reply.status, StatusCode::NOT_FOUND, "{uri}");
        assert_eq!(reply.json()?["error"]["code"], "not_found");
    }
    Ok(())
}

#[tokio::test]
async fn a_primary_key_conflict_on_the_single_account_row_is_a_unique_violation()
-> Result<(), Box<dyn Error>> {
    let app = start().await?;
    sqlx::query("INSERT INTO account (id, username, password_hash) VALUES (1, 'a', 'h')")
        .execute(&app.pool)
        .await?;

    let error =
        sqlx::query("INSERT INTO account (id, username, password_hash) VALUES (1, 'b', 'h')")
            .execute(&app.pool)
            .await
            .err()
            .ok_or("la segunda fila debía fallar")?;

    let database_error = error.as_database_error().ok_or("no es un error de base")?;
    assert!(database_error.is_unique_violation());
    assert_eq!(database_error.code().as_deref(), Some("1555"));
    Ok(())
}

#[tokio::test]
async fn no_other_account_row_than_id_1_is_allowed() -> Result<(), Box<dyn Error>> {
    let app = start().await?;

    let result =
        sqlx::query("INSERT INTO account (id, username, password_hash) VALUES (2, 'a', 'h')")
            .execute(&app.pool)
            .await;

    assert!(result.is_err());
    Ok(())
}
