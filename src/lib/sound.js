/**
 * Lightweight "new order" chime using the Web Audio API — no asset file.
 * Browsers suspend AudioContext until a user gesture; we lazily create and
 * resume it. If the browser still blocks it, we fail silently (the realtime
 * update + visual highlight remain the primary notification).
 */
let ctx = null;

function getCtx() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!ctx) ctx = new AudioCtx();
  return ctx;
}

// Unlock the audio context on the first user interaction (admins click tabs).
if (typeof window !== 'undefined') {
  const unlock = () => {
    const c = getCtx();
    if (c && c.state === 'suspended') c.resume().catch(() => {});
  };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
}

export function playChime() {
  try {
    const c = getCtx();
    if (!c) return;
    if (c.state === 'suspended') c.resume().catch(() => {});
    const now = c.currentTime;
    // Two short ascending tones.
    [880, 1174].forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * 0.16;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.15);
      osc.connect(gain).connect(c.destination);
      osc.start(start);
      osc.stop(start + 0.16);
    });
  } catch {
    /* ignore — audio is best-effort */
  }
}
