import { create } from 'zustand';
import type { OfficeEvent } from '../core/types';
import { activeAgents, office, pushToast, setUi } from '../core/store';
import { play } from '../audio/sfx';
import { seatPoint, type Pt } from '../scene/layout';
import { useScene } from '../scene/sceneStore';
import { PET_STAGES, feedPet, usePet } from './petStore';

// What the office pet does on screen: wander, nap on the rug, follow people,
// hide when something breaks, get the zoomies when the team is on a streak.

export type PetMode = 'stand' | 'walk' | 'sleep' | 'happy' | 'hide';

interface PetScene {
  x: number;
  y: number;
  dur: number;
  facing: 1 | -1;
  mode: PetMode;
  zoomies: boolean;
  hearts: number;
  jump: number;
  sound?: { text: string; key: number };
}

export const usePetScene = create<PetScene>(() => ({ x: 640, y: 700, dur: 0, facing: -1, mode: 'sleep', zoomies: false, hearts: 0, jump: 0 }));
const set = usePetScene.setState;

// Places the pet likes to hang out (feet position).
const SPOTS: Pt[] = [
  { x: 90, y: 482 },
  { x: 210, y: 488 },
  { x: 330, y: 480 },
  { x: 620, y: 486 },
  { x: 700, y: 480 },
  { x: 860, y: 488 },
  { x: 110, y: 682 },
  { x: 200, y: 702 },
  { x: 500, y: 704 },
  { x: 820, y: 640 },
  { x: 1214, y: 430 },
  { x: 160, y: 352 },
  { x: 1190, y: 706 },
];
const NAP: Pt = { x: 500, y: 706 };
const HIDE: Pt = { x: 1236, y: 300 };
// Gaps between the desks the pet uses to get from the back of the room to the front.
const LANES = [60, 500, 872];
const FRONT_Y = 560;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];
const chance = (p: number) => Math.random() < p;
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** Straight there, unless it means walking through the front row of desks. */
function route(from: Pt, to: Pt): Pt[] {
  const fromBack = from.y < FRONT_Y;
  if (fromBack === to.y < FRONT_Y) return [to];
  const mid = (from.x + to.x) / 2;
  const lane = LANES.reduce((best, x) => (Math.abs(x - mid) < Math.abs(best - mid) ? x : best));
  const back = { x: lane, y: 490 };
  const front = { x: lane, y: 640 };
  return fromBack ? [back, front, to] : [front, back, to];
}

let busy = false;

async function walkTo(to: Pt, fast = false) {
  const pts = route(usePetScene.getState(), to);
  set({ mode: 'walk' });
  for (const p of pts) {
    const { x, y } = usePetScene.getState();
    const dist = Math.hypot(p.x - x, p.y - y);
    if (dist < 2) continue;
    const speed = (fast ? 0.42 : 0.13) * Math.sqrt(office.get().settings.speed);
    const dur = reducedMotion() ? 0 : Math.round(dist / speed);
    set({ x: p.x, y: p.y, dur, facing: p.x < x - 1 ? -1 : p.x > x + 1 ? 1 : usePetScene.getState().facing });
    await sleep(reducedMotion() ? 150 : dur);
  }
  set({ mode: 'stand' });
}

function speak(text: string, ms = 1800) {
  const key = Date.now();
  set({ sound: { text, key } });
  setTimeout(() => usePetScene.getState().sound?.key === key && set({ sound: undefined }), ms);
}

const sayHi = () => speak(usePet.getState().species === 'cat' ? pick(['mrrp?', 'meow', 'prrr…', 'mew!']) : pick(['woof!', 'arf', 'borf?', '*wag wag*']));
const noise = () => play(usePet.getState().species === 'cat' ? 'meow' : 'woof');

/** One decision every few seconds. */
async function think() {
  if (busy || document.hidden) return;
  busy = true;
  try {
    const s = office.get();
    const team = activeAgents(s);
    const scared = team.some((id) => s.agents[id].status === 'error');
    const zoomies = !s.settings.focus && team.some((id) => s.agents[id].streak >= 4);
    const me = usePetScene.getState();
    if (zoomies !== me.zoomies) set({ zoomies });

    if (scared) {
      if (me.mode !== 'hide') {
        await walkTo(HIDE, true);
        set({ mode: 'hide', facing: -1 });
      }
      return;
    }
    if (me.mode === 'hide') set({ mode: 'stand' });

    if (zoomies) {
      for (let i = 0; i < 3; i++) await walkTo(pick(SPOTS), true);
      set({ jump: Date.now() });
      return;
    }

    const r = Math.random();
    // Focus mode = a sleepy pet.
    if (s.settings.focus ? r < 0.8 : r < 0.18) {
      if (me.mode !== 'sleep') {
        await walkTo(NAP);
        set({ mode: 'sleep' });
      }
    } else if (r < 0.62) {
      await walkTo(pick(SPOTS));
      if (chance(0.25)) sayHi();
    } else if (r < 0.85 && team.length) {
      // Go and keep someone company.
      const seated = team.filter((id) => useScene.getState().agents[id]?.seated);
      const friend = pick(seated.length ? seated : team);
      if (friend) {
        const seat = seatPoint(s.agents[friend].slot);
        await walkTo({ x: seat.x + (seat.y < FRONT_Y ? -70 : 90), y: seat.y < FRONT_Y ? 486 : 700 });
        set({ facing: seat.x > usePetScene.getState().x ? 1 : -1 });
        if (chance(0.4)) sayHi();
      }
    } else if (me.mode !== 'sleep') {
      set({ mode: 'stand' });
    }
  } finally {
    busy = false;
  }
}

let started = false;

export function startPet() {
  if (started) return;
  started = true;
  setInterval(() => void think(), 4200);
}

/** Petting: hearts, a happy noise and a little xp. */
let lastPet = 0;
export function petThePet() {
  set({ hearts: Date.now(), mode: 'happy', jump: Date.now() });
  noise();
  if (usePet.getState().species === 'cat') setTimeout(() => play('purr'), 300);
  sayHi();
  if (Date.now() - lastPet > 8000) {
    lastPet = Date.now();
    grow(1);
  }
  setTimeout(() => usePetScene.getState().mode === 'happy' && set({ mode: 'stand' }), 1600);
  setUi({ pet: true, profileAgentId: undefined });
}

function grow(amount: number) {
  const stage = feedPet(amount);
  if (stage == null) return;
  const { name, species } = usePet.getState();
  const title = PET_STAGES[stage].title;
  set({ jump: Date.now(), hearts: Date.now() });
  play('jingle');
  speak(species === 'cat' ? 'MEOW!' : 'WOOF!', 2400);
  pushToast({ kind: 'memo', title: `${name} grew up!`, body: `The office ${species} is now ${title}.` });
}

/** Called for every office event, after the scene has handled it. */
export function petOnEvent(e: OfficeEvent) {
  if (e.replay) return;
  if (e.type === 'task.done') {
    const streak = office.get().agents[e.agentId]?.streak ?? 0;
    grow(streak >= 3 ? 2 : 1);
    // Celebrates if close by.
    const a = useScene.getState().agents[e.agentId];
    const me = usePetScene.getState();
    if (a && Math.hypot(a.x - me.x, a.y - me.y) < 320 && me.mode !== 'sleep') {
      set({ jump: Date.now() });
      if (chance(0.4)) sayHi();
    }
  }
  if (e.type === 'task.error' && usePetScene.getState().mode !== 'hide') {
    speak('!!', 1200);
    set({ jump: Date.now() });
  }
}
