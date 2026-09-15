//! Versioned, serializable contracts shared by Drift's TypeScript analyzer and Rust runtime.

use std::{
    collections::{BTreeMap, BTreeSet},
    path::Path,
};

use serde::{Deserialize, Serialize};
use thiserror::Error;

pub const DIR_VERSION: &str = "0.1";

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct DirGraph {
    pub version: String,
    pub root: String,
    pub nodes: Vec<DirNode>,
    pub edges: Vec<DirEdge>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct DirNode {
    pub id: String,
    pub kind: DirNodeKind,
    pub name: String,
    #[serde(rename = "filePath", skip_serializing_if = "Option::is_none")]
    pub file_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub line: Option<u32>,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub metadata: BTreeMap<String, serde_json::Value>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct DirEdge {
    pub from: String,
    pub to: String,
    pub kind: DirEdgeKind,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum DirNodeKind {
    Application,
    Module,
    Route,
    Page,
    Layout,
    Action,
    Loader,
    Service,
    Provider,
    Resource,
    Database,
    Cache,
    Queue,
    Job,
    Schedule,
    Policy,
    Middleware,
    Stream,
    Cell,
    Secret,
    NativeFunction,
    ClientBoundary,
    ServerBoundary,
    Component,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum DirEdgeKind {
    DependsOn,
    Calls,
    Reads,
    Writes,
    Protects,
    Contains,
    ExecutesIn,
    PublishesTo,
    SubscribesTo,
    RequiresSecret,
    RequiresNetwork,
    RequiresResource,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
pub struct DirDiagnostic {
    pub code: &'static str,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub node_id: Option<String>,
}

#[derive(Debug, Error)]
pub enum DirError {
    #[error("could not read DIR artifact {path}: {source}")]
    Read {
        path: String,
        #[source]
        source: std::io::Error,
    },
    #[error("could not parse DIR artifact: {0}")]
    Parse(#[from] serde_json::Error),
    #[error("DIR artifact is invalid:\n{0}")]
    Invalid(String),
}

impl DirGraph {
    pub fn from_json(input: &str) -> Result<Self, DirError> {
        let graph: Self = serde_json::from_str(input)?;
        graph
            .validate()
            .map_err(|diagnostics| DirError::Invalid(format_diagnostics(&diagnostics)))?;
        Ok(graph)
    }

    pub fn from_path(path: impl AsRef<Path>) -> Result<Self, DirError> {
        let path = path.as_ref();
        let input = std::fs::read_to_string(path).map_err(|source| DirError::Read {
            path: path.display().to_string(),
            source,
        })?;
        Self::from_json(&input)
    }

    pub fn validate(&self) -> Result<(), Vec<DirDiagnostic>> {
        let mut diagnostics = Vec::new();
        if self.version != DIR_VERSION {
            diagnostics.push(DirDiagnostic {
                code: "DIR001",
                message: format!(
                    "Unsupported DIR version {}. This kernel supports {}.",
                    self.version, DIR_VERSION
                ),
                node_id: None,
            });
        }

        let mut ids = BTreeSet::new();
        for node in &self.nodes {
            if !ids.insert(&node.id) {
                diagnostics.push(DirDiagnostic {
                    code: "DIR002",
                    message: format!("Duplicate node id {}.", node.id),
                    node_id: Some(node.id.clone()),
                });
            }
        }

        for edge in &self.edges {
            if !ids.contains(&edge.from) {
                diagnostics.push(DirDiagnostic {
                    code: "DIR003",
                    message: format!("Relationship starts at missing node {}.", edge.from),
                    node_id: Some(edge.from.clone()),
                });
            }
            if !ids.contains(&edge.to) {
                diagnostics.push(DirDiagnostic {
                    code: "DIR004",
                    message: format!("Relationship points to missing node {}.", edge.to),
                    node_id: Some(edge.to.clone()),
                });
            }
        }

        let routes = self
            .nodes
            .iter()
            .filter(|node| node.kind == DirNodeKind::Route);
        for route in routes {
            let pages = self
                .edges
                .iter()
                .filter(|edge| {
                    edge.from == route.id
                        && edge.kind == DirEdgeKind::Contains
                        && self
                            .nodes
                            .iter()
                            .any(|node| node.id == edge.to && node.kind == DirNodeKind::Page)
                })
                .count();
            if pages == 0 {
                diagnostics.push(DirDiagnostic {
                    code: "DIR005",
                    message: format!("Route {} has no page target.", route.name),
                    node_id: Some(route.id.clone()),
                });
            } else if pages > 1 {
                diagnostics.push(DirDiagnostic {
                    code: "DIR006",
                    message: format!("Route {} is claimed by {} pages.", route.name, pages),
                    node_id: Some(route.id.clone()),
                });
            }
        }

        if diagnostics.is_empty() {
            Ok(())
        } else {
            Err(diagnostics)
        }
    }

    pub fn routes(&self) -> Vec<&DirNode> {
        self.nodes
            .iter()
            .filter(|node| node.kind == DirNodeKind::Route)
            .collect()
    }
}

fn format_diagnostics(diagnostics: &[DirDiagnostic]) -> String {
    diagnostics
        .iter()
        .map(|diagnostic| format!("{}: {}", diagnostic.code, diagnostic.message))
        .collect::<Vec<_>>()
        .join("\n")
}

#[cfg(test)]
mod tests {
    use super::*;

    const VALID_GRAPH: &str = r#"{
      "version":"0.1","root":"/app",
      "nodes":[
        {"id":"application:root","kind":"application","name":"app"},
        {"id":"route:/","kind":"route","name":"/"},
        {"id":"page:pages/index.drift","kind":"page","name":"Home"}
      ],
      "edges":[{"from":"route:/","to":"page:pages/index.drift","kind":"contains"}]
    }"#;

    #[test]
    fn parses_the_typescript_graph_contract() {
        let graph = DirGraph::from_json(VALID_GRAPH).expect("graph should be valid");
        assert_eq!(graph.routes().len(), 1);
    }

    #[test]
    fn reports_duplicate_route_targets() {
        let mut graph = DirGraph::from_json(VALID_GRAPH).expect("graph should be valid");
        graph.nodes.push(DirNode {
            id: "page:pages/duplicate.drift".to_string(),
            kind: DirNodeKind::Page,
            name: "Duplicate".to_string(),
            file_path: None,
            line: None,
            metadata: BTreeMap::new(),
        });
        graph.edges.push(DirEdge {
            from: "route:/".to_string(),
            to: "page:pages/duplicate.drift".to_string(),
            kind: DirEdgeKind::Contains,
        });

        let diagnostics = graph.validate().expect_err("duplicate route must fail");
        assert!(
            diagnostics
                .iter()
                .any(|diagnostic| diagnostic.code == "DIR006")
        );
    }
}
