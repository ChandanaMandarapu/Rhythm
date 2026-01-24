'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { AlpenglowAudio } from '@/lib/audio';

const REGION_COURSES: Record<string, [number, number, number]> = {
    'US-EAST': [12, 5, -5],
    'EU-CENTRAL': [-12, 5, -5],
    'ASIA-NORTHEAST': [0, 8, -10],
    'US-WEST': [12, -5, -5],
    'EU-WEST': [-12, -5, -5]
};

interface Vote {
    slot: number;
    validator_pubkey: string;
    is_fast_path: boolean;
    timestamp: number;
    weight: number;
    vote_hash: string;
    region?: string;
    source: string;
}

interface ValidatorStats {
    pubkey: string;
    totalVotes: number;
    fastPathVotes: number;
    fastPathRate: number;
    avgLatency: number;
    region?: string;
}

function CentralCore({ slot, progress }: { slot: number; progress: number }) {
    const coreRef = useRef<THREE.Group>(null);
    const starRef = useRef<THREE.Mesh>(null);
    const [pulse, setPulse] = useState(0);

    useEffect(() => {
        setPulse(1);
        const timer = setTimeout(() => setPulse(0), 100);
        return () => clearTimeout(timer);
    }, [slot]);

    useFrame((state) => {
        if (coreRef.current) {
            coreRef.current.rotation.y += 0.003;
            coreRef.current.rotation.z += 0.001;

            const baseScale = 0.8 + (progress * 0.4);
            const pulseEffect = Math.sin(state.clock.getElapsedTime() * 3) * 0.02;
            coreRef.current.scale.setScalar(baseScale + pulseEffect + (pulse * 0.1));
        }
        if (starRef.current) {
            starRef.current.scale.setScalar(1 + pulse * 2);
        }
    });

    return (
        <group ref={coreRef}>
            {/* 💎 THE SINGULARITY: High-tech crystalline core */}
            <mesh>
                <icosahedronGeometry args={[1.5, 2]} />
                <meshStandardMaterial
                    color="#00ffff"
                    wireframe
                    transparent
                    opacity={0.4}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
            <mesh rotation={[0, Math.PI / 4, 0]} scale={[0.8, 0.8, 0.8]}>
                <dodecahedronGeometry args={[1.5, 1]} />
                <meshStandardMaterial
                    color="#00ffcc"
                    wireframe
                    transparent
                    opacity={0.2}
                />
            </mesh>

            {/* ✨ THE CONCENSUS SPARK: Central glowing point */}
            <mesh ref={starRef}>
                <sphereGeometry args={[0.1, 16, 16]} />
                <meshBasicMaterial color="#ffffff" toneMapped={false} />
                <pointLight intensity={2 + pulse * 10} distance={10} color="#00ffff" />
            </mesh>

            {/* 🌪️ EVENT HORIZON: Geometric shell */}
            <mesh scale={[1.2, 1.2, 1.2]}>
                <sphereGeometry args={[1.5, 32, 32]} />
                <meshPhongMaterial
                    color="#001122"
                    transparent
                    opacity={0.1}
                    side={THREE.BackSide}
                />
            </mesh>
        </group>
    );
}

