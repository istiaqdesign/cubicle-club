import { create } from 'zustand';
import type { Pt } from './layout';

export type IdleAnim = 'none' | 'coffee' | 'stretch' | 'nap' | 'spin' | 'phone' | 'juggle' | 'music' | 'plane';
export type Prop = 'none' | 'folder' | 'paper' | 'mug' | 'trophy' | 'box';

/** Where each character is and what it is doing on screen. */
export interface SceneAgent {
  slot: number;
  x: number;
  y: number;
  z: number;
  /** Duration of the current move, in ms (0 = jump there). */
  dur: number;
  facing: 1 | -1;
  walking: boolean;
  seated: boolean;
  prop: Prop;
  idle: IdleAnim;
  /** Crowd pose during group moments. */
  pose?: 'clap';
  tired: boolean;
  rain: boolean;
  react?: 'joy' | 'sad';
  bubble?: { text: string; key: number };
  /** Timestamps used as React keys to replay one-shot animations. */
  confetti: number;
  jump: number;
  ribbon?: { text: string; key: number };
  /** Big round sticker over the head (performance review grade). */
  sticker?: { text: string; tone: StickerTone; key: number };
}

export type StickerTone = 'gold' | 'good' | 'ok' | 'bad';
export type BannerTone = 'gold' | 'mint' | 'lilac' | 'coral';

export interface Rivalry {
  a: string;
  b: string;
  scoreA: number;
  scoreB: number;
  target: number;
  key: number;
  /** The two are squaring up in the aisle right now. */
  stare: boolean;
}

export interface PaperPlane {
  key: number;
  from: Pt;
  to: Pt;
}

interface SceneState {
  agents: Record<string, SceneAgent>;
  planes: PaperPlane[];
  /** Big ribbon banner across the top of the room. */
  banner?: { key: number; kicker: string; title: string; tone: BannerTone };
  /** Podium and spotlight for the award ceremony. */
  ceremony?: { key: number; live: boolean };
  /** Confetti raining over the whole room. */
  shower?: number;
  cake?: boolean;
  /** Welcome balloons tied to this desk slot. */
  balloons?: number;
  rivalry?: Rivalry;
}

export const useScene = create<SceneState>(() => ({ agents: {}, planes: [] }));

export function patchScene(id: string, patch: Partial<SceneAgent>) {
  useScene.setState((s) => (s.agents[id] ? { agents: { ...s.agents, [id]: { ...s.agents[id], ...patch } } } : s));
}

export function addSceneAgent(id: string, agent: SceneAgent) {
  useScene.setState((s) => ({ agents: { ...s.agents, [id]: agent } }));
}

export function removeSceneAgent(id: string) {
  useScene.setState((s) => {
    const agents = { ...s.agents };
    delete agents[id];
    return { agents };
  });
}
