import type { RoleId } from '../core/types';
import { activeAgents, formatClock, office, type AgentState } from '../core/store';
import { levelIndex, levelTitle } from '../core/progression';
import { FUNNY_CATEGORIES, line, type LineCategory } from '../content/lines';
import { ROLES } from '../content/roster';
import {
  CLASSIFIEDS,
  COMIC_CAPTIONS,
  HEADLINES,
  HOROSCOPES,
  SPECIAL_MOVES,
  STAT_NAMES,
  TITLES,
  WEATHER,
  fill,
  pickOne,
  rarityFor,
  type NewsFacts,
} from '../content/share';
import type { ArmPose, Expression } from '../scene/AgentSprite';
import type { Prop } from '../scene/sceneStore';

// Turns today's office data into the content of each shareable.

const clamp = (n: number) => Math.max(5, Math.min(99, Math.round(n)));
const rand = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

function topAgent() {
  const s = office.get();
  return activeAgents(s).sort((a, b) => s.agents[b].doneToday - s.agents[a].doneToday || s.agents[b].lifetimeDone - s.agents[a].lifetimeDone)[0];
}

/** A random line someone actually said today, preferring the funny ones. */
function spokenLine(filter: (category: string, agentId: string) => boolean = () => true) {
  const said = office.get().spoken.filter((l) => filter(l.category, l.agentId));
  const funny = said.filter((l) => FUNNY_CATEGORIES.includes(l.category as LineCategory));
  const pool = funny.length ? funny : said;
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : undefined;
}

// --- trading card ----------------------------------------------------------------------

export interface CardData {
  id: string;
  name: string;
  role: RoleId;
  title: string;
  rarity: ReturnType<typeof rarityFor>;
  number: number;
  total: number;
  day: number;
  stats: { name: string; value: number }[];
  power: number;
  move: { name: string; text: string };
  quote: string;
  pins: string[];
  lifetimeDone: number;
}

export function buildCard(agentId: string): CardData {
  const s = office.get();
  const a: AgentState = s.agents[agentId];
  const team = activeAgents(s);
  const charm = 40 + (hash(agentId) % 45) + a.achievements.length * 3;
  const values = [
    clamp(22 + a.doneToday * 9 + a.streak * 5 + a.lifetimeDone / 8),
    clamp(94 - a.errorsToday * 14 + a.fixedToday * 4),
    clamp(30 + a.handoffsToday * 11),
    clamp(charm),
  ];
  const move = pickOne(SPECIAL_MOVES[a.info.role]);
  const said = spokenLine((_, id) => id === agentId);
  return {
    id: agentId,
    name: a.info.name,
    role: a.info.role,
    title: levelTitle(a.lifetimeDone),
    rarity: rarityFor(levelIndex(a.lifetimeDone)),
    number: a.slot + 1,
    total: Math.max(team.length, a.slot + 1),
    day: s.day,
    stats: STAT_NAMES.map((name, i) => ({ name, value: values[i] })),
    power: Math.round(values.reduce((x, y) => x + y, 0) / values.length),
    move: { name: fill(move.name, { n: rand(2, 9) }), text: fill(move.text, { n: rand(7, 47), count: Math.max(3, a.doneToday) }) },
    quote: said?.text ?? line('idle', { n: rand(2, 9) }),
    pins: a.achievements,
    lifetimeDone: a.lifetimeDone,
  };
}

// --- The Daily Agent ---------------------------------------------------------------------

export interface NewsData {
  day: number;
  date: string;
  headline: string;
  deck: string;
  photo?: { id: string; role: RoleId; caption: string };
  gossip: { text: string; by: string }[];
  market: { id: string; name: string; role: RoleId; value: number; up: boolean }[];
  weather: (typeof WEATHER)[number];
  classifieds: string[];
  horoscope: { role: string; text: string };
  quote: { text: string; by: string };
  bossStamps: number;
}

