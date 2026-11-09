// ==========================================
// ZzFX 程序化打擊音效模組 (Procedural Sound Synthesizer)
// ==========================================

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * ZzFX micro procedural sound engine (Keith Clark / Frank Force)
 * Zero latency, zero external assets
 */
function playZzfxSound(
  volume = 1,
  randomness = 0.05,
  frequency = 220,
  attack = 0,
  sustain = 0,
  release = 0.1,
  shape = 0,
  _shapeCurve = 1,
  slide = 0,
  deltaSlide = 0,
  pitchJump = 0,
  pitchJumpTime = 0,
  _repeatTime = 0,
  noise = 0,
  _modulation = 0,
  _bitCrush = 0,
  delay = 0,
  sustainVolume = 1,
  decay = 0,
  _tremolo = 0
) {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const sampleRate = ctx.sampleRate;
    const startFrequency = frequency * (1 + (Math.random() * 2 - 1) * randomness);
    const length = (attack + sustain + decay + release + delay) * sampleRate;
    if (length <= 0) return;

    const buffer = ctx.createBuffer(1, Math.ceil(length), sampleRate);
    const data = buffer.getChannelData(0);

    let period = sampleRate / startFrequency;
    let phase = 0;
    let frequencySlide = (slide * sampleRate) / 500;
    let currentFreq = startFrequency;

    for (let i = 0; i < length; i++) {
      const time = i / sampleRate;

      // Pitch jumps
      if (pitchJumpTime > 0 && time >= pitchJumpTime) {
        currentFreq += pitchJump;
        pitchJumpTime = 0;
      }

      // Frequency slide
      currentFreq += frequencySlide;
      frequencySlide += (deltaSlide * sampleRate) / 50000;
      currentFreq = Math.max(10, currentFreq);
      period = sampleRate / currentFreq;

      // Envelope
      let env = 0;
      if (time < attack) {
        env = time / attack;
      } else if (time < attack + decay) {
        env = 1 - ((time - attack) / decay) * (1 - sustainVolume);
      } else if (time < attack + decay + sustain) {
        env = sustainVolume;
      } else if (time < attack + decay + sustain + release) {
        env = sustainVolume * (1 - (time - attack - decay - sustain) / release);
      }

      // Wave shape
      phase += 1 / period;
      let sample = 0;
      const modPhase = phase % 1;

      if (shape === 0) {
        // Sine
        sample = Math.sin(modPhase * Math.PI * 2);
      } else if (shape === 1) {
        // Triangle
        sample = 1 - Math.abs((modPhase - 0.5) * 4);
      } else if (shape === 2) {
        // Sawtooth
        sample = modPhase < 0.5 ? 2 * modPhase : 2 * modPhase - 2;
      } else if (shape === 3) {
        // Square
        sample = modPhase < 0.5 ? 1 : -1;
      } else {
        // Noise
        sample = Math.random() * 2 - 1;
      }

      // Noise blend
      if (noise > 0) {
        sample = sample * (1 - noise) + (Math.random() * 2 - 1) * noise;
      }

      data[i] = sample * env * volume * 0.4;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  } catch (err) {
    console.warn('SFX error:', err);
  }
}

export const SoundManager = {
  get enabled() {
    return soundEnabled;
  },
  set enabled(val: boolean) {
    soundEnabled = val;
  },

  // 按鈕點擊 (輕脆木質/晶片感)
  playClick() {
    playZzfxSound(0.4, 0.05, 480, 0.01, 0.03, 0.04, 3, 1, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0.8, 0.02);
  },

  // 揮刀 / 普通斬擊
  playAttack() {
    playZzfxSound(0.6, 0.1, 320, 0.01, 0.08, 0.15, 2, 1, -8, -1, 0, 0, 0, 0.2, 0, 0, 0, 0.6, 0.05);
  },

  // 狂戰士 / 暴擊破甲 (震撼重擊)
  playCriticalHit() {
    playZzfxSound(0.9, 0.1, 180, 0.01, 0.15, 0.25, 3, 1.5, -12, -2, 50, 0.04, 0, 0.4, 0, 0, 0, 0.9, 0.08);
  },

  // 怪物受擊 / 抖動
  playMonsterHit() {
    playZzfxSound(0.7, 0.15, 150, 0.02, 0.05, 0.18, 0, 1, -6, 0, 0, 0, 0, 0.3, 0, 0, 0, 0.8, 0.04);
  },

  // 聖光治癒 / 復活
  playHeal() {
    playZzfxSound(0.6, 0.05, 520, 0.05, 0.2, 0.35, 0, 1, 6, 2, 80, 0.08, 0, 0, 0, 0, 0, 0.9, 0.1);
  },

  // 聖盾 / 嘲諷加防
  playShield() {
    playZzfxSound(0.7, 0.05, 260, 0.03, 0.18, 0.22, 1, 1.2, 2, 0, -30, 0.05, 0, 0.1, 0, 0, 0, 0.8, 0.05);
  },

  // 連攜發動 (金色音階)
  playCombo() {
    playZzfxSound(0.8, 0.02, 660, 0.02, 0.12, 0.28, 3, 1, 8, 4, 120, 0.06, 0, 0, 0, 0, 0, 1, 0.05);
  },

  // 成就解鎖 / 開獎號角 (Fanfare)
  playAchievement() {
    setTimeout(() => playZzfxSound(0.8, 0.02, 523, 0.02, 0.1, 0.15, 1), 0);
    setTimeout(() => playZzfxSound(0.8, 0.02, 659, 0.02, 0.1, 0.15, 1), 120);
    setTimeout(() => playZzfxSound(0.9, 0.02, 783, 0.02, 0.2, 0.35, 1), 240);
  },

  // 獲取稀有戰利品 / 裝備
  playLoot() {
    setTimeout(() => playZzfxSound(0.7, 0.02, 440, 0.02, 0.08, 0.12, 0), 0);
    setTimeout(() => playZzfxSound(0.8, 0.02, 880, 0.02, 0.15, 0.25, 0), 100);
  },

  // 隊友倒地
  playDowned() {
    playZzfxSound(0.8, 0.05, 140, 0.03, 0.2, 0.4, 2, 1, -15, -4, 0, 0, 0, 0.3, 0, 0, 0, 0.5, 0.1);
  },

  // 滅團戰敗
  playDefeat() {
    playZzfxSound(0.7, 0.05, 110, 0.05, 0.4, 0.6, 2, 1, -20, -5, 0, 0, 0, 0.4, 0, 0, 0, 0.4, 0.2);
  }
};
