# Rhythm: The Alpenglow Visualizer

Rhythm is a professional real-time monitoring and visualization dashboard for Solana's upcoming Alpenglow consensus upgrade. It provides a 3D visual audit of network health, finality speeds, and validator performance.

## Project Overview

Solana’s Alpenglow upgrade aims to achieve 150ms finality. Rhythm was built to visualize how this consensus shift actually looks across a global network. It transforms complex validator vote data into a cinematic 3D environment, allowing developers and stakeholders to "see" and "hear" the network achieving consensus in real-time.

## Key Features

### 1. 3D Consensus Visualization
- **The Singularity Core:** A central high-tech geometric assembly that pulses and glows as the network nears supermajority (66.7% participation).
- **Stake-Weighted Particles:** Each floating particle represents a validator. Larger particles represent validators with higher stake, making the network's power distribution visible.
- **Geographic Clustering:** Particles gravitate toward global region markers (US-East, EU-West, etc.) to show how data propagates across the world.

### 2. Hybrid Audio Engine
- **Cinematic Soundtrack:** A professional ambient background loop provides a serious, high-tech atmosphere.
- **Real-Time Sonification:** The system generates high-precision "diagnostic pings" for every block finalization. Clear tones represent the "Fast Path" while deeper tones signify the "Slow Path," providing an auditory cue for network health.

### 3. Professional Metrics HUD
- **Cluster Diagnostics:** Live tracking of the current slot, average participation percentage, and current leader region.
- **Performance Audit:** A dedicated "Lag Leaderboard" that identifies the top 10 underperforming validators who are missing the Fast Path.
- **Anomaly Detection:** Real-time monitoring for regional overloads or critical latency drift.

## Technology Stack

- **Frontend:** Next.js, React Three Fiber, Three.js, Tailwind CSS
- **Audio:** Web Audio API (Hybrid synthesis + MP3 looping)
- **Backend:** Node.js WebSocket engine for data simulation
- **Core Logic:** Built to handle high-throughput Solana vote streams (50+ events per second)

## Project Structure

```text
rhythm_project/
├── rhythm_engine/           # Data simulation engine
│   ├── simulator.js         # WebSocket server for simulated data
│   └── real-data-engine.js  # Engine for streaming real Solana Mainnet data
├── rhythm_web/              # Web frontend and 3D visualizer
│   ├── components/          # React Three Fiber components
│   ├── lib/                 # Audio engine and utility logic
│   └── public/              # Sound assets and static files
└── rhythm_core/             # Rust implementation (Logic skeleton)
```

## Setup and Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 1. Start the Data Engine
Navigate to the engine directory and start the simulator:
```bash
cd rhythm_engine
npm install
node simulator.js
```

### 2. Start the Frontend
In a new terminal, navigate to the web directory and start the development server:
```bash
cd rhythm_web
npm install
npm run dev
```

### 3. View the Dashboard
Open your browser and navigate to `http://localhost:3000`.

## How to Use

1. **Audio Control:** Click the "AUDIO ON" button in the bottom-right corner to activate the cinematic soundscape.
2. **Data Mode:** Use the toggle in the bottom-left to switch between the Alpenglow Simulation and Real Solana Mainnet Data (requires a live RPC connection).
3. **Freeze Frame:** Click "FREEZE FRAME" to pause the 3D scene and inspect specific validator clusters or anomalies.
4. **Leaderboard:** Monitor the "Performance Audit" on the right to see which nodes are currently causing the most network lag.

## Vision

Rhythm is designed to prove that high-speed consensus isn't just a number on a spreadsheet—it's a physical, global event. By making the Alpenglow upgrade visible and audible, we provide the Solana ecosystem with a powerful tool for transparency and network monitoring.

---
Built with a focus on performance, stability, and cinematic excellence.
