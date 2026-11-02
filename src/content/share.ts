import type { RoleId } from '../core/types';

// Words for the shareable extras: trading cards, The Daily Agent, comics.
// Placeholders work like speech lines: {name} {count} {n} {task} {tool}.

export const fill = (text: string, vars: Record<string, string | number>) => text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
export const pickOne = <T,>(xs: readonly T[], seed = Math.random()) => xs[Math.floor(seed * xs.length) % xs.length];

// --- trading cards ------------------------------------------------------------------

export const RARITIES = [
  { id: 'common', label: 'Common', gems: 1, color: '#C9B8A6', deep: '#8C7A6A' },
  { id: 'uncommon', label: 'Uncommon', gems: 2, color: '#3CCB9A', deep: '#1F9C72' },
  { id: 'rare', label: 'Rare', gems: 3, color: '#52B8FF', deep: '#2A8FD6' },
  { id: 'epic', label: 'Epic', gems: 4, color: '#A88BFF', deep: '#7D5FE0' },
  { id: 'legendary', label: 'Legendary', gems: 5, color: '#FFC53D', deep: '#D99A12' },
] as const;

/** Rarity follows the level ladder: Intern = Common … Legend = Legendary. */
export const rarityFor = (levelIdx: number) => RARITIES[Math.min(levelIdx, RARITIES.length - 1)];

export const SPECIAL_MOVES: Record<RoleId, { name: string; text: string }[]> = {
  manager: [
    { name: 'Calendar Tetris', text: 'Fits {n} meetings into one afternoon. Nobody knows how.' },
    { name: 'Quick Sync', text: 'Turns any 5-minute question into a 45-minute call.' },
    { name: 'Delegation Station', text: 'Hands out {count} tasks before the coffee is ready.' },
  ],
  researcher: [
    { name: 'Tab Hoarder', text: 'Opens {n} browser tabs at once. Closes zero.' },
    { name: 'Rabbit Hole', text: 'Goes looking for one fact. Returns with {n}.' },
    { name: 'Source, Please', text: 'Fact-checks the fact-checkers. Twice.' },
  ],
  writer: [
    { name: 'Draft Zero', text: 'Rewrites the first line {n} times. The fourth was best.' },
    { name: 'Hook, Line & Sinker', text: 'Writes a headline so good people read the second sentence.' },
    { name: 'Em Dash Storm', text: 'Deploys punctuation with no mercy.' },
  ],
  coder: [
    { name: 'Works On My Machine', text: 'Ships with confidence. Mostly justified.' },
    { name: 'Bug Whisperer', text: 'Squashes {n} bugs. Names each one first.' },
    { name: 'Merge Conflict', text: 'Fights the repo. Wins on points.' },
  ],
  designer: [
    { name: 'Move It 2px Left', text: 'Spots a misaligned pixel from across the office.' },
    { name: 'Moodboard Mania', text: 'Collects {n} references for one button.' },
    { name: 'Final_v{n}', text: 'Every file is final. Some are more final than others.' },
  ],
};

export const STAT_NAMES = ['Hustle', 'Focus', 'Teamwork', 'Charm'] as const;

// --- The Daily Agent ------------------------------------------------------------------

export interface NewsFacts {
  top: string;
  topCount: number;
  done: number;
  errors: number;
  fixed: number;
  handoffs: number;
  approvals: number;
  hours: string;
  team: number;
}

/** Headlines, each with a test for when it fits the day. First matching one wins (after a shuffle). */
export const HEADLINES: { when: (f: NewsFacts) => boolean; text: string; deck: string }[] = [
  { when: (f) => f.topCount >= 5, text: '{top} Ships {topCount} Tasks, Refuses to Elaborate', deck: 'Colleagues describe the performance as "frankly a bit much".' },
  { when: (f) => f.topCount >= 3, text: '{top} Named Employee of the Day; Trophy Already on Desk', deck: 'Sources say the speech "went on for a while".' },
  { when: (f) => f.errors >= 3, text: 'Office Survives {errors} Bugs; Coffee Machine Unharmed', deck: 'Engineers credit "turning it off and on again".' },
  { when: (f) => f.fixed >= 2, text: '{fixed} Bugs Squashed Before Lunch, Exterminator Sent Home', deck: 'The bugs could not be reached for comment.' },
  { when: (f) => f.handoffs >= 5, text: 'Folder Spotted Changing Hands {handoffs} Times', deck: 'Paper trail experts call it "a lot of walking".' },
  { when: (f) => f.approvals >= 2, text: 'Boss Stamps {approvals} Things, Wrist Holding Up', deck: 'The rubber stamp is said to be "in good spirits".' },
  { when: (f) => f.done === 0, text: 'Quiet Day at the Office. Suspiciously Quiet.', deck: 'Witnesses report "mostly napping and one paper plane".' },
  { when: () => true, text: 'Team Logs {hours} Hours, Demands Better Snacks', deck: 'Management "will look into it".' },
  { when: () => true, text: '{done} Tasks Done as Office Hums Along', deck: 'Nobody cried. Well, almost nobody.' },
];

export const WEATHER: { max: number; icon: 'sun' | 'partly' | 'rain' | 'storm'; text: string }[] = [
  { max: 0, icon: 'sun', text: 'Sunny all day. Zero bugs on the radar.' },
  { max: 2, icon: 'partly', text: 'Mostly sunny with scattered bugs.' },
  { max: 4, icon: 'rain', text: 'Showers of error messages. Bring an umbrella.' },
  { max: Infinity, icon: 'storm', text: 'Bug storm warning. Stay near the coffee.' },
];

export const CLASSIFIEDS = [
  'WANTED: one more hour in the day. Will trade {n} browser tabs.',
  'FOUND: stapler near the coffee machine. Answers to "Swingline-ish".',
  'FOR SALE: slightly used desk plant. Has seen things.',
  'LOST: the will to write another intro. Reward: snacks.',
  'MISSED CONNECTION: you passed me a folder at 10am. Was it… for me?',
  'SEEKING: a meeting that could NOT have been an email.',
  'FREE TO GOOD HOME: {n} unread emails. Mostly newsletters.',
  'NOTICE: whoever keeps throwing paper planes, nice fold.',
];

export const HOROSCOPES: Record<RoleId, string[]> = {
  manager: ['A meeting will be moved. Then moved again.', 'Your calendar has opinions today. Listen.'],
  researcher: ['A tab you closed last week holds the answer.', 'Trust the third source, not the first.'],
  writer: ['Your best line is hiding in the draft you deleted.', 'An em dash brings luck today.'],
  coder: ['Mercury is in retrograde. Do not deploy on Friday.', 'The bug is in the last place you look.'],
  designer: ['Something is 2px off. You already know where.', 'A bold color choice pays off.'],
};

// --- comics ------------------------------------------------------------------------

export const COMIC_CAPTIONS = {
  open: ['{time}. Another day at Cubicle Club.', '{time}. The office hums to life.', 'Meanwhile, at {time}…'],
  trouble: ['Then, disaster struck.', 'Things were going so well.', 'Uh-oh.'],
  handoff: ['Teamwork makes the dream work.', 'A folder changes hands.', 'Special delivery!'],
  gossip: ['Over at the coffee machine…', 'Meanwhile, by the coffee…'],
  boss: ['Time to see the boss.', 'The moment of truth.'],
  payoff: ['And then…', 'Victory!', 'Later that day…'],
};

export const TITLES = ['Office Hours', 'Just Another Tuesday', 'The Folder', 'Ship It', 'Bug Hunt', 'Coffee Break', 'Big Stamp Energy'];
