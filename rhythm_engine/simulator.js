const WebSocket = require('ws');

const PORT = 3030;
const wss = new WebSocket.Server({ port: PORT });

console.log(`🚀 Rhythm Engine (Node.js)`);
console.log(`>> Alpenglow Simulator Listening on ws://localhost:${PORT}`);

// Broadcast helper
wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

let slot = 20000;

// Simulation Loop
setInterval(() => {
  slot++;
  const isFastPath = Math.random() < 0.8; // 80% chance of fast path
  
  // console.log(`[BLOCK ${slot}] Proposing... FastPath: ${isFastPath}`);

  // Burst of 50 votes
  let votesSent = 0;
  const burstInterval = setInterval(() => {
    if (votesSent >= 50) {
      clearInterval(burstInterval);
      return;
    }

    const vote = {
      slot: slot,
      validator_pubkey: `Validator-${Math.floor(Math.random() * 1500)}`,
      vote_hash: `Hash-${Math.random().toString(36).substring(7)}`,
      weight: Math.floor(Math.random() * 50000) + 1000,
      is_fast_path: isFastPath, // All votes in this burst tend to agree on the path
      timestamp: Date.now()
    };

    wss.broadcast(JSON.stringify(vote));
    votesSent++;
  }, 5); // 5ms gap between votes (simulates burst)

}, 400); // New block every 400ms (Alpenglow Slot Time)
