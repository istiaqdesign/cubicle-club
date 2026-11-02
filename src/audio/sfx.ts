import { office } from '../core/store';

// Every sound is synthesized with Web Audio: no audio files, no licenses,
// nothing to download. Muted until the user turns sound on.

export type Sfx = 'ding' | 'swoosh' | 'stamp' | 'jingle' | 'uhoh' | 'pop' | 'typing' | 'sparkle' | 'fanfare' | 'applause' | 'versus' | 'meow' | 'woof' | 'purr';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export const unlockAudio = () => void ensure();

function tone(c: AudioContext, freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.3, freqEnd?: number) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(master!);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

function noise(c: AudioContext, start: number, dur: number, gain: number, freq: number, type: BiquadFilterType = 'bandpass', freqEnd?: number) {
  const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = type;
  filter.frequency.setValueAtTime(freq, start);
  if (freqEnd) filter.frequency.exponentialRampToValueAtTime(freqEnd, start + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(gain, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(filter).connect(g).connect(master!);
  src.start(start);
}

export function play(name: Sfx) {
  const { sound, volume } = office.get().settings;
  if (!sound) return;
  const c = ensure();
  if (!c || !master) return;
  master.gain.value = volume * 0.5;
  const t = c.currentTime + 0.01;

  switch (name) {
    case 'ding':
      tone(c, 1046, t, 0.5, 'sine', 0.25);
      tone(c, 1568, t + 0.09, 0.7, 'sine', 0.18);
      break;
    case 'pop':
      tone(c, 520, t, 0.12, 'sine', 0.22, 1100);
      break;
    case 'swoosh':
      noise(c, t, 0.35, 0.22, 700, 'bandpass', 3200);
      break;
    case 'stamp':
      tone(c, 150, t, 0.28, 'sine', 0.7, 42);
      noise(c, t, 0.09, 0.45, 1400, 'lowpass');
      break;
    case 'jingle':
      [523, 659, 784, 1046].forEach((f, i) => tone(c, f, t + i * 0.09, 0.28, 'triangle', 0.2));
      tone(c, 1318, t + 0.38, 0.55, 'triangle', 0.16);
      break;
    case 'uhoh':
      tone(c, 494, t, 0.18, 'square', 0.06);
      tone(c, 370, t + 0.2, 0.32, 'square', 0.06);
      break;
    case 'sparkle':
      [1318, 1760, 2093].forEach((f, i) => tone(c, f, t + i * 0.07, 0.35, 'sine', 0.1));
      break;
    case 'fanfare':
      [392, 392, 523, 659].forEach((f, i) => tone(c, f, t + i * 0.14, 0.22, 'sawtooth', 0.07));
      [523, 659, 784].forEach((f) => tone(c, f, t + 0.62, 0.9, 'triangle', 0.14));
      tone(c, 1046, t + 0.62, 0.9, 'sine', 0.08);
      break;
    case 'applause':
      for (let i = 0; i < 46; i++) noise(c, t + Math.random() * 1.6, 0.03, 0.07 * (1 - i / 60), 1100 + Math.random() * 1800, 'bandpass');
      break;
    case 'versus':
      tone(c, 196, t, 0.16, 'square', 0.07);
      tone(c, 185, t + 0.18, 0.16, 'square', 0.07);
      noise(c, t + 0.36, 0.25, 0.25, 900, 'bandpass', 200);
      tone(c, 98, t + 0.36, 0.4, 'sawtooth', 0.08, 60);
      break;
    case 'meow':
      tone(c, 620, t, 0.18, 'triangle', 0.12, 900);
      tone(c, 900, t + 0.17, 0.3, 'triangle', 0.1, 520);
      break;
    case 'woof':
      tone(c, 240, t, 0.09, 'square', 0.08, 170);
      tone(c, 230, t + 0.15, 0.11, 'square', 0.08, 150);
      break;
    case 'purr':
      for (let i = 0; i < 12; i++) noise(c, t + i * 0.06, 0.05, 0.06, 140, 'lowpass');
      break;
    case 'typing': {
      const clicks = 3 + Math.floor(Math.random() * 4);
      for (let i = 0; i < clicks; i++) noise(c, t + i * 0.075 + Math.random() * 0.02, 0.025, 0.05, 2800 + Math.random() * 1600, 'highpass');
      break;
    }
  }
}
