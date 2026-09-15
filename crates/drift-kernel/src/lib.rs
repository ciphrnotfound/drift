//! Minimal HTTP kernel for inspecting a validated Drift application graph.

use std::sync::Arc;

use axum::{Json, Router, extract::State, http::StatusCode, response::IntoResponse, routing::get};
use drift_ir::{DIR_VERSION, DirGraph};
use serde::Serialize;

#[derive(Clone)]
pub struct KernelState {
    graph: Arc<DirGraph>,
}

impl KernelState {
    pub fn new(graph: DirGraph) -> Self {
        Self {
            graph: Arc::new(graph),
        }
    }
}

pub fn router(application_graph: DirGraph) -> Router {
    Router::new()
        .route("/health", get(health))
        .route("/graph", get(graph))
        .route("/routes", get(routes))
        .fallback(not_found)
        .with_state(KernelState::new(application_graph))
}

#[derive(Serialize)]
struct Health {
    status: &'static str,
    dir_version: &'static str,
    nodes: usize,
    edges: usize,
}

async fn health(State(state): State<KernelState>) -> Json<Health> {
    Json(Health {
        status: "ok",
        dir_version: DIR_VERSION,
        nodes: state.graph.nodes.len(),
        edges: state.graph.edges.len(),
    })
}

async fn graph(State(state): State<KernelState>) -> Json<DirGraph> {
    Json((*state.graph).clone())
}

async fn routes(State(state): State<KernelState>) -> Json<Vec<drift_ir::DirNode>> {
    Json(state.graph.routes().into_iter().cloned().collect())
}

async fn not_found() -> impl IntoResponse {
    (StatusCode::NOT_FOUND, "Drift kernel route not found")
}

#[cfg(test)]
mod tests {
    use axum::{
        body::Body,
        http::{Request, StatusCode},
    };
    use drift_ir::DirGraph;
    use tower::ServiceExt;

    use super::router;

    fn graph() -> DirGraph {
        DirGraph::from_json(
            r#"{
          "version":"0.1","root":"/app",
          "nodes":[
            {"id":"application:root","kind":"application","name":"app"},
            {"id":"route:/","kind":"route","name":"/"},
            {"id":"page:pages/index.drift","kind":"page","name":"Home"}
          ],
          "edges":[{"from":"route:/","to":"page:pages/index.drift","kind":"contains"}]
        }"#,
        )
        .expect("fixture must be valid")
    }

    #[tokio::test]
    async fn serves_runtime_health() {
        let response = router(graph())
            .oneshot(
                Request::builder()
                    .uri("/health")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn exposes_declared_routes() {
        let response = router(graph())
            .oneshot(
                Request::builder()
                    .uri("/routes")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
    }
}
