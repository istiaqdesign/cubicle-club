export const LEVELS = [
  { min: 0, title: 'Intern' },
  { min: 10, title: 'Junior' },
  { min: 25, title: 'Senior' },
  { min: 50, title: 'Lead' },
  { min: 100, title: 'Legend' },
] as const;

export function levelIndex(done: number) {
  let index = 0;
  LEVELS.forEach((level, i) => {
    if (done >= level.min) index = i;
  });
  return index;
}

export const levelTitle = (done: number) => LEVELS[levelIndex(done)].title;

/** 0–1 progress towards the next level (1 at max level). */
export function levelProgress(done: number) {
  const i = levelIndex(done);
  const next = LEVELS[i + 1];
  if (!next) return 1;
  return (done - LEVELS[i].min) / (next.min - LEVELS[i].min);
}

export const nextLevelAt = (done: number) => LEVELS[levelIndex(done) + 1]?.min;

export type PinGlyph = 'star' | 'moon' | 'shield' | 'bolt' | 'heart' | 'flame';

export interface AchievementDef {
  id: string;
  name: string;
  blurb: string;
  color: string;
  glyph: PinGlyph;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'century', name: 'Century Club', blurb: 'Finished 100 tasks', color: '#F2A516', glyph: 'star' },
  { id: 'night_shift', name: 'Night Shift', blurb: 'Shipped something after midnight', color: '#5B5FC7', glyph: 'moon' },
  { id: 'zero_error', name: 'Zero-Error Day', blurb: '8 tasks today without a single bug', color: '#2FB585', glyph: 'shield' },
  { id: 'speed_demon', name: 'Speed Demon', blurb: 'Finished a task in under 15 office minutes', color: '#F2545B', glyph: 'bolt' },
  { id: 'comeback_kid', name: 'Comeback Kid', blurb: 'Hit a bug, fixed it, finished anyway', color: '#FF8A3D', glyph: 'heart' },
  { id: 'hot_streak', name: 'Hot Streak', blurb: '5 tasks in a row without an error', color: '#E8559A', glyph: 'flame' },
];

export const achievementById: Record<string, AchievementDef> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