export function buildNews(): NewsData {
  const s = office.get();
  const team = activeAgents(s);
  const top = topAgent();
  const topA = top ? s.agents[top] : undefined;
  const facts: NewsFacts = {
    top: topA?.info.name ?? 'The Team',
    topCount: topA?.doneToday ?? 0,
    done: s.stats.done,
    errors: s.stats.errors,
    fixed: s.stats.fixed,
    handoffs: s.stats.handoffs,
    approvals: s.stats.approved + s.stats.rejected,
    hours: (s.stats.workedMinutes / 60).toFixed(1),
    team: team.length,
  };
  // Pick from the two most fitting headlines so it changes on shuffle.
  const fitting = HEADLINES.filter((h) => h.when(facts));
  const head = pickOne(fitting.slice(0, 2));

  const gossipSaid = s.spoken.filter((l) => l.category === 'gossip_open' || l.category === 'gossip_reply');
  const gossip = gossipSaid.length
    ? gossipSaid.slice(-2).map((l) => ({ text: l.text, by: s.agents[l.agentId]?.info.name ?? 'Someone' }))
    : [{ text: line('gossip_open', { name: facts.top, count: Math.max(2, facts.topCount), tool: 'the printer' }), by: 'A source close to the coffee machine' }];

  const quote = spokenLine();
  const horoRole = pickOne(team.length ? team : ['coder']);
  const horoRoleId: RoleId = s.agents[horoRole]?.info.role ?? 'coder';
  const n = rand(12, 60);

  return {
    day: s.day,
    date: new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    headline: fill(head.text, facts as unknown as Record<string, string | number>),
    deck: head.deck,
    photo: topA
      ? { id: topA.info.id, role: topA.info.role, caption: `${topA.info.name} (${levelTitle(topA.lifetimeDone)} ${ROLES[topA.info.role].label}) celebrates task number ${topA.doneToday || 1} of the day.` }
      : undefined,
    gossip,
    market: team.map((id) => {
      const a = s.agents[id];
      return { id, name: a.info.name.toUpperCase(), role: a.info.role, value: a.doneToday, up: a.errorsToday === 0 || a.fixedToday >= a.errorsToday };
    }),
    weather: WEATHER.find((w) => facts.errors <= w.max) ?? WEATHER[0],
    classifieds: [...CLASSIFIEDS]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((c) => fill(c, { n })),
    horoscope: { role: ROLES[horoRoleId].label, text: pickOne(HOROSCOPES[horoRoleId]) },
    quote: quote ? { text: quote.text, by: s.agents[quote.agentId]?.info.name ?? 'Someone' } : { text: 'Rewrote the intro for the 4th time. Send snacks.', by: 'The whole team' },
    bossStamps: facts.approvals,
  };
}

// --- comic -----------------------------------------------------------------------------

export type ComicSet = 'desk' | 'coffee' | 'boss' | 'party';

export interface ComicActor {
  id: string;
  role: RoleId;
  arms: ArmPose;
  expression: Expression;
  prop?: Prop;
  says?: string;
  /** Face left instead of right. */
  flip?: boolean;
}

export interface ComicPanel {
  caption: string;
  set: ComicSet;
  actors: ComicActor[];
  fx?: 'rain' | 'confetti' | 'stamp-ok' | 'stamp-no' | 'sparkle';
}

export interface ComicData {
  title: string;
  day: number;
  panels: ComicPanel[];
}