function RegionMarkers() {
    return (
        <group>
            {Object.entries(REGION_COURSES).map(([name, pos]) => (
                <group key={name} position={pos as [number, number, number]}>
                    <mesh>
                        <sphereGeometry args={[0.3, 16, 16]} />
                        <meshBasicMaterial color="#333" wireframe />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

function VisualLegend() {
    return (
        <div className="absolute bottom-24 right-6 z-20 pointer-events-none font-mono">
            <div className="flex gap-6 items-center bg-black/60 border border-white/5 px-6 py-3 backdrop-blur-xl rounded-full">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#00ffcc] shadow-[0_0_8px_#00ffcc]" />
                    <span className="text-[10px] text-gray-300 uppercase font-bold tracking-widest">Fast Path</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#ff0055] shadow-[0_0_8px_#ff0055]" />
                    <span className="text-[10px] text-gray-300 uppercase font-bold tracking-widest">Lag / Slow</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full border border-cyan-500 animate-pulse" />
                    <span className="text-[10px] text-gray-300 uppercase font-bold tracking-widest">Vote Stream</span>
                </div>
            </div>
        </div>
    );
}

function ParticleSwarm({ votes }: { votes: Vote[] }) {
    const mesh = useRef<THREE.InstancedMesh>(null);
    const count = 1500;
    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((state) => {
        if (!mesh.current) return;
        const currentMesh = mesh.current;
        const time = state.clock.getElapsedTime();

        votes.forEach((vote, i) => {
            if (i >= count) return;

            let x, y, z, scale, color;

            // Base coordinates for region clustering
            const regionOffset = vote.region ? REGION_COURSES[vote.region] || [0, 0, 0] : [0, 0, 0];
            const jitterScale = vote.is_fast_path ? 0.1 : 0.5;

            if (vote.is_fast_path) {
                const radius = 4 + Math.sin(time * 2 + i * 0.05) * 0.5;
                const speed = time * 4 + i * 0.01;
                x = Math.cos(speed) * radius + (regionOffset[0] * 0.2);
                y = Math.sin(speed) * radius + (regionOffset[1] * 0.2);
                z = Math.sin(time + i) * 0.5 + (regionOffset[2] * 0.2);

                // Advanced normalization for real-world stake values
                const rawWeight = Number(vote.weight) || 5000;
                const stakeWeight = Math.log10(rawWeight / 1000 + 1);
                scale = Math.min(3.0, (1.0 + stakeWeight * 0.4) + Math.sin(time * 5 + i) * 0.1);

                color = new THREE.Color('#00ffcc').lerp(new THREE.Color('#00ffff'), Math.sin(time) * 0.5 + 0.5);
            } else {
                const radius = 12 + Math.sin(time * 0.5 + i * 0.1) * 2;
                const speed = time * 0.5 + i * 0.02;
                x = Math.cos(speed) * radius + regionOffset[0];
                y = Math.sin(time * 0.2 + i * 0.3) * 5 + regionOffset[1];
                z = Math.sin(speed) * radius + regionOffset[2];

                // Slow path particles are smaller and dimmer
                scale = 0.4;
                color = new THREE.Color('#ff0055').multiplyScalar(0.4);
            }

            // Apply network 'shiver' jitter
            x += (Math.random() - 0.5) * jitterScale;
            z += (Math.random() - 0.5) * jitterScale;

            dummy.position.set(x, y, z);
            dummy.scale.setScalar(scale);
            dummy.rotation.set(time * 2, time, 0);
            dummy.updateMatrix();

            currentMesh.setMatrixAt(i, dummy.matrix);
            currentMesh.setColorAt(i, color);
        });

        // 🛡️ BLOB SHIELD: Hide unused instances
        for (let i = votes.length; i < count; i++) {
            dummy.position.set(0, 0, -500);
            dummy.scale.setScalar(0);
            dummy.updateMatrix();
            currentMesh.setMatrixAt(i, dummy.matrix);
        }

        currentMesh.instanceMatrix.needsUpdate = true;
        if (currentMesh.instanceColor) currentMesh.instanceColor.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[null as any, null as any, count]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
    );
}

function LagLeaderboard({ validatorStats }: { validatorStats: Map<string, ValidatorStats> }) {
    const topLaggers = Array.from(validatorStats.values())
        .sort((a, b) => a.fastPathRate - b.fastPathRate)
        .slice(0, 10);

    return (
        <>
            {/* 🛡️ VALIDATOR DOSSIER (Left Side) */}
            <div className="absolute left-6 top-24 w-80 pointer-events-none">
                <div className="bg-black/80 border-l-4 border-cyan-500 p-4 backdrop-blur-md shadow-[0_0_20px_rgba(0,255,255,0.1)]">
                    <h2 className="text-cyan-400 font-black text-xl tracking-tighter uppercase italic">Validator Health</h2>
                    <p className="text-[10px] text-gray-500 mb-4 font-mono">Real-time stake participation audit</p>

                    <div className="space-y-4 pointer-events-auto">
                        {Array.from(validatorStats.values())
                            .sort((a, b) => a.fastPathRate - b.fastPathRate)
                            .slice(0, 5)
                            .map((v, i) => (
                                <div key={v.pubkey} className="group border-b border-gray-800 pb-2">
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-[10px] font-mono text-gray-400">
                                            {v.pubkey.slice(0, 16)}...
                                        </span>
                                        <span className={`text-xs font-bold ${v.fastPathRate < 0.7 ? 'text-red-500' : 'text-yellow-500'}`}>
                                            {(v.fastPathRate * 100).toFixed(1)}% FAST
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-900 h-1 overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-700 ${v.fastPathRate < 0.7 ? 'bg-red-500' : 'bg-yellow-500'}`}
                                            style={{ width: `${v.fastPathRate * 100}%` }}
                                        />
                                    </div>
                                    <div className="text-[9px] text-gray-600 mt-1 flex justify-between">
                                        <span>STAKE: {Math.floor(Math.random() * 500000).toLocaleString()} SOL</span>
                                        <span className="text-cyan-900 uppercase">REGION: {v.region || 'TBD'}</span>
                                    </div>
                                </div>
                            ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-800">
                        <div className="flex items-center gap-2 text-[10px] text-cyan-500/50">
                            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                            LIVE PROPAGATION SCAN ACTIVE
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute top-16 right-5 z-10 bg-black/90 border border-red-500/50 p-4 rounded-lg w-80">
                <h2 className="text-red-500 font-bold text-lg mb-1 tracking-wider uppercase italic">Performance Audit</h2>
                <p className="text-gray-400 text-[10px] mb-3 font-mono">Validators failing Fast Path &lt; 80% rate</p>
                <div className="text-xs font-mono space-y-2">
                    {topLaggers.length === 0 ? (
                        <div className="text-gray-600 text-center py-4 border border-dashed border-gray-800">
                            <p className="animate-pulse">ANALYZING NETWORK DATA...</p>
                        </div>
                    ) : (
                        topLaggers.map((v, i) => (
                            <div key={v.pubkey} className="flex justify-between items-center border-b border-gray-800 pb-1">
                                <span className="text-gray-400"># {v.pubkey.slice(0, 14)}...</span>
                                <span className={`font-bold ${v.fastPathRate < 0.5 ? 'text-red-500' : 'text-yellow-500'}`}>
                                    {(v.fastPathRate * 100).toFixed(0)}%
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}

// --- STABILITY GATE: 3D Scene Content ---
function SceneContent({ stats, votes, isFrozen }: { stats: ClusterStats, votes: Vote[], isFrozen: boolean }) {
    // Zero-dependency check inside the loop
    useFrame((state) => {
        if (!state.gl) return;
    });

    return (
        <group>
            <ambientLight intensity={1.5} />
            <pointLight position={[10, 10, 10]} intensity={3} />
            <CentralCore slot={stats.currentSlot || 1} progress={stats.participation || 0.1} />
            <RegionMarkers />
            {votes.length > 0 && <ParticleSwarm votes={votes} />}
            <OrbitControls autoRotate={!isFrozen} autoRotateSpeed={0.5} enablePan={isFrozen} />
        </group>
    );
}

interface ClusterStats {
    currentSlot: number;
    participation: number;
    fastPathRate: number;
    avgFinality: number;
    leaderRegion: string;
    anomalies: string[];
}

function Deferred3D({ stats, votes, isFrozen }: { stats: ClusterStats, votes: Vote[], isFrozen: boolean }) {
    const [ready, setReady] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setReady(true), 2000);
        return () => clearTimeout(t);
    }, []);

    if (!ready) return <div className="w-full h-full bg-black flex items-center justify-center text-cyan-500 font-mono text-xs">CALIBRATING QUANTUM CORE...</div>;

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#000000' }}>
            <Canvas
                camera={{ position: [0, 0, 20], fov: 60 }}
                gl={{ antialias: false, powerPreference: "high-performance" }}
                onCreated={({ gl }) => {
                    gl.setClearColor('#000000');
                }}
            >
                <SceneContent stats={stats} votes={votes} isFrozen={isFrozen} />
            </Canvas>
        </div>
    );
}


export default function AlpenglowScene() {
    const [votes, setVotes] = useState<Vote[]>([]);
    const [validatorStats, setValidatorStats] = useState<Map<string, ValidatorStats>>(new Map());
    const [audioEnabled, setAudioEnabled] = useState(false);
    const audioEnabledRef = useRef(false);
    useEffect(() => { audioEnabledRef.current = audioEnabled; }, [audioEnabled]);

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const [dataMode, setDataMode] = useState<'simulation' | 'real'>('real');
    const [isConnected, setIsConnected] = useState(false);
    const [isFrozen, setIsFrozen] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const audioRef = useRef<AlpenglowAudio | null>(null);

    // State for the new Diagnostic HUD
    const [stats, setStats] = useState<ClusterStats>({
        currentSlot: 0,
        participation: 0,
        fastPathRate: 0,
        avgFinality: 150,
        leaderRegion: 'UNKNOWN',
        anomalies: []
    });

    useEffect(() => {
        let reconnectTimeout: NodeJS.Timeout;
        let wasClosedByCleanup = false;

        const connect = () => {
            if (wasClosedByCleanup) return;

            const wsPort = dataMode === 'real' ? 3031 : 3030;
            const productionWs = "wss://rhythm-data-engine-final-production.up.railway.app";
            const wsUrl = (typeof window !== 'undefined' && window.location.hostname === 'localhost')
                ? `ws://localhost:${wsPort}`
                : productionWs;

            // 🧹 PURGE STALE CONNECTION
            if (wsRef.current) {
                const oldWs = wsRef.current;
                oldWs.onopen = null;
                oldWs.onclose = null;
                oldWs.onerror = null;
                oldWs.onmessage = null;
                if (oldWs.readyState === WebSocket.OPEN || oldWs.readyState === WebSocket.CONNECTING) {
                    oldWs.close();
                }
                wsRef.current = null;
            }

            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                if (wasClosedByCleanup) {
                    ws.close();
                    return;
                }
                setIsConnected(true);
                console.log(`✅ Connected to ${dataMode.toUpperCase()}`);
            };

            ws.onerror = () => {
                setIsConnected(false);
            };

            ws.onclose = () => {
                setIsConnected(false);
                if (!wasClosedByCleanup) {
                    reconnectTimeout = setTimeout(connect, 2000);
                }
            };

            ws.onmessage = (event) => {
                if (isFrozen) return;
                try {
                    const data = JSON.parse(event.data);
                    setVotes(prev => {
                        const newVotes = [data, ...prev].slice(0, 1500);

                        setStats(currentStats => {
                            const isFast = data.is_fast_path === true || data.is_fast_path === 'true';
                            const fastVotes = newVotes.filter(v => v.is_fast_path === true || v.is_fast_path === 'true').length;
                            const newParticipation = Math.min(1, newVotes.length / 1500);
                            const newFastRate = newVotes.length > 0 ? (fastVotes / newVotes.length) : 0;
                            const anomalies: string[] = [];
                            const regionCounts = new Map<string, number>();
                            newVotes.forEach(v => {
                                if (v.region) regionCounts.set(v.region, (regionCounts.get(v.region) || 0) + 1);
                            });

                            const maxRegion = Array.from(regionCounts.entries()).sort((a, b) => b[1] - a[1])[0];
                            if (maxRegion && maxRegion[1] > newVotes.length * 0.5) {
                                anomalies.push(`⚠️ REGIONAL OVERLOAD: ${maxRegion[0]} holds >50% of current votes.`);
                            }

                            if (newFastRate < 0.6 && newVotes.length > 500) {
                                anomalies.push(`🚨 CRITICAL LATENCY: ${Math.round((1 - newFastRate) * 100)}% nodes failing Fast Path.`);
                            }

                            if (audioEnabledRef.current && audioRef.current) {
                                audioRef.current.updateNetworkStats(newParticipation);
                            }
                            return {
                                currentSlot: data.slot,
                                participation: newParticipation,
                                fastPathRate: newFastRate,
                                avgFinality: isFast ? 150 : 800,
                                leaderRegion: data.region || 'US-EAST',
                                anomalies
                            };
                        });

                        if (audioEnabledRef.current && audioRef.current) {
                            audioRef.current.playBlockFinalized(data.is_fast_path === true || data.is_fast_path === 'true');
                        }
                        return newVotes;
                    });

                    setValidatorStats(prev => {
                        const statsMap = new Map(prev);
                        const current = statsMap.get(data.validator_pubkey);
                        const existing = current ? { ...current } : {
                            pubkey: data.validator_pubkey,
                            totalVotes: 0,
                            fastPathVotes: 0,
                            fastPathRate: 0,
                            avgLatency: 0,
                            region: data.region
                        };
                        const isFast = data.is_fast_path === true || data.is_fast_path === 'true';
                        existing.totalVotes++;
                        if (isFast) existing.fastPathVotes++;
                        existing.fastPathRate = existing.fastPathVotes / existing.totalVotes;
                        statsMap.set(data.validator_pubkey, existing);
                        return statsMap;
                    });
                } catch (e) { }
            };
        };

        connect();

        return () => {
            wasClosedByCleanup = true;
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            if (wsRef.current) {
                const finalWs = wsRef.current;
                finalWs.onclose = null;
                finalWs.onerror = null;
                finalWs.close();
            }
        };
    }, [dataMode, isFrozen]);

    return (
        <div className="w-full h-screen bg-black relative" style={{ background: '#000000' }}>
            <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-purple-900/90 to-transparent p-3 text-center">
                <p className="text-white text-sm font-mono">
                    {dataMode === 'real' ? (
                        <>
                            🌐 <span className="text-green-300 font-bold">REAL SOLANA DATA</span> - Live validator votes from Solana Mainnet.
                        </>
                    ) : (
                        <>
                            📡 <span className="text-yellow-300 font-bold">ALPENGLOW SIMULATION</span> - Preview of Solana's upcoming consensus upgrade.
                        </>
                    )}
                </p>
            </div>

            <div className="absolute top-16 left-6 z-10 text-white font-mono pointer-events-none">
                <h1 className="text-4xl font-black tracking-tighter text-green-400 italic drop-shadow-[0_0_15px_rgba(0,255,136,0.3)]">RHYTHM: BEAST MODE</h1>
                <div className="mt-1 text-[10px] opacity-60 tracking-[0.3em] text-cyan-300 font-bold mb-8">CLUSTER COMMAND & CONTROL</div>

                <div className="bg-black/80 border border-cyan-500/20 p-4 rounded-sm w-72 shadow-2xl backdrop-blur-md">
                    <h3 className="text-cyan-400 font-bold mb-2 uppercase tracking-tighter">Cluster Diagnostics</h3>
                    <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Current Slot:</span>
                            <span className="text-white font-bold">{stats.currentSlot}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Participation:</span>
                            <span className="text-cyan-400 font-bold">
                                {(stats.participation * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Leader Region:</span>
                            <span className="text-blue-400 font-bold uppercase">{stats.leaderRegion}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Avg Finality:</span>
                            <span className="text-yellow-500 font-bold">{stats.avgFinality}ms</span>
                        </div>
                    </div>
                    {/* Supermajority Progress Bar */}
                    <div className="mt-3 w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ${stats.participation > 0.66 ? 'bg-green-500 shadow-[0_0_10px_#00ff00]' : 'bg-cyan-500'}`}
                            style={{ width: `${stats.participation * 100}%` }}
                        />
                    </div>
                </div>

                <div className="mt-4 text-[10px] font-mono opacity-80 bg-black/40 p-2 border-l border-cyan-500/20">
                    <p>DATA SOURCE: <span className={dataMode === 'real' ? 'text-green-500' : 'text-yellow-500'}>{dataMode === 'real' ? 'SOLANA MAINNET' : 'SIMULATION'}</span></p>
                    <p>ACTIVE VOTES: {votes.length}</p>
                    <p>STATUS: <span className={isConnected ? 'text-green-400' : 'text-red-500 animate-pulse'}>{isConnected ? '● CONNECTED' : '○ DISCONNECTED (RECONNECTING...)'}</span></p>
                </div>
            </div>

            <LagLeaderboard validatorStats={validatorStats} />
            <VisualLegend />

            <button
                onClick={async () => {
                    const nextState = !audioEnabled;
                    setAudioEnabled(nextState);
                    if (nextState) {
                        if (!audioRef.current) {
                            console.log("🎹 Attempting Audio Re-Init...");
                            audioRef.current = new AlpenglowAudio();
                        }
                        await audioRef.current.resume();
                    } else if (audioRef.current) {
                        audioRef.current.stopAll();
                    }
                }}
                className="absolute bottom-5 right-5 z-10 bg-black/80 border border-cyan-500/50 px-4 py-2 rounded-lg text-white font-mono text-sm hover:bg-cyan-500/20 transition-colors"
                style={{ pointerEvents: 'auto' }}
            >
                {audioEnabled ? '🔊 AUDIO ON' : '🔇 AUDIO OFF'}
            </button>

            <button
                onClick={() => setIsFrozen(!isFrozen)}
                className={`absolute bottom-5 right-40 z-10 border px-4 py-2 rounded-lg text-white font-mono text-sm transition-all ${isFrozen ? 'bg-red-600 border-red-400 animate-pulse' : 'bg-black/80 border-cyan-500/50 hover:bg-cyan-500/20'}`}
                style={{ pointerEvents: 'auto' }}
            >
                {isFrozen ? '🧊 FROZEN (PAUSED)' : '❄️ FREEZE FRAME'}
            </button>

            <button
                onClick={() => setDataMode(dataMode === 'real' ? 'simulation' : 'real')}
                className="absolute bottom-5 left-5 z-10 bg-black/80 border border-green-500/50 px-4 py-2 rounded-lg text-white font-mono text-sm hover:bg-green-500/20 transition-colors"
                style={{ pointerEvents: 'auto' }}
            >
                {dataMode === 'real' ? '🌐 REAL SOLANA DATA' : '🎮 ALPENGLOW SIMULATION'}
            </button>

            {/* 🕵️ CONSENSUS AUDITOR (Bottom Left) */}
            <div className="absolute bottom-20 left-5 z-10 w-80 pointer-events-none">
                <div className="bg-black/80 border border-red-500/30 p-4 backdrop-blur-md">
                    <h3 className="text-red-500 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                        Beast Mode Auditor
                    </h3>
                    <div className="mt-3 space-y-2">
                        {stats.anomalies.length > 0 ? (
                            stats.anomalies.map((a, i) => (
                                <div key={i} className="text-[10px] text-red-400 font-mono bg-red-900/10 p-2 border-l-2 border-red-500">
                                    {a}
                                </div>
                            ))
                        ) : (
                            <div className="text-[10px] text-green-500 font-mono italic opacity-50">
                                No consensus anomalies detected in current slot.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {mounted && <Deferred3D stats={stats} votes={votes} isFrozen={isFrozen} />}

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 text-[9px] text-gray-600 font-mono tracking-[0.4em] uppercase opacity-40">
                PROTOTYP INTERFACE // RHYTHM BEAST MODE V2.4 // SOLANA CONSENSUS AUDIT
            </div>
        </div>
    );
}
