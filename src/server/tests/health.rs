use std::error::Error;
use std::path::{Path, PathBuf};

use aes_todo_server::http::{AppState, app};
use aes_todo_server::store;
use axum::Router;
use axum::body::Body;
use axum::http::{Request, StatusCode};
use http_body_util::BodyExt;
use serde_json::Value;
use sqlx::SqlitePool;
use tempfile::TempDir;
use tower::ServiceExt;

/// App recién arrancada sobre una base temporal que todavía no existía.
struct TestApp {
    router: Router,
    pool: SqlitePool,
    db_path: PathBuf,
    _dir: TempDir,
}

async fn start() -> Result<TestApp, Box<dyn Error>> {
    let dir = TempDir::new()?;
    let db_path = dir.path().join("aes-todo.db");
    let url = format!("sqlite:{}", db_path.display());
    let pool = store::open(&url).await?;
    let router = app(AppState {
        pool: pool.clone(),
        web_dist: dir.path().join("sin-web"),
    });

    Ok(TestApp {
        router,
        pool,
        db_path,
        _dir: dir,
    })
}

async fn get(router: Router, uri: &str) -> Result<(StatusCode, Value), Box<dyn Error>> {
    let response = router
        .oneshot(Request::builder().uri(uri).body(Body::empty())?)
        .await?;
    let status = response.status();
    let bytes = response.into_body().collect().await?.to_bytes();

    Ok((status, serde_json::from_slice(&bytes)?))
}

async fn applied_migrations(pool: &SqlitePool) -> Result<i64, Box<dyn Error>> {
    let count = sqlx::query_scalar("SELECT COUNT(*) FROM _sqlx_migrations")
        .fetch_one(pool)
        .await?;

    Ok(count)
}

fn assert_created_database(db_path: &Path) {
    assert!(
        db_path.exists(),
        "no se creó la base de datos en {}",
        db_path.display()
    );
}

#[tokio::test]
async fn health_creates_the_database_and_applies_migrations() -> Result<(), Box<dyn Error>> {
    let app = start().await?;

    assert_created_database(&app.db_path);
    assert_eq!(applied_migrations(&app.pool).await?, 1);

    let (status, body) = get(app.router, "/api/health").await?;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(body, serde_json::json!({ "status": "ok" }));
    Ok(())
}

#[tokio::test]
async fn health_reports_database_unavailable_when_the_pool_is_closed() -> Result<(), Box<dyn Error>>
{
    let app = start().await?;
    app.pool.close().await;

    let (status, body) = get(app.router, "/api/health").await?;

    assert_eq!(status, StatusCode::SERVICE_UNAVAILABLE);
    assert_eq!(body["error"]["code"], "database_unavailable");
    Ok(())
}

#[tokio::test]
async fn unknown_api_route_returns_the_uniform_not_found_body() -> Result<(), Box<dyn Error>> {
    let app = start().await?;

    let (status, body) = get(app.router, "/api/nada").await?;

    assert_eq!(status, StatusCode::NOT_FOUND);
    assert_eq!(body["error"]["code"], "not_found");
    Ok(())
}
