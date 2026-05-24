let audioCtx: AudioContext | null = null;
let isMuted = false;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function toggleMute() {
  isMuted = !isMuted;
  return isMuted;
}

export function getMuted() {
  return isMuted;
}

export function playBeep(freq = 800, duration = 0.08, type: OscillatorType = 'sine') {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // AudioContext permission issue or not supported
  }
}

export function playSuccess() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const playNote = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + start);
      gainNode.gain.setValueAtTime(0.05, now + start);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + duration);
    };
    playNote(523.25, 0, 0.1); // C5
    playNote(659.25, 0.1, 0.1); // E5
    playNote(783.99, 0.2, 0.1); // G5
    playNote(1046.50, 0.3, 0.3); // C6
  } catch (e) {}
}

export function playWarning() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const playNote = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + start);
      gainNode.gain.setValueAtTime(0.03, now + start);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + duration);
    };
    playNote(300, 0, 0.15);
    playNote(260, 0.15, 0.3);
  } catch (e) {}
}

export function playTrainEngine() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.5);
    osc.frequency.setValueAtTime(120, now + 0.5);
    osc.frequency.exponentialRampToValueAtTime(80, now + 1.0);

    gainNode.gain.setValueAtTime(0.08, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    osc.stop(now + 1.2);
  } catch (e) {}
}
