import { create } from 'zustand';
import type { RoleId } from '../core/types';

// Role colors live in CSS variables (styles/tokens.css) so themes can swap them.
export const ROLES: Record<RoleId, { label: string; color: string; dark: string }> = {
  manager: { label: 'Manager', color: 'var(--role-manager)', dark: 'var(--role-manager-dark)' },
  researcher: { label: 'Researcher', color: 'var(--role-researcher)', dark: 'var(--role-researcher-dark)' },
  writer: { label: 'Writer', color: 'var(--role-writer)', dark: 'var(--role-writer-dark)' },
  coder: { label: 'Coder', color: 'var(--role-coder)', dark: 'var(--role-coder-dark)' },
  designer: { label: 'Designer', color: 'var(--role-designer)', dark: 'var(--role-designer-dark)' },
};

export type HairStyle = 'bun' | 'messy' | 'bob' | 'beanie' | 'wavy' | 'short';
export type Accessory = 'glasses' | 'headphones' | 'pencil' | 'beret' | 'tie' | 'none';
export type DeskItem = 'plant' | 'books' | 'lamp' | 'cactus' | 'pens';
export type Outfit = 'tee' | 'hoodie' | 'blazer' | 'stripes' | 'overalls';

export interface Look {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  accessory: Accessory;
  deskItem: DeskItem;
  outfit?: Outfit;
}

// Options for the dressing room.
export const SKIN_TONES = ['#FBE0C8', '#F6D2B4', '#E3A97F', '#C58A64', '#9A6446', '#6E4630'];
export const HAIR_COLORS = ['#1F1A1E', '#3A2A22', '#5B3A29', '#C9A15A', '#E2775A', '#B24A6E', '#5A6BD8', '#E8E2D8'];
export const HAIR_STYLES: HairStyle[] = ['short', 'messy', 'bob', 'wavy', 'bun', 'beanie'];
export const ACCESSORIES: Accessory[] = ['none', 'glasses', 'headphones', 'pencil', 'beret', 'tie'];
export const DESK_ITEMS: DeskItem[] = ['plant', 'books', 'lamp', 'cactus', 'pens'];
export const OUTFITS: Outfit[] = ['tee', 'hoodie', 'blazer', 'stripes', 'overalls'];

const LOOKS: Record<string, Look> = {
  pip: { skin: '#F6D2B4', hair: '#5B3A29', hairStyle: 'messy', accessory: 'glasses', deskItem: 'books' },
  juno: { skin: '#E3A97F', hair: '#2F2430', hairStyle: 'bob', accessory: 'pencil', deskItem: 'plant' },
  mochi: { skin: '#FBE0C8', hair: '#E2775A', hairStyle: 'wavy', accessory: 'beret', deskItem: 'cactus' },
  byte: { skin: '#9A6446', hair: '#1F1A1E', hairStyle: 'beanie', accessory: 'headphones', deskItem: 'lamp' },
  nova: { skin: '#C58A64', hair: '#3A2A22', hairStyle: 'bun', accessory: 'tie', deskItem: 'pens' },
};

const SKINS = ['#F6D2B4', '#E3A97F', '#C58A64', '#9A6446', '#FBE0C8'];
const HAIRS = ['#3A2A22', '#5B3A29', '#1F1A1E', '#E2775A', '#C9A15A'];
const STYLES: HairStyle[] = ['short', 'messy', 'bob', 'wavy', 'bun'];
const ITEMS: DeskItem[] = ['plant', 'books', 'lamp', 'cactus', 'pens'];

/** Known demo agents get a hand-picked look; anyone else gets a stable random one. */
export function baseLook(agentId: string): Look {
  if (LOOKS[agentId]) return LOOKS[agentId];
  let h = 0;
  for (const ch of agentId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return {
    skin: SKINS[h % SKINS.length],
    hair: HAIRS[(h >> 3) % HAIRS.length],
    hairStyle: STYLES[(h >> 6) % STYLES.length],
    accessory: 'none',
    deskItem: ITEMS[(h >> 9) % ITEMS.length],
  };
}

// Dressing-room changes, kept on this device.

const LOOKS_KEY = 'cubicle-club:looks';

function loadOverrides(): Record<string, Partial<Look>> {
  try {
    return JSON.parse(localStorage.getItem(LOOKS_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export const useLooks = create<{ overrides: Record<string, Partial<Look>> }>(() => ({ overrides: loadOverrides() }));

useLooks.subscribe((s) => {
  try {
    localStorage.setItem(LOOKS_KEY, JSON.stringify(s.overrides));
  } catch {
    /* ignore */
  }
});

/** An agent's current look: their base look plus anything changed in the dressing room. */
export function lookFor(agentId: string): Look {
  return { ...baseLook(agentId), ...useLooks.getState().overrides[agentId] };
}

/** Same as lookFor, but re-renders when the look changes. */
export function useLook(agentId: string): Look {
  const override = useLooks((s) => s.overrides[agentId]);
  return { ...baseLook(agentId), ...override };
}

export function updateLook(agentId: string, patch: Partial<Look>) {
  useLooks.setState((s) => ({ overrides: { ...s.overrides, [agentId]: { ...s.overrides[agentId], ...patch } } }));
}

export function resetLook(agentId: string) {
  useLooks.setState((s) => {
    const overrides = { ...s.overrides };
    delete overrides[agentId];
    return { overrides };
  });
}
