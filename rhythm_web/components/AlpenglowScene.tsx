'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { AlpenglowAudio } from '@/lib/audio';

interface Vote {
    slot: number;
    validator_pubkey: string;
    is_fast_path: boolean;
    timestamp: number;
    weight: number;
    vote_hash: string;
}

interface ValidatorStats {
    pubkey: string;
    totalVotes: number;
    fastPathVotes: number;
    fastPathRate: number;
    avgLatency: number;
}

function CentralCore() {
    const coreRef = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (coreRef.current) {
            coreRef.current.rotation.y += 0.01;
            coreRef.current.rotation.z += 0.005;
            const scale = 1 + Math.sin(state.clock.getElapsedTime() * 2) * 0.1;
            coreRef.current.scale.setScalar(scale);
        }
    });

    return (
        <group>
            <Float speed={2} rotationIntensity={2} floatIntensity={1}>
                <mesh ref={coreRef}>
                    <icosahedronGeometry args={[1.5, 1]} />
                    <meshStandardMaterial
                        color="#00ffff"
                        emissive="#00ffff"
                        emissiveIntensity={2}
                        wireframe
                    />
                </mesh>
            </Float>
            <mesh>
                <sphereGeometry args={[1.2, 32, 32]} />
                <meshBasicMaterial color="#00ffff" transparent opacity={0.2} />
            </mesh>
        </group>
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

            if (vote.is_fast_path) {
                const radius = 4 + Math.sin(time * 2 + i * 0.05) * 0.5;
                const speed = time * 4 + i * 0.01;
                x = Math.cos(speed) * radius;
                y = Math.sin(speed) * radius;
                z = Math.sin(time + i) * 0.5;
                scale = 1.8 + Math.sin(time * 5 + i) * 0.4;
                color = new THREE.Color('#00ffcc').lerp(new THREE.Color('#0088ff'), Math.sin(time) * 0.5 + 0.5);
            } else {
                const radius = 12 + Math.sin(time * 0.5 + i * 0.1) * 2;
                const speed = time * 0.5 + i * 0.02;
                x = Math.cos(speed) * radius;
                y = Math.sin(time * 0.2 + i * 0.3) * 5;
                z = Math.sin(speed) * radius;
                scale = 0.5;
                color = new THREE.Color('#ff0055').multiplyScalar(0.5);
            }

            dummy.position.set(x, y, z);
            dummy.scale.setScalar(scale);
            dummy.rotation.set(time * 2, time, 0);
            dummy.updateMatrix();

            currentMesh.setMatrixAt(i, dummy.matrix);
            currentMesh.setColorAt(i, color);
        });

        currentMesh.instanceMatrix.needsUpdate = true;
        if (currentMesh.instanceColor) currentMesh.instanceColor.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshStandardMaterial toneMapped={false} />
        </instancedMesh>
    );
}

