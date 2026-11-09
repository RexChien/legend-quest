// ==========================================
// Tone.js 復古奇幻晶片音樂合成器 (Chiptune RPG BGM)
// ==========================================
import * as Tone from 'tone';

type BgmTrack = 'lobby' | 'battle' | 'boss' | 'victory';

let isMusicPlaying = false;
let currentTrack: BgmTrack | null = null;
let currentLoop: Tone.Loop | null = null;
let synth: Tone.PolySynth | null = null;
let bassSynth: Tone.MonoSynth | null = null;
let noiseSynth: Tone.NoiseSynth | null = null;
let volumeNode: Tone.Volume | null = null;

function ensureSynths() {
  if (synth) return;

  volumeNode = new Tone.Volume(-14).toDestination();

  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.4 },
  }).connect(volumeNode);

  bassSynth = new Tone.MonoSynth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.03, decay: 0.15, sustain: 0.4, release: 0.3 },
    filterEnvelope: { attack: 0.02, decay: 0.2, sustain: 0.2, release: 0.2, baseFrequency: 80, octaves: 2.5 },
  }).connect(volumeNode);

  noiseSynth = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.005, decay: 0.08, sustain: 0 },
  }).connect(volumeNode);
}

// 旋律小節與樂句 (Patterns)
const TRACKS = {
  lobby: {
    bpm: 96,
    melody: ['E4', 'G4', 'B4', 'A4', 'G4', 'E4', 'D4', 'E4', 'A4', 'B4', 'C5', 'B4', 'A4', 'G4', 'F#4', 'E4'],
    bass: ['E2', 'E2', 'C2', 'C2', 'A2', 'A2', 'B2', 'B2'],
  },
  battle: {
    bpm: 128,
    melody: ['A4', 'C5', 'E5', 'D5', 'C5', 'A4', 'G4', 'A4', 'D5', 'F5', 'A5', 'G5', 'F5', 'D5', 'E5', 'E5'],
    bass: ['A2', 'A2', 'F2', 'F2', 'D2', 'D2', 'E2', 'G2'],
  },
  boss: {
    bpm: 148, // 殘血或 Boss 激戰高速 BPM
    melody: ['D4', 'F4', 'G#4', 'A4', 'D5', 'C5', 'A4', 'F4', 'D#4', 'G4', 'A#4', 'C5', 'A#4', 'A4', 'G4', 'F4'],
    bass: ['D2', 'D2', 'D#2', 'D#2', 'C2', 'C2', 'A#1', 'A1'],
  },
  victory: {
    bpm: 116,
    melody: ['C4', 'E4', 'G4', 'C5', 'G4', 'C5', 'E5', 'G5', 'E5', 'C5', 'G4', 'E4', 'C4', 'D4', 'E4', 'C4'],
    bass: ['C2', 'G2', 'C2', 'G2'],
  },
};

export const MusicManager = {
  async init() {
    await Tone.start();
    ensureSynths();
  },

  async play(track: BgmTrack) {
    try {
      await Tone.start();
      ensureSynths();

      if (currentTrack === track && isMusicPlaying) return;

      currentTrack = track;
      this.stop();

      const config = TRACKS[track];
      Tone.getTransport().bpm.value = config.bpm;

      let step = 0;
      currentLoop = new Tone.Loop((time) => {
        const melNote = config.melody[step % config.melody.length];
        const bassNote = config.bass[Math.floor(step / 2) % config.bass.length];

        if (synth && melNote) {
          synth.triggerAttackRelease(melNote, '8n', time, 0.4);
        }
        if (bassSynth && bassNote && step % 2 === 0) {
          bassSynth.triggerAttackRelease(bassNote, '4n', time, 0.35);
        }
        // 鼓點打擊
        if (noiseSynth && (track === 'battle' || track === 'boss')) {
          if (step % 4 === 2) {
            noiseSynth.triggerAttackRelease('16n', time, 0.2);
          }
        }
        step++;
      }, '8n').start(0);

      Tone.getTransport().start();
      isMusicPlaying = true;
    } catch (e) {
      console.warn('Tone.js play error:', e);
    }
  },

  // 戰況告急時動態加速 20%
  setBossCrisisMode(isCrisis: boolean) {
    if (!isMusicPlaying || !currentTrack) return;
    const baseBpm = TRACKS[currentTrack].bpm;
    Tone.getTransport().bpm.rampTo(isCrisis ? baseBpm * 1.2 : baseBpm, 1);
  },

  stop() {
    if (currentLoop) {
      currentLoop.stop();
      currentLoop.dispose();
      currentLoop = null;
    }
    Tone.getTransport().stop();
    isMusicPlaying = false;
  },

  toggle(track: BgmTrack = 'battle') {
    if (isMusicPlaying) {
      this.stop();
      return false;
    } else {
      this.play(track);
      return true;
    }
  },

  get isPlaying() {
    return isMusicPlaying;
  },

  setVolume(decibels: number) {
    if (volumeNode) {
      volumeNode.volume.value = decibels;
    }
  },
};
