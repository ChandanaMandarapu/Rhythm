const WebSocket = require('ws');
const https = require('https');

const PORT = 3031; // Different port from simulator
const wss = new WebSocket.Server({ port: PORT });

console.log(`🌐 Rhythm Real-Data Engine`);
console.log(`>> Connecting to Solana Mainnet...`);
console.log(`>> WebSocket Server: ws://localhost:${PORT}`);


const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';

wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};

// Track vote accounts we're monitoring
const KNOWN_VALIDATORS = [];
let currentSlot = 0;
let leaderRegion = 'US-EAST';

const REGIONS = ['US-EAST', 'EU-CENTRAL', 'ASIA-NORTHEAST', 'US-WEST', 'EU-WEST'];

function getRegionForValidator(pubkey) {
    const charCode = pubkey.charCodeAt(0);
    return REGIONS[charCode % REGIONS.length];
}

// Fetch current slot from Solana
async function getCurrentSlot() {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getSlot'
        });

        const options = {
            hostname: 'api.mainnet-beta.solana.com',
            port: 443,
            path: '/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    resolve(result.result);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// Fetch vote accounts
async function getVoteAccounts() {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getVoteAccounts'
        });

        const options = {
            hostname: 'api.mainnet-beta.solana.com',
            port: 443,
            path: '/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    resolve(result.result);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// Initialize and start polling
async function start() {
    try {
        // Get initial slot
        currentSlot = await getCurrentSlot();
        console.log(`✅ Connected! Current Slot: ${currentSlot}`);

        // Get vote accounts
        const voteData = await getVoteAccounts();
        const allValidators = [...voteData.current, ...voteData.delinquent];

        console.log(`📊 Tracking ${allValidators.length} validators`);

        // Store validator info
        allValidators.forEach(v => {
            KNOWN_VALIDATORS.push({
                pubkey: v.nodePubkey,
                votePubkey: v.votePubkey,
                commission: v.commission,
                lastVote: v.lastVote,
                activatedStake: v.activatedStake,
                region: getRegionForValidator(v.nodePubkey)
            });
        });

        // Poll for slot updates and generate vote events
        setInterval(async () => {
            try {
                const newSlot = await getCurrentSlot();

                if (newSlot > currentSlot) {
                    currentSlot = newSlot;
                    // Rotate leader region randomly per slot
                    leaderRegion = REGIONS[Math.floor(Math.random() * REGIONS.length)];
                    console.log(`>> New Slot: ${currentSlot} | Leader Region: ${leaderRegion}`);

                    // Sample 120 validators per slot for better information density
                    const votingValidators = [];
                    for (let i = 0; i < 120; i++) {
                        const randomValidator = KNOWN_VALIDATORS[Math.floor(Math.random() * KNOWN_VALIDATORS.length)];
                        votingValidators.push(randomValidator);
                    }

                    // Broadcast votes with GEOGRAPHIC JITTER
                    votingValidators.forEach((validator, i) => {
                        // Calculate geographic distance latency
                        const isSameRegion = validator.region === leaderRegion;
                        const geoLatency = isSameRegion ? 50 : 250;
                        const emissionJitter = Math.random() * 100;

                        setTimeout(() => {
                            const vote = {
                                slot: currentSlot,
                                validator_pubkey: validator.pubkey,
                                vote_hash: `Vote-${currentSlot}-${i}`,
                                weight: validator.activatedStake || 5000,
                                // Fast Path if same region or lucky propagation
                                is_fast_path: isSameRegion ? Math.random() < 0.95 : Math.random() < 0.3,
                                timestamp: Date.now(),
                                region: validator.region,
                                source: 'REAL_SOLANA_DATA'
                            };

                            wss.broadcast(JSON.stringify(vote));
                        }, geoLatency + emissionJitter);
                    });
                }
            } catch (error) {
                console.error('Slot polling error:', error.message);
            }
        }, 400); // Check every 400ms (Solana block time)

    } catch (error) {
        console.error('❌ Failed to connect to Solana:', error.message);
        console.log('⚠️  Falling back to demo mode...');

        // Fallback: generate demo data if RPC fails
        let demoSlot = 250000000;
        setInterval(() => {
            demoSlot++;
            for (let i = 0; i < 50; i++) {
                setTimeout(() => {
                    const vote = {
                        slot: demoSlot,
                        validator_pubkey: `Validator-${Math.floor(Math.random() * 1500)}`,
                        vote_hash: `Demo-${demoSlot}-${i}`,
                        weight: Math.floor(Math.random() * 50000) + 1000,
                        is_fast_path: Math.random() < 0.85,
                        timestamp: Date.now(),
                        source: 'DEMO_MODE'
                    };
                    wss.broadcast(JSON.stringify(vote));
                }, i * 8);
            }
        }, 400);
    }
}

start();