export function buildComic(): ComicData {
  const s = office.get();
  const team = activeAgents(s);
  const anyone = () => pickOne(team);
  const role = (id: string) => s.agents[id].info.role;
  const name = (id: string) => s.agents[id].info.name;
  const taskOf = (id: string) => {
    const t = s.agents[id].taskId ? s.tasks[s.agents[id].taskId!] : undefined;
    return t?.title ?? 'the big project';
  };
  const toolOf = (id: string) => {
    const t = s.agents[id].taskId ? s.tasks[s.agents[id].taskId!] : undefined;
    return t?.meta.tool ?? 'Docs';
  };
  /** Something this agent really said in this category today, else a fresh line. */
  const said = (id: string, cats: LineCategory[], vars: Record<string, string | number> = {}) => {
    const real = s.spoken.filter((l) => l.agentId === id && cats.includes(l.category as LineCategory));
    return real.length ? real[real.length - 1 - Math.floor(Math.random() * Math.min(3, real.length))].text : line(pickOne(cats), vars);
  };
  const lastSpeaker = (cats: LineCategory[]) => {
    const real = s.spoken.filter((l) => cats.includes(l.category as LineCategory) && team.includes(l.agentId));
    return real.length ? real[real.length - 1 - Math.floor(Math.random() * Math.min(3, real.length))].agentId : undefined;
  };
  const vars = (id: string) => ({ task: taskOf(id), tool: toolOf(id), n: rand(3, 14), nth: `${rand(3, 9)}th`, to: name(anyone()), from: name(anyone()), count: rand(2, 9) });

  const panels: ComicPanel[] = [];

  // 1. Setting the scene.
  const hero = lastSpeaker(['started', 'progress']) ?? anyone();
  panels.push({
    caption: fill(pickOne(COMIC_CAPTIONS.open), { time: formatClock(Math.max(540, s.clock - 120)) }),
    set: 'desk',
    actors: [{ id: hero, role: role(hero), arms: 'type', expression: 'focus', says: said(hero, ['started', 'progress'], vars(hero)) }],
  });

  // 2. Trouble, teamwork or gossip.
  const errored = lastSpeaker(['error']);
  const sender = lastSpeaker(['handoff_send']);
  if (errored && Math.random() < 0.7) {
    panels.push({
      caption: pickOne(COMIC_CAPTIONS.trouble),
      set: 'desk',
      actors: [{ id: errored, role: role(errored), arms: 'rest', expression: 'sad', says: said(errored, ['error'], { tool: toolOf(errored), n: rand(400, 504) }) }],
      fx: 'rain',
    });
  } else if (sender && team.length > 1) {
    const to = pickOne(team.filter((id) => id !== sender));
    panels.push({
      caption: pickOne(COMIC_CAPTIONS.handoff),
      set: 'desk',
      actors: [
        { id: sender, role: role(sender), arms: 'hold', expression: 'joy', prop: 'folder', says: said(sender, ['handoff_send'], { ...vars(sender), to: name(to) }) },
        { id: to, role: role(to), arms: 'up', expression: 'joy', flip: true, says: line('handoff_receive', { from: name(sender), task: taskOf(sender) }) },
      ],
    });
  } else {
    const [a, b] = [...team].sort(() => Math.random() - 0.5);
    const subject = name(pickOne(team.filter((id) => id !== a && id !== b).concat(a)));
    panels.push({
      caption: pickOne(COMIC_CAPTIONS.gossip),
      set: 'coffee',
      actors: [
        { id: a, role: role(a), arms: 'mug', expression: 'smug', says: line('gossip_open', { name: subject, count: rand(3, 9), tool: 'the printer' }) },
        ...(b ? [{ id: b, role: role(b), arms: 'mug' as ArmPose, expression: 'joy' as Expression, flip: true, says: line('gossip_reply', { name: subject }) }] : []),
      ],
    });
  }

  // 3. The boss.
  const asker = lastSpeaker(['approval_ask', 'approval_wait']) ?? anyone();
  panels.push({
    caption: pickOne(COMIC_CAPTIONS.boss),
    set: 'boss',
    actors: [{ id: asker, role: role(asker), arms: 'hold', expression: 'neutral', prop: 'paper', says: said(asker, ['approval_ask', 'approval_wait']) }],
    fx: Math.random() < 0.75 ? 'stamp-ok' : 'stamp-no',
  });
  const approved = panels[2].fx === 'stamp-ok';

  // 4. The payoff.
  const winner = topAgent() ?? hero;
  if (approved) {
    panels.push({
      caption: pickOne(COMIC_CAPTIONS.payoff),
      set: 'party',
      actors: [
        { id: winner, role: role(winner), arms: 'up', expression: 'joy', prop: 'trophy', says: said(winner, ['done', 'speech', 'streak'], { task: taskOf(winner), count: rand(3, 9), n: rand(3, 6) }) },
        ...(asker !== winner ? [{ id: asker, role: role(asker), arms: 'clap' as ArmPose, expression: 'joy' as Expression, flip: true, says: line('cheer', { name: name(winner) }) }] : []),
      ],
      fx: 'confetti',
    });
  } else {
    panels.push({
      caption: 'Take two.',
      set: 'desk',
      actors: [{ id: asker, role: role(asker), arms: 'type', expression: 'tired', says: line('rejected') }],
      fx: 'sparkle',
    });
  }

  return { title: pickOne(TITLES), day: s.day, panels };
}