function LagLeaderboard({ validators }: { validators: ValidatorStats[] }) {
    const topLaggers = validators
        .sort((a, b) => a.fastPathRate - b.fastPathRate)
        .slice(0, 10);

    return (
        <div className="absolute top-16 right-5 z-10 bg-black/90 border border-red-500/50 p-4 rounded-lg w-80">
            <h2 className="text-red-500 font-bold text-lg mb-1 tracking-wider">⚠️ LAG LEADERBOARD</h2>
            <p className="text-gray-400 text-xs mb-3">Validators missing the Fast Path (worst performers)</p>
            <div className="text-xs font-mono space-y-2">
                {topLaggers.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Waiting for data...</p>
                ) : (
                    topLaggers.map((v, i) => (
                        <div key={v.pubkey} className="flex justify-between items-center border-b border-gray-800 pb-1">
                            <span className="text-gray-400">#{i + 1} {v.pubkey.slice(0, 12)}...</span>
                            <span className={`font-bold ${v.fastPathRate < 0.5 ? 'text-red-500' : 'text-yellow-500'}`}>
                                {(v.fastPathRate * 100).toFixed(1)}%
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default function AlpenglowScene() {
    const [votes, setVotes] = useState<Vote[]>([]);
    const [validatorStats, setValidatorStats] = useState<Map<string, ValidatorStats>>(new Map());
    const [audioEnabled, setAudioEnabled] = useState(false);
    const audioEnabledRef = useRef(false);
    useEffect(() => { audioEnabledRef.current = audioEnabled; }, [audioEnabled]);

    const lastSlotRef = useRef(0);
    const [dataMode, setDataMode] = useState<'simulation' | 'real'>('simulation');
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const audioRef = useRef<AlpenglowAudio | null>(null);

    useEffect(() => {
        let reconnectTimeout: NodeJS.Timeout;
        let wasClosedByCleanup = false;

        const connect = () => {
            if (wasClosedByCleanup) return;

            const wsPort = dataMode === 'real' ? 3031 : 3030;
            const wsUrl = `ws://127.0.0.1:${wsPort}`;

            if (wsRef.current) {
                wsRef.current.onclose = null;
                wsRef.current.onerror = null;
                if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
                    wsRef.current.close();
                }
            }

            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                if (wasClosedByCleanup) {
                    ws.close();
                    return;
                }
                setIsConnected(true);
                console.log(`✅ Connected to ${dataMode === 'real' ? 'Real Solana Data' : 'Alpenglow Simulator'}`);
            };

            ws.onerror = (error) => {
                setIsConnected(false);
            };

            ws.onclose = () => {
                setIsConnected(false);
                if (!wasClosedByCleanup) {
                    reconnectTimeout = setTimeout(connect, 2000);
                }
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.slot !== lastSlotRef.current) {
                        if (audioEnabledRef.current && audioRef.current) {
                            audioRef.current.playBlockFinalized(data.is_fast_path);
                        }
                        lastSlotRef.current = data.slot;
                    }
                    setVotes(prev => [data, ...prev].slice(0, 1500));
                    setValidatorStats(prev => {
                        const stats = new Map(prev);
                        const existing = stats.get(data.validator_pubkey) || {
                            pubkey: data.validator_pubkey,
                            totalVotes: 0,
                            fastPathVotes: 0,
                            fastPathRate: 0,
                            avgLatency: 0
                        };
                        existing.totalVotes++;
                        if (data.is_fast_path) existing.fastPathVotes++;
                        existing.fastPathRate = existing.fastPathVotes / existing.totalVotes;
                        stats.set(data.validator_pubkey, existing);
                        return stats;
                    });
                } catch (e) { }
            };
        };

        connect();

        return () => {
            wasClosedByCleanup = true;
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            if (wsRef.current) {
                wsRef.current.onclose = null;
                wsRef.current.onerror = null;
                if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
                    wsRef.current.close();
                }
            }
        };
    }, [dataMode]);

    return (
        <div className="w-full h-screen bg-black relative">
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

            <div className="absolute top-16 left-5 z-10 text-white font-mono pointer-events-none">
                <h1 className="text-4xl font-black tracking-tighter text-green-400 italic drop-shadow-[0_0_10px_rgba(0,255,136,0.5)]">RHYTHM: BEAST MODE ACTIVE</h1>
                <div className="mt-1 text-xs opacity-70 tracking-widest text-cyan-300 font-bold">SOLANA ALPENGLOW VISUALIZER</div>
                <div className="mt-3 text-sm opacity-70">
                    <p>DATA SOURCE: <span className={dataMode === 'real' ? 'text-green-500' : 'text-yellow-500'}>{dataMode === 'real' ? 'SOLANA MAINNET' : 'SIMULATION'}</span></p>
                    <p>ACTIVE VOTES: {votes.length}</p>
                    <p>STATUS: <span className={isConnected ? 'text-green-400' : 'text-red-500 animate-pulse'}>{isConnected ? '● CONNECTED' : '○ DISCONNECTED (RECONNECTING...)'}</span></p>
                </div>
            </div>

            <LagLeaderboard validators={Array.from(validatorStats.values())} />

            <button
                onClick={async () => {
                    const nextState = !audioEnabled;
                    setAudioEnabled(nextState);
                    if (nextState) {
                        if (!audioRef.current) audioRef.current = new AlpenglowAudio();
                        await audioRef.current.resume();
                    } else if (audioRef.current) {
                        (audioRef.current as any).stopBackgroundMusic?.();
                    }
                }}
                className="absolute bottom-5 right-5 z-10 bg-black/80 border border-cyan-500/50 px-4 py-2 rounded-lg text-white font-mono text-sm hover:bg-cyan-500/20 transition-colors"
            >
                {audioEnabled ? '🔊 AUDIO ON' : '🔇 AUDIO OFF'}
            </button>

            <button
                onClick={() => setDataMode(dataMode === 'real' ? 'simulation' : 'real')}
                className="absolute bottom-5 left-5 z-10 bg-black/80 border border-green-500/50 px-4 py-2 rounded-lg text-white font-mono text-sm hover:bg-green-500/20 transition-colors"
            >
                {dataMode === 'real' ? '🌐 REAL SOLANA DATA' : '🎮 ALPENGLOW SIMULATION'}
            </button>

            <Canvas camera={{ position: [0, 0, 20], fov: 60 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <CentralCore />
                <ParticleSwarm votes={votes} />
                <OrbitControls autoRotate autoRotateSpeed={0.5} enablePan={false} />
            </Canvas>
        </div>
    );
}
