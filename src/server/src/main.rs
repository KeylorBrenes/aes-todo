use aes_todo_server::config::Config;
use aes_todo_server::http::{AppState, app};
use aes_todo_server::store;

#[tokio::main]
async fn main() {
    if let Err(error) = run().await {
        eprintln!("No se pudo iniciar el servidor: {error}");
        std::process::exit(1);
    }
}

async fn run() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let config = Config::from_env();
    let pool = store::open(&config.database_url).await?;
    let listener = tokio::net::TcpListener::bind(&config.app_addr).await?;
    let router = app(AppState {
        pool,
        web_dist: config.web_dist,
    });

    tracing::info!(addr = %config.app_addr, "servidor escuchando");
    axum::serve(listener, router).await?;

    Ok(())
}
