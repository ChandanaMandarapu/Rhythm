// 🎹 Rhythm soul lies here
export class AlpenglowAudio {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;

    // Drone
    private healthDrone: OscillatorNode | null = null;
    private healthGain: GainNode | null = null;

    // MP3 background
    private bgBuffer: AudioBuffer | null = null;
    private bgSource: AudioBufferSourceNode | null = null;
    private isPlayingBackground = false;

    private pianoScale = [196.0, 220.0, 246.94, 261.63, 293.66, 329.63, 392.0, 440.0];
    private lastPingTime = 0;

    constructor() {
        console.log("🎹 AUDIO ENGINE INSTANTIATED");
    }

    // ---------------- INIT ----------------
    private init() {
        if (this.ctx) return;

        console.log("🎹 INITIALIZING AUDIO CONTEXT...");
        const AudioContextClass =
            window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5;
        this.masterGain.connect(this.ctx.destination);

        console.log("✅ AUDIO CONTEXT READY:", this.ctx.state);
    }

    // ---------------- RESUME ----------------
    async resume() {
        this.init();
        if (!this.ctx) return;

        // 🔓 unlock audio
        const buffer = this.ctx.createBuffer(1, 1, 22050);
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        src.connect(this.ctx.destination);
        src.start(0);

        if (this.ctx.state === "suspended") {
            await this.ctx.resume();
        }

        this.playPianoNote(880, 0.2, 0.4);
        this.startHealthDrone();

        // Ensure MP3 is loaded once
        if (!this.bgBuffer) {
            await this.loadBackgroundMusic();
        }
        this.startBackgroundMusic();
    }

    // ---------------- MP3 LOADER ----------------
    private async loadBackgroundMusic() {
        if (!this.ctx || this.bgBuffer) return;

        console.log("🎵 LOADING BACKGROUND MP3...");
        try {
            // Check both root and audio subfolder for robustness
            const urls = [
                "/piano-waltz-elegant-and-graceful-instrumental-music-285601.mp3",
                "/audio/bg_music.mp3"
            ];

            let response: Response | null = null;
            for (const url of urls) {
                const res = await fetch(url);
                if (res.ok) {
                    response = res;
                    break;
                }
            }

            if (!response) throw new Error("Could not find music file");

            const arrayBuffer = await response.arrayBuffer();
            this.bgBuffer = await this.ctx.decodeAudioData(arrayBuffer);

            console.log("✅ MP3 LOADED SUCCESSFULLY");
        } catch (e) {
            console.warn("⚠️ MP3 LOAD FAILED:", e);
        }
    }

    // ---------------- PLAY MP3 ----------------
    private startBackgroundMusic() {
        if (!this.ctx || !this.bgBuffer || this.isPlayingBackground || this.ctx.state !== "running") return;

        console.log("🎵 STARTING BACKGROUND MUSIC");
        this.isPlayingBackground = true;

        this.bgSource = this.ctx.createBufferSource();
        this.bgSource.buffer = this.bgBuffer;
        this.bgSource.loop = true;

        const gain = this.ctx.createGain();
        gain.gain.value = 0.35;

        this.bgSource.connect(gain);
        gain.connect(this.masterGain!);

        this.bgSource.start(0);
    }

    stopBackgroundMusic() {
        this.isPlayingBackground = false;
        if (this.bgSource) {
            try {
                this.bgSource.stop();
                this.bgSource.disconnect();
            } catch { }
            this.bgSource = null;
        }
    }

    // ---------------- DRONE ----------------
    private startHealthDrone() {
        if (!this.ctx || !this.masterGain || this.healthDrone) return;

        this.healthDrone = this.ctx.createOscillator();
        this.healthGain = this.ctx.createGain();

        this.healthDrone.type = "sawtooth";
        this.healthDrone.frequency.value = 40;
        this.healthGain.gain.value = 0.03; // Even subtler foundation

        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 150; // Darker filter

        this.healthDrone.connect(this.healthGain);
        this.healthGain.connect(filter);
        filter.connect(this.masterGain);

        this.healthDrone.start();
    }

    updateNetworkStats(participation: number) {
        if (!this.healthDrone || !this.healthGain || !this.ctx) return;

        const t = this.ctx.currentTime;
        if (participation < 0.66) {
            this.healthDrone.detune.linearRampToValueAtTime(
                (0.66 - participation) * 500,
                t + 0.1
            );
            this.healthGain.gain.linearRampToValueAtTime(0.08, t + 0.1);
        } else {
            this.healthDrone.detune.linearRampToValueAtTime(0, t + 0.1);
            this.healthGain.gain.linearRampToValueAtTime(0.03, t + 0.1);
        }
    }

    // ---------------- PIANO ----------------
    private playPianoNote(freq: number, volume = 0.1, duration = 1) {
        if (!this.ctx || !this.masterGain || this.ctx.state !== "running") return;
        const now = this.ctx.currentTime;

        // Optimization: Reduce harmonics from 5 to 3 for performance
        const harmonics = [1, 2, 3];
        harmonics.forEach((h, i) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();

            osc.type = "sine";
            osc.frequency.value = freq * h;

            gain.gain.setValueAtTime(volume / (i + 1), now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            osc.connect(gain);
            gain.connect(this.masterGain!);

            osc.start(now);
            osc.stop(now + duration + 0.1);
        });
    }

    // ---------------- STOP ALL ----------------
    stopAll() {
        console.log("🎹 AUDIO SYSTEM SUSPENDING...");
        this.stopBackgroundMusic();

        if (this.healthDrone) {
            try {
                this.healthDrone.stop();
                this.healthDrone.disconnect();
            } catch { }
            this.healthDrone = null;
        }

        this.ctx?.suspend().then(() => {
            console.log("✅ AUDIO CONTEXT SUSPENDED");
        });
    }

    playBlockFinalized(isFastPath: boolean) {
        if (!this.ctx || !this.masterGain || this.ctx.state !== "running") return;

        // 🛡️ PERFORMANCE SHIELD: Throttle pings to 100ms cooldown
        const now = Date.now();
        if (now - this.lastPingTime < 100) return;
        this.lastPingTime = now;

        if (isFastPath) {
            const note = this.pianoScale[Math.floor(Math.random() * this.pianoScale.length)];
            this.playPianoNote(note * 2, 0.12, 0.6);
        } else {
            this.playPianoNote(98.00, 0.08, 1.5);
        }
    }

    setVolume(v: number) {
        if (this.masterGain) this.masterGain.gain.value = v;
    }
}
