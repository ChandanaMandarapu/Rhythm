use serde::{Deserialize, Serialize};
use tokio::sync::broadcast;
use tokio::time::{sleep, Duration};
use warp::Filter;
use rand::Rng;
use futures_util::{SinkExt, StreamExt};

#[derive(Serialize, Deserialize, Debug, Clone)]
struct VoteCertificate {
    slot: u64,
    validator_pubkey: String,
    vote_hash: String,
    weight: u32,
    is_fast_path: bool,
    timestamp: u64,
}

#[tokio::main]
async fn main() {
    println!("🚀 Rhythm Core: Alpenglow WebSocket Server Starting...");
    println!(">> Listening on ws://127.0.0.1:3030/ws");

    // Create a broadcast channel for real-time votes
    let (tx, _rx) = broadcast::channel::<String>(100);
    let tx_clone = tx.clone();

    // SPWN: Simulation Task (The Mock Votor Engine)
    tokio::spawn(async move {
        run_simulation(tx_clone).await;
    });

    // WEBSOCKET: Define the route
    let routes = warp::path("ws")
        .and(warp::ws())
        .map(move |ws: warp::ws::Ws| {
            let tx = tx.clone();
            ws.on_upgrade(move |socket| handle_connection(socket, tx))
        });

    warp::serve(routes).run(([127, 0, 0, 1], 3030)).await;
}

async fn handle_connection(ws: warp::ws::WebSocket, tx: broadcast::Sender<String>) {
    let (mut ws_tx, _ws_rx) = ws.split();
    let mut rx = tx.subscribe();

    while let Ok(msg) = rx.recv().await {
        if let Err(_e) = ws_tx.send(warp::ws::Message::text(msg)).await {
            break; // Client disconnected
        }
    }
}

async fn run_simulation(tx: broadcast::Sender<String>) {
    let mut slot = 10_000;
    loop {
        slot += 1;
        
        // Block Proposal Phase
        println!("\n[BLOCK {}] Proposing...", slot);

        // Burst of 50 Votes
        for i in 0..50 {
            let vote = generate_fake_vote(slot, i);
            let json = serde_json::to_string(&vote).unwrap();
            
            // Broadcast to all connected WebSocket clients
            let _ = tx.send(json);

            // Simulate jitter (1-5ms)
            let latency = rand::thread_rng().gen_range(1..5);
            sleep(Duration::from_millis(latency)).await;
        }

        // Block Time (400ms)
        sleep(Duration::from_millis(400)).await;
    }
}

fn generate_fake_vote(slot: u64, index: u32) -> VoteCertificate {
    let mut rng = rand::thread_rng();
    VoteCertificate {
        slot,
        validator_pubkey: format!("Validator-{}", index),
        vote_hash: format!("Hash-{}", rng.gen::<u32>()),
        weight: rng.gen_range(1000..50000),
        is_fast_path: rng.gen_bool(0.9), 
        timestamp: 1768000000 + slot, 
    }
}
