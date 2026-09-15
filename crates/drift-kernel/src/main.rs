use std::{env, net::SocketAddr};

use drift_ir::DirGraph;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let options = Options::parse()?;
    let graph = DirGraph::from_path(&options.graph_path)?;
    let app = drift_kernel::router(graph);
    let listener = tokio::net::TcpListener::bind(options.address).await?;

    println!("Drift kernel listening on http://{}", options.address);
    axum::serve(listener, app).await?;
    Ok(())
}

struct Options {
    graph_path: String,
    address: SocketAddr,
}

impl Options {
    fn parse() -> Result<Self, String> {
        let mut arguments = env::args().skip(1);
        let mut graph_path = None;
        let mut address = "127.0.0.1:8787"
            .parse()
            .expect("default socket address must be valid");

        while let Some(argument) = arguments.next() {
            match argument.as_str() {
                "--graph" => graph_path = arguments.next(),
                "--addr" => {
                    let value = arguments
                        .next()
                        .ok_or("--addr requires a host:port value")?;
                    address = value
                        .parse()
                        .map_err(|_| format!("Invalid socket address: {value}"))?;
                }
                "--help" | "-h" => {
                    return Err(
                        "Usage: drift-kernel --graph <path> [--addr 127.0.0.1:8787]".to_string()
                    );
                }
                _ => return Err(format!("Unknown argument: {argument}")),
            }
        }

        Ok(Self {
            graph_path: graph_path.ok_or("--graph <path> is required")?,
            address,
        })
    }
}
