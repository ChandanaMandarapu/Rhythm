// 🎹 RHYTHM GENERATIVE PIANO: "Gymnopédie Mode"
// Procedurally generates a classical-style minimalist background loop
export class AlpenglowAudio {
    private audioContext: AudioContext;
    private masterGain: GainNode;
    private pianoScale = [196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 392.00, 440.00]; // G Major / Pentatonic mix
    private isPlayingBackground = false;
    private loopTimeout: any = null;

    constructor() {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.3;
        this.masterGain.connect(this.audioContext.destination);
    }

    async resume() {
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        this.startBackgroundMusic();
    }

    // --- PIANO SYNTHESIS ENGINE ---
    private playPianoNote(freq: number, volume = 0.1, duration = 1.0) {
        const now = this.audioContext.currentTime;

        // Additive harmonics for piano timbre
        const harmonics = [1, 2, 3.01, 4, 5, 6];
        const weights = [1, 0.4, 0.2, 0.1, 0.05, 0.02];

        harmonics.forEach((h, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq * h, now);

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(volume * weights[i], now + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration / h);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now);
            osc.stop(now + duration + 0.5);
        });
    }

    // --- GENERATIVE CLASSICAL ENGINE ---
    private startBackgroundMusic() {
        if (this.isPlayingBackground) return;
        this.isPlayingBackground = true;
        this.runMusicLoop(0);
    }

    stopBackgroundMusic() {
        this.isPlayingBackground = false;
        if (this.loopTimeout) clearTimeout(this.loopTimeout);
    }

    private runMusicLoop(step: number) {
        if (!this.isPlayingBackground) return;

        // Classical Progression (Gmaj7 -> Cmaj7 -> Am7 -> D7)
        const progressions = [
            [196.00, 246.94, 293.66, 370.00], // Gmaj7
            [261.63, 329.63, 392.00, 493.88], // Cmaj7
            [220.00, 261.63, 329.63, 392.00], // Am7
            [146.83, 220.00, 293.66, 349.23]  // D7
        ];

        const chordIdx = Math.floor(step / 4) % progressions.length;
        const subStep = step % 4;

        // Play chord notes (Arpeggiated)
        if (subStep === 0) {
            progressions[chordIdx].forEach((f, i) => {
                setTimeout(() => this.playPianoNote(f, 0.05, 3.0), i * 150);
            });
        }

        // Play subtle random melody (Classical vibe)
        if (Math.random() > 0.4) {
            const melodyNote = this.pianoScale[Math.floor(Math.random() * this.pianoScale.length)];
            this.playPianoNote(melodyNote * 2, 0.03, 1.5);
        }

        // Schedule next beat (very slow, 1.5s per beat - like Satie)
        this.loopTimeout = setTimeout(() => this.runMusicLoop(step + 1), 1500);
    }

    // Fast Path: Bright accent note (harmonizes with current scale)
    playFastPath() {
        const note = this.pianoScale[Math.floor(Math.random() * this.pianoScale.length)];
        this.playPianoNote(note * 2, 0.08, 0.8);
    }

    playSlowPath() {
        this.playPianoNote(98.00, 0.05, 2.0); // Low G
    }

    playBlockFinalized(isFastPath: boolean) {
        if (isFastPath) this.playFastPath();
        else this.playSlowPath();
    }

    setVolume(volume: number) {
        this.masterGain.gain.value = volume;
    }
}
