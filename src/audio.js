const VOICES = {
  launch: [{ f0: 300, f1: 900, type: 'square', dur: 0.18, when: 0 }],
  impact: [{ f0: 180, f1: 60, type: 'square', dur: 0.12, when: 0 }],
  pigDie: [{ f0: 600, f1: 200, type: 'sawtooth', dur: 0.25, when: 0 }],
  win: [
    { f0: 523, f1: 523, type: 'triangle', dur: 0.12, when: 0 },
    { f0: 659, f1: 659, type: 'triangle', dur: 0.12, when: 0.13 },
    { f0: 784, f1: 784, type: 'triangle', dur: 0.2, when: 0.26 },
  ],
  lose: [
    { f0: 392, f1: 330, type: 'triangle', dur: 0.2, when: 0 },
    { f0: 311, f1: 262, type: 'triangle', dur: 0.3, when: 0.2 },
  ],
};

export function createSfx() {
  let muted = false;
  let ctx = null;

  function ensureCtx() {
    if (ctx) return ctx;
    const Ctor = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    return ctx;
  }

  function play(name) {
    if (muted) return;
    const voice = VOICES[name];
    if (!voice) return;
    const audio = ensureCtx();
    if (!audio) return;
    const start = audio.currentTime;
    for (const { f0, f1, type, dur, when } of voice) {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f0, start + when);
      osc.frequency.linearRampToValueAtTime(f1, start + when + dur);
      gain.gain.setValueAtTime(0.15, start + when);
      gain.gain.exponentialRampToValueAtTime(0.001, start + when + dur);
      osc.connect(gain).connect(audio.destination);
      osc.start(start + when);
      osc.stop(start + when + dur + 0.02);
    }
  }

  return {
    play,
    setMuted(b) {
      muted = Boolean(b);
    },
    isMuted() {
      return muted;
    },
  };
}
