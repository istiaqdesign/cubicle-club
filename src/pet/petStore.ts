import { create } from 'zustand';

// The office pet. It lives on this device (localStorage), so it keeps growing
// across visits: every finished task feeds it, streaks feed it double.

export type Species = 'cat' | 'pup';

export interface PetSave {
  species: Species;
  name: string;
  xp: number;
}

export const PET_STAGES = [
  { min: 0, title: 'Tiny', scale: 0.72 },
  { min: 15, title: 'Little', scale: 0.86 },
  { min: 40, title: 'Big', scale: 1 },
  { min: 90, title: 'Chonky', scale: 1.14 },
] as const;

export function petStage(xp: number) {
  let i = 0;
  PET_STAGES.forEach((s, j) => {
    if (xp >= s.min) i = j;
  });
  return i;
}

export const DEFAULT_NAMES: Record<Species, string> = { cat: 'Biscuit', pup: 'Waffles' };
export const SPECIES_LABEL: Record<Species, string> = { cat: 'cat', pup: 'pup' };

const KEY = 'cubicle-club:pet';

function load(): PetSave {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { species: 'cat', name: DEFAULT_NAMES.cat, xp: 0, ...JSON.parse(raw) };
  } catch {
    /* storage blocked: start fresh */
  }
  return { species: 'cat', name: DEFAULT_NAMES.cat, xp: 0 };
}

export const usePet = create<PetSave>(load);

usePet.subscribe((state) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
});

export function setSpecies(species: Species) {
  usePet.setState((s) => ({ species, name: s.name === DEFAULT_NAMES[s.species] ? DEFAULT_NAMES[species] : s.name }));
}

export const renamePet = (name: string) => usePet.setState({ name: name.slice(0, 16) });

/** Returns the new stage index if the pet just grew. */
export function feedPet(amount: number): number | null {
  const before = petStage(usePet.getState().xp);
  usePet.setState((s) => ({ xp: s.xp + amount }));
  const after = petStage(usePet.getState().xp);
  return after > before ? after : null;
}
