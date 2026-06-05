type Tone = 'chime' | 'beep' | 'bell' | 'silent';

function getCtx(): AudioContext | null {
  try { return new (window.AudioContext || (window as any).webkitAudioContext)(); } catch { return null; }
}

function chime(ac: AudioContext, vol: number) {
  [880, 1108.73].forEach((freq, i) => {
    const osc = ac.createOscillator(), g = ac.createGain();
    osc.connect(g); g.connect(ac.destination);
    osc.type = 'sine'; osc.frequency.value = freq;
    const t = ac.currentTime + i * 0.18;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.start(t); osc.stop(t + 0.5);
  });
}

function beep(ac: AudioContext, vol: number) {
  const osc = ac.createOscillator(), g = ac.createGain();
  osc.connect(g); g.connect(ac.destination);
  osc.type = 'square'; osc.frequency.value = 880;
  const t = ac.currentTime;
  g.gain.setValueAtTime(vol * 0.3, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  osc.start(t); osc.stop(t + 0.15);
}

function bell(ac: AudioContext, vol: number) {
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    const osc = ac.createOscillator(), g = ac.createGain();
    osc.connect(g); g.connect(ac.destination);
    osc.type = 'triangle'; osc.frequency.value = freq;
    const t = ac.currentTime + i * 0.05;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol * 0.6, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    osc.start(t); osc.stop(t + 0.8);
  });
}

function _play(tone: Tone, vol = 0.4) {
  if (tone === 'silent') return;
  const ac = getCtx(); if (!ac) return;
  try {
    if (tone === 'chime') chime(ac, vol);
    else if (tone === 'beep') beep(ac, vol);
    else if (tone === 'bell') bell(ac, vol);
  } catch { /* ignore */ }
}

export function useNotifSound() {
  function play(tone?: Tone) {
    if (localStorage.getItem('notif_sound_enabled') === 'false') return;
    _play((tone ?? localStorage.getItem('notif_sound_tone') ?? 'chime') as Tone);
  }
  function preview(tone: Tone) { _play(tone); }
  return { play, preview };
}
