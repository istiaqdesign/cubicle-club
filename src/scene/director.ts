import type { OfficeEvent } from '../core/types';
import type { Moment } from '../core/engine';
import { activeAgents, office, pushToast, removeAgent, nextId } from '../core/store';
import { line, ordinal, type LineCategory } from '../content/lines';
import { play } from '../audio/sfx';
import {
  accessPath,
  aisleLoc,
  coffeeLoc,
  seatPoint,
  seatZ,
  BOSS_QUEUE,
  CROWD_SPOTS,
  DOOR,
  FACE_OFF,
  PODIUM,
  type Loc,
  type Pt,
} from './layout';
import {
  addSceneAgent,
  patchScene as patch,
  removeSceneAgent,
  useScene,
  type BannerTone,
  type IdleAnim,
  type Prop,
  type SceneAgent,
  type StickerTone,
} from './sceneStore';

// The director turns data events into little performances: walking folders
// across the room, speech bubbles, confetti, office gossip. Each agent has its
// own queue so one character never tries to be in two places at once.

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const rand = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];
const chance = (p: number) => Math.random() < p;
const shuffled = <T,>(xs: T[]) => [...xs].sort(() => Math.random() - 0.5);
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

const queues = new Map<string, Promise<void>>();
const queued = new Map<string, number>();
const locs = new Map<string, Loc>();
const approvalWaiters = new Map<string, (approved: boolean) => void>();
const earlyAnswers = new Map<string, boolean>();
const lastChatter = new Map<string, number>();
let bubbleKey = 0;

function enqueue(id: string, job: () => Promise<void>) {
  queued.set(id, (queued.get(id) ?? 0) + 1);
  const next = (queues.get(id) ?? Promise.resolve())
    .then(job)
    .catch((err) => console.error('[director]', err))
    .finally(() => queued.set(id, (queued.get(id) ?? 1) - 1));
  queues.set(id, next);
}

/** Free = sitting at their desk with nothing queued. */
const isFree = (id: string) => (queued.get(id) ?? 0) === 0 && !!useScene.getState().agents[id]?.seated;

/** Resolves once `count` parties have arrived, or after a timeout. */
function barrier(count: number, timeoutMs: number) {
  let arrived = 0;
  let release!: () => void;
  const done = new Promise<void>((r) => (release = r));
  const timer = setTimeout(release, timeoutMs);
  return {
    done,
    arrive() {
      if (++arrived >= count) {
        clearTimeout(timer);
        release();
      }
      return done;
    },
  };
}

const slotOf = (id: string) => office.get().agents[id]?.slot ?? 0;
const agentName = (id: string) => office.get().agents[id]?.info.name ?? id;
const toolOf = (taskId?: string) => (taskId && office.get().tasks[taskId]?.meta.tool) || 'the printer';
function shortTitle(taskId: string) {
  const t = office.get().tasks[taskId]?.title ?? 'this';
  return t.length > 30 ? `${t.slice(0, 28)}…` : t;
}

// --- speech --------------------------------------------------------------------

function say(id: string, category: LineCategory, vars: Record<string, string | number> = {}, opts: { important?: boolean; ms?: number } = {}) {
  if (office.get().settings.focus && !opts.important) return;
  const agents = useScene.getState().agents;
  if (!agents[id]) return;
  const visible = Object.values(agents).filter((a) => a.bubble).length;
  if (!opts.important && visible >= 3) return;

  const text = line(category, vars);
  const key = ++bubbleKey;
  patch(id, { bubble: { text, key } });
  office.set((s) => ({ spoken: [...s.spoken.slice(-120), { agentId: id, text, category, ts: Date.now() }] }));
  setTimeout(() => {
    if (useScene.getState().agents[id]?.bubble?.key === key) patch(id, { bubble: undefined });
  }, opts.ms ?? 4200);
}

// --- movement ------------------------------------------------------------------

async function walk(id: string, points: Pt[]) {
  const speed = office.get().settings.speed;
  const reduced = reducedMotion();
  patch(id, { seated: false, walking: true, idle: 'none' });
  for (const p of points) {
    const a = useScene.getState().agents[id];
    if (!a) return;
    const dist = Math.hypot(p.x - a.x, p.y - a.y);
    if (dist < 1) continue;
    const dur = reduced ? 0 : Math.round(dist / (0.24 * Math.sqrt(speed)));
    const facing = p.x < a.x - 1 ? -1 : p.x > a.x + 1 ? 1 : a.facing;
    patch(id, { x: p.x, y: p.y, dur, facing, z: Math.round(Math.max(a.y, p.y)) + 1 });
    await sleep(reduced ? 200 : dur);
  }
  patch(id, { walking: false });
}

async function goTo(id: string, to: Loc) {
  const from = locs.get(id) ?? { kind: 'seat', slot: slotOf(id) };
  locs.set(id, to);
  await walk(id, [...accessPath(from).reverse().slice(1), ...accessPath(to)]);
}

function sit(id: string) {
  const slot = slotOf(id);
  locs.set(id, { kind: 'seat', slot });
  patch(id, { ...seatPoint(slot), dur: 0, z: seatZ(slot), seated: true, walking: false, facing: 1 });
}

async function goHome(id: string) {
  await goTo(id, { kind: 'seat', slot: slotOf(id) });
  sit(id);
}

function freeBossSpot() {
  const used = new Set([...locs.values()].flatMap((l) => (l.kind === 'boss' ? [l.q] : [])));
  for (let q = 0; q < BOSS_QUEUE.length; q++) if (!used.has(q)) return q;
  return BOSS_QUEUE.length - 1;
}

function waitForApproval(taskId: string) {
  if (earlyAnswers.has(taskId)) {
    const answer = earlyAnswers.get(taskId)!;
    earlyAnswers.delete(taskId);
    return Promise.resolve(answer);
  }
  return new Promise<boolean>((resolve) => approvalWaiters.set(taskId, resolve));
}

// --- event choreography -----------------------------------------------------------

function handoff(e: Extract<OfficeEvent, { type: 'task.handoff' }>) {
  const { fromId, toId, taskId } = e;
  const assigning = e.note === 'assigned';
  enqueue(fromId, async () => {
    const task = shortTitle(taskId);
    patch(fromId, { prop: 'folder' });
    play('swoosh');
    say(fromId, assigning ? 'assign' : 'handoff_send', { to: agentName(toId), task });
    await sleep(500);
    await goTo(fromId, { kind: 'visit', slot: slotOf(toId) });
    patch(fromId, { prop: 'none' });
    play('pop');
    if (useScene.getState().agents[toId]?.seated) {
      // High five!
      patch(toId, { jump: Date.now(), react: 'joy' });
      patch(fromId, { react: 'joy' });
      say(toId, 'handoff_receive', { from: agentName(fromId), task }, { important: true });
      setTimeout(() => {
        patch(toId, { react: undefined });
        patch(fromId, { react: undefined });
      }, 900);
    } else {
      say(fromId, 'left_on_desk', { to: agentName(toId) }, { important: true });
    }
    await sleep(1500);
    await goHome(fromId);
  });
}

function askForApproval(e: Extract<OfficeEvent, { type: 'task.needs_approval' }>) {
  const { agentId, taskId } = e;
  enqueue(agentId, async () => {
    patch(agentId, { prop: 'paper' });
    play('swoosh');
    say(agentId, 'approval_ask', {}, { important: true });
    await sleep(600);
    await goTo(agentId, { kind: 'boss', q: freeBossSpot() });
    patch(agentId, { facing: 1 });
    const nag = setInterval(() => say(agentId, 'approval_wait'), 13000);
    const approved = await waitForApproval(taskId);
    clearInterval(nag);
    patch(agentId, { react: approved ? 'joy' : 'sad', jump: approved ? Date.now() : 0 });
    say(agentId, approved ? 'approved' : 'rejected', {}, { important: true });
    await sleep(1800);
    patch(agentId, { prop: 'none', react: undefined });
    await goHome(agentId);
  });
}

const freshAgent = (slot: number): SceneAgent => ({
  slot,
  ...seatPoint(slot),
  z: seatZ(slot),
  dur: 0,
  facing: 1,
  walking: false,
  seated: true,
  prop: 'none',
  idle: 'none',
  tired: false,
  rain: false,
  confetti: 0,
  jump: 0,
});

export function handle(e: OfficeEvent, moments: Moment[]) {
  if (e.type === 'agent.joined') {
    const slot = slotOf(e.agent.id);
    if (e.replay) {
      locs.set(e.agent.id, { kind: 'seat', slot });
      addSceneAgent(e.agent.id, freshAgent(slot));
    } else {
      onboard(e.agent.id);
    }
    return;
  }
  if (e.replay) return;
  if (e.type === 'agent.left') {
    retire(e.agentId);
    return;
  }

  switch (e.type) {
    case 'task.started':
      if (chance(0.35)) say(e.agentId, 'started', { task: shortTitle(e.taskId), tool: toolOf(e.taskId) });
      break;
    case 'task.progress': {
      const last = lastChatter.get(e.agentId) ?? 0;
      if (Date.now() - last < 6000 || chance(0.45)) break;
      lastChatter.set(e.agentId, Date.now());
      const s = office.get();
      const task = s.tasks[e.taskId];
      const minutes = task?.startedMin != null ? s.clock + s.day * 1440 - task.startedMin : 0;
      if (useScene.getState().agents[e.agentId]?.tired && chance(0.6)) say(e.agentId, 'tired', { minutes, n: rand(3, 19) });
      else say(e.agentId, 'progress', { n: rand(3, 14), nth: ordinal(rand(3, 9)), tool: toolOf(e.taskId), task: shortTitle(e.taskId) });
      break;
    }
    case 'task.handoff':
      handoff(e);
      break;
    case 'task.needs_approval':
      askForApproval(e);
      break;
    case 'task.approval_resolved': {
      const waiter = approvalWaiters.get(e.taskId);
      if (waiter) {
        approvalWaiters.delete(e.taskId);
        waiter(e.approved);
      } else {
        earlyAnswers.set(e.taskId, e.approved);
      }
      break;
    }
    case 'task.error':
      patch(e.agentId, { rain: true });
      play('uhoh');
      say(e.agentId, 'error', { tool: toolOf(e.taskId), n: rand(400, 504) }, { important: true });
      break;
    case 'task.recovered':
      patch(e.agentId, { rain: false, react: 'joy' });
      play('pop');
      say(e.agentId, 'recovered', {}, { important: true });
      setTimeout(() => patch(e.agentId, { react: undefined }), 1500);
      break;
    case 'task.done': {
      const a = office.get().agents[e.agentId];
      patch(e.agentId, { confetti: Date.now(), jump: Date.now(), react: 'joy', rain: false });
      play('ding');
      say(e.agentId, 'done', { task: shortTitle(e.taskId), count: a?.doneToday ?? 1 });
      setTimeout(() => patch(e.agentId, { react: undefined }), 1800);
      if (a && a.streak >= 3 && chance(0.5)) setTimeout(() => say(e.agentId, 'streak', { n: a.streak }), 4800);
      scoreRivalry(e.agentId);
      break;
    }
    default:
      break;
  }

  for (const m of moments) {
    if (m.kind === 'levelup') {
      setTimeout(() => {
        const key = Date.now();
        patch(m.agentId, { ribbon: { text: `Level up · ${m.title}`, key } });
        play('jingle');
        say(m.agentId, 'level_up', { title: m.title }, { important: true });
        setTimeout(() => {
          if (useScene.getState().agents[m.agentId]?.ribbon?.key === key) patch(m.agentId, { ribbon: undefined });
        }, 3600);
      }, 1200);
    } else {
      setTimeout(() => play('sparkle'), 2600);
    }
  }
}

// --- office life: gossip, paper planes, ceremonies, parties, rivalries, reviews ----------

const name = agentName;

function feed(text: string, agentId?: string, tone: 'info' | 'good' | 'bad' | 'move' = 'info') {
  office.set((s) => ({ feed: [{ id: nextId('feed'), clock: s.clock, agentId, text, tone }, ...s.feed].slice(0, 60) }));
}

let bannerTimer: ReturnType<typeof setTimeout> | undefined;
function banner(kicker: string, title: string, tone: BannerTone, ms = 0) {
  clearTimeout(bannerTimer);
  const key = Date.now();
  useScene.setState({ banner: { key, kicker, title, tone } });
  if (ms) bannerTimer = setTimeout(() => clearBanner(key), ms);
  return key;
}
function clearBanner(key?: number) {
  useScene.setState((st) => (key == null || st.banner?.key === key ? { banner: undefined } : st));
}

let gossiping = false;

/** Two idle agents meet at the coffee machine and talk about a third. */
export function startGossip(force = false) {
  if (gossiping) return false;
  const s = office.get();
  const team = activeAgents(s);
  const candidates = team.filter((id) => isFree(id) && (force ? s.agents[id]?.status !== 'waiting' : s.agents[id]?.status === 'idle'));
  if (candidates.length < 2) return false;
  const [a, b] = shuffled(candidates);
  const others = team.filter((id) => id !== a && id !== b);
  const subject = others.length ? pick(others) : a;
  const subj = s.agents[subject];
  const vars = { name: subj.info.name, count: Math.max(2, subj.doneToday), tool: toolOf(subj.taskId) };

  gossiping = true;
  const meet = barrier(2, 15000);
  let talkDone!: () => void;
  const talked = new Promise<void>((r) => (talkDone = r));

  const attend = (id: string, spot: number) =>
    enqueue(id, async () => {
      await goTo(id, coffeeLoc(spot));
      patch(id, { facing: spot === 0 ? 1 : -1, prop: 'mug' });
      await meet.arrive();
      await talked;
      patch(id, { prop: 'none' });
      await sleep(300 * spot);
      await goHome(id);
    });

  attend(a, 0);
  attend(b, 1);

  void (async () => {
    await meet.done;
    play('pop');
    say(a, 'gossip_open', vars, { important: true, ms: 3000 });
    await sleep(3000);
    say(b, 'gossip_reply', vars, { important: true, ms: 2600 });
    await sleep(2700);
    say(a, 'gossip_open', vars, { important: true, ms: 3000 });
    await sleep(3000);
    say(b, 'gossip_reply', vars, { important: true, ms: 2400 });
    await sleep(2500);
    say(chance(0.5) ? a : b, 'gossip_close', {}, { important: true, ms: 2200 });
    await sleep(1600);
    talkDone();
    gossiping = false;
  })();
  return true;
}

let planeKey = 0;

function throwPlane(fromId: string) {
  const s = office.get();
  const targets = activeAgents(s).filter((id) => id !== fromId && useScene.getState().agents[id]?.seated);
  if (!targets.length) return;
  const toId = pick(targets);
  const from = seatPoint(slotOf(fromId));
  const to = seatPoint(slotOf(toId));
  const key = ++planeKey;
  useScene.setState((st) => ({ planes: [...st.planes, { key, from: { x: from.x, y: from.y - 130 }, to: { x: to.x, y: to.y - 120 } }] }));
  play('swoosh');
  setTimeout(() => {
    useScene.setState((st) => ({ planes: st.planes.filter((p) => p.key !== key) }));
    patch(toId, { jump: Date.now() });
    say(toId, 'plane_hit', {}, { important: true, ms: 2800 });
  }, 1600);
}

/**
 * Everyone gathers round one agent in the aisle. `show` runs once they have all
 * arrived; when it ends the crowd drifts back to their desks.
 */
function gathering(opts: { host: string; spot: Pt; guests: string[]; hostProp?: Prop; show: () => Promise<void>; hostExit?: () => Promise<void> }) {
  const { host, spot, guests } = opts;
  const gather = barrier(1 + guests.length, 12000);
  let over!: () => void;
  const finished = new Promise<void>((r) => (over = r));

  enqueue(host, async () => {
    await goTo(host, aisleLoc(spot));
    patch(host, { facing: 1, prop: opts.hostProp ?? 'none' });
    await gather.arrive();
    await finished;
    patch(host, { react: undefined });
    if (opts.hostExit) await opts.hostExit();
    else {
      patch(host, { prop: 'none' });
      await goHome(host);
    }
  });

  guests.forEach((id, i) => {
    const p = CROWD_SPOTS[i % CROWD_SPOTS.length];
    const at = { x: p.x + spot.x - PODIUM.x, y: p.y };
    enqueue(id, async () => {
      await goTo(id, aisleLoc(at));
      patch(id, { facing: at.x < spot.x ? 1 : -1 });
      await gather.arrive();
      patch(id, { pose: 'clap' });
      await finished;
      patch(id, { pose: undefined });
      await sleep(i * 250);
      await goHome(id);
    });
  });

  return (async () => {
    await gather.done;
    await opts.show();
    over();
  })();
}

let ceremonyRunning = false;
let lastCeremonyDay = 0;

/** Everyone gathers round while the day's top performer gets a trophy. */
export function startCeremony() {
  if (ceremonyRunning) return false;
  const s = office.get();
  // Whoever is waiting for the boss stays in line and misses the party.
  const ranked = activeAgents(s)
    .filter((id) => s.agents[id].status !== 'waiting')
    .sort((a, b) => s.agents[b].doneToday - s.agents[a].doneToday || s.agents[b].lifetimeDone - s.agents[a].lifetimeDone);
  const [winner, ...guests] = ranked;
  if (!winner) return false;
  const key = Date.now();

  ceremonyRunning = true;
  lastCeremonyDay = s.day;
  useScene.setState({ ceremony: { key, live: false } });
  const bannerKey = banner('Employee of the Day', s.agents[winner].info.name, 'gold');
  play('fanfare');

  void gathering({
    host: winner,
    spot: PODIUM,
    guests,
    hostProp: 'trophy',
    show: async () => {
      useScene.setState((st) => (st.ceremony ? { ceremony: { ...st.ceremony, live: true }, shower: Date.now() } : st));
      play('applause');
      patch(winner, { jump: Date.now(), react: 'joy', confetti: Date.now() });
      const cheerers = shuffled(guests).slice(0, 2);
      cheerers.forEach((id, i) => setTimeout(() => say(id, 'cheer', { name: name(winner) }, { important: true, ms: 2600 }), 300 + i * 900));
      await sleep(2600);
      patch(winner, { jump: Date.now() });
      say(winner, 'speech', { count: office.get().agents[winner]?.doneToday ?? 1 }, { important: true, ms: 3600 });
      await sleep(3800);
      play('applause');
      patch(winner, { jump: Date.now() });
      await sleep(1600);
      useScene.setState({ ceremony: undefined, shower: undefined });
      clearBanner(bannerKey);
      ceremonyRunning = false;
    },
  });
  return true;
}

/** Onboarding day: a new hire walks in, gets a welcome committee and finds their desk. */
function onboard(id: string) {
  const slot = slotOf(id);
  const newbie = name(id);
  locs.set(id, { kind: 'door' });
  addSceneAgent(id, { ...freshAgent(slot), ...DOOR, z: DOOR.y + 1, seated: false });
  useScene.setState({ balloons: slot });
  const bannerKey = banner('Onboarding day', `Welcome, ${newbie}!`, 'mint');
  play('fanfare');

  enqueue(id, async () => {
    await sleep(500);
    say(id, 'onboard_new', { name: newbie }, { important: true, ms: 3200 });
    await goTo(id, { kind: 'seat', slot });
    sit(id);
    patch(id, { jump: Date.now(), react: 'joy', confetti: Date.now() });
    play('ding');
    await sleep(1200);
    say(id, 'onboard_new', { name: newbie }, { important: true, ms: 3200 });
    await sleep(1600);
    patch(id, { react: undefined });
  });

  // The manager (if around) and one or two others come over to say hi.
  const s = office.get();
  const team = activeAgents(s).filter((x) => x !== id && s.agents[x].status !== 'waiting');
  const managers = team.filter((x) => s.agents[x].info.role === 'manager');
  const greeters = [...managers, ...shuffled(team.filter((x) => !managers.includes(x) && isFree(x)))].slice(0, 2);
  greeters.forEach((g, i) =>
    enqueue(g, async () => {
      await sleep(2200 + i * 900);
      await goTo(g, { kind: 'visit', slot });
      patch(g, { react: 'joy', jump: Date.now() });
      say(g, 'onboard_welcome', { name: newbie }, { important: true, ms: 3000 });
      await sleep(2600);
      patch(g, { react: undefined });
      await goHome(g);
    }),
  );

  setTimeout(() => {
    clearBanner(bannerKey);
    useScene.setState((st) => (st.balloons === slot ? { balloons: undefined } : st));
  }, 16000);
}

/** Retirement party: cake in the aisle, a farewell speech, then out the door with a box of desk stuff. */
function retire(id: string) {
  const s = office.get();
  const retiree = name(id);
  const count = s.agents[id]?.lifetimeDone ?? 0;
  const guests = activeAgents(s).filter((x) => x !== id && s.agents[x].status !== 'waiting');
  const spot = { x: 480, y: 452 };
  let bannerKey = 0;

  // Let any last handoffs finish before the party starts.
  enqueue(id, async () => {
    bannerKey = banner('Retirement party', `Happy retirement, ${retiree}!`, 'lilac');
    useScene.setState({ cake: true });
    play('fanfare');
  });

  void gathering({
    host: id,
    spot,
    guests,
    hostProp: 'box',
    show: async () => {
      useScene.setState({ shower: Date.now() });
      play('applause');
      shuffled(guests)
        .slice(0, 3)
        .forEach((g, i) => setTimeout(() => say(g, 'retire_farewell', { name: retiree }, { important: true, ms: 2800 }), 200 + i * 1300));
      await sleep(3200);
      patch(id, { jump: Date.now(), react: 'joy' });
      say(id, 'retire_speech', { count }, { important: true, ms: 3600 });
      await sleep(3800);
      play('applause');
      useScene.setState({ shower: undefined, cake: false });
    },
    hostExit: async () => {
      say(id, 'retire_speech', { count }, { important: true, ms: 2600 });
      await goTo(id, { kind: 'door' });
      clearBanner(bannerKey);
      removeAgent(id);
      removeSceneAgent(id);
      locs.delete(id);
      feed(`${retiree} has left the building. Their desk plant lives on.`, undefined, 'info');
    },
  });
}

// Rivalries: two agents race to finish the most tasks.

let rivalryTimer: ReturnType<typeof setTimeout> | undefined;

export function startRivalry(force = false) {
  if (useScene.getState().rivalry) return false;
  const s = office.get();
  const pool = activeAgents(s)
    .filter((id) => isFree(id) && s.agents[id].status !== 'waiting' && (force || s.agents[id].status === 'idle'))
    .sort((a, b) => s.agents[a].doneToday - s.agents[b].doneToday);
  if (pool.length < 2) return false;
  // The closest pair in today's score makes the best rivals.
  let best = 0;
  for (let i = 1; i < pool.length - 1; i++) {
    const gap = (j: number) => s.agents[pool[j + 1]].doneToday - s.agents[pool[j]].doneToday;
    if (gap(i) < gap(best) || (gap(i) === gap(best) && chance(0.5))) best = i;
  }
  const [a, b] = chance(0.5) ? [pool[best], pool[best + 1]] : [pool[best + 1], pool[best]];
  const target = 3;
  useScene.setState({ rivalry: { a, b, scoreA: 0, scoreB: 0, target, key: Date.now(), stare: false } });
  feed(`Rivalry! ${name(a)} vs ${name(b)}, first to ${target} tasks.`, a, 'move');

  const meet = barrier(2, 12000);
  let talkDone!: () => void;
  const talked = new Promise<void>((r) => (talkDone = r));
  [a, b].forEach((id, i) =>
    enqueue(id, async () => {
      await goTo(id, aisleLoc(FACE_OFF[i]));
      patch(id, { facing: i === 0 ? 1 : -1 });
      await meet.arrive();
      await talked;
      await goHome(id);
    }),
  );
  void (async () => {
    await meet.done;
    useScene.setState((st) => (st.rivalry ? { rivalry: { ...st.rivalry, stare: true } } : st));
    play('versus');
    say(a, 'rival_start', { name: name(b), n: target }, { important: true, ms: 2800 });
    await sleep(2800);
    say(b, 'rival_reply', { name: name(a) }, { important: true, ms: 2400 });
    await sleep(2400);
    useScene.setState((st) => (st.rivalry ? { rivalry: { ...st.rivalry, stare: false } } : st));
    talkDone();
  })();
  clearTimeout(rivalryTimer);
  rivalryTimer = setTimeout(() => endRivalry(), 180000);
  return true;
}

function scoreRivalry(agentId: string) {
  const r = useScene.getState().rivalry;
  if (!r || (agentId !== r.a && agentId !== r.b)) return;
  const next = agentId === r.a ? { ...r, scoreA: r.scoreA + 1 } : { ...r, scoreB: r.scoreB + 1 };
  useScene.setState({ rivalry: next });
  const mine = agentId === r.a ? next.scoreA : next.scoreB;
  const other = agentId === r.a ? r.b : r.a;
  if (mine >= r.target) {
    endRivalry(agentId);
    return;
  }
  setTimeout(() => say(agentId, 'rival_taunt', { n: mine, name: name(other) }, { important: true, ms: 2600 }), 2200);
  if (chance(0.5)) setTimeout(() => say(other, 'rival_reply', { name: name(agentId) }, { important: true, ms: 2200 }), 4600);
}

function endRivalry(winner?: string) {
  const r = useScene.getState().rivalry;
  clearTimeout(rivalryTimer);
  if (!r) return;
  if (!winner) {
    useScene.setState({ rivalry: undefined });
    feed(`${name(r.a)} and ${name(r.b)} call it a draw. For now.`);
    return;
  }
  const loser = winner === r.a ? r.b : r.a;
  const key = banner('Rivalry settled', `${name(winner)} wins!`, 'coral', 5000);
  play('fanfare');
  setTimeout(() => {
    patch(winner, { confetti: Date.now(), jump: Date.now(), react: 'joy' });
    say(winner, 'rival_win', { name: name(loser) }, { important: true, ms: 3000 });
  }, 2400);
  setTimeout(() => {
    patch(loser, { rain: true, react: 'sad' });
    say(loser, 'rival_lose', { name: name(winner) }, { important: true, ms: 3000 });
  }, 4200);
  setTimeout(() => {
    patch(winner, { react: undefined });
    patch(loser, { react: undefined, rain: office.get().agents[loser]?.status === 'error' });
    useScene.setState((st) => (st.rivalry?.key === r.key ? { rivalry: undefined } : st));
    clearBanner(key);
  }, 8000);
  feed(`${name(winner)} beat ${name(loser)} in a rivalry, ${Math.max(r.scoreA, r.scoreB) + 1} to ${Math.min(r.scoreA, r.scoreB)}.`, winner, 'good');
}

// Weekly performance review: everyone gets a grade sticker from the boss.

let reviewing = false;
let lastReviewDay = 0;

const GRADES: { min: number; grade: string; tone: StickerTone; cat: LineCategory }[] = [
  { min: 0.9, grade: 'A+', tone: 'gold', cat: 'review_great' },
  { min: 0.7, grade: 'A', tone: 'good', cat: 'review_great' },
  { min: 0.5, grade: 'B+', tone: 'good', cat: 'review_ok' },
  { min: 0.3, grade: 'B', tone: 'ok', cat: 'review_ok' },
  { min: -Infinity, grade: 'C', tone: 'bad', cat: 'review_bad' },
];

export function startReview() {
  if (reviewing) return false;
  const s = office.get();
  const team = activeAgents(s).filter((id) => s.agents[id].status !== 'waiting');
  if (!team.length) return false;
  reviewing = true;
  lastReviewDay = s.day;
  const score = (id: string) => s.agents[id].doneWeek - 1.5 * s.agents[id].errorsWeek;
  const top = Math.max(1, ...team.map(score));
  const nobodyWorked = team.every((id) => s.agents[id].doneWeek === 0);
  const results = team.map((id) => ({ id, ...(nobodyWorked ? GRADES[3] : GRADES.find((g) => score(id) / top >= g.min)!) }));
  const week = Math.max(1, Math.ceil(s.day / 7));
  const bannerKey = banner(`Week ${week}`, 'Performance reviews', 'lilac');
  play('fanfare');

  void (async () => {
    await sleep(1800);
    for (const r of results) {
      const key = Date.now();
      patch(r.id, { sticker: { text: r.grade, tone: r.tone, key }, jump: Date.now(), react: r.tone === 'bad' ? 'sad' : 'joy' });
      play('stamp');
      setTimeout(() => say(r.id, r.cat, {}, { important: true, ms: 2600 }), 500);
      if (r.tone === 'gold') patch(r.id, { confetti: Date.now() });
      setTimeout(() => {
        if (useScene.getState().agents[r.id]?.sticker?.key === key) patch(r.id, { sticker: undefined });
        patch(r.id, { react: undefined });
      }, 7000);
      await sleep(1700);
    }
    office.set((st) => {
      const agents = { ...st.agents };
      for (const r of results) if (agents[r.id]) agents[r.id] = { ...agents[r.id], doneWeek: 0, errorsWeek: 0, review: { grade: r.grade, day: st.day } };
      return { agents };
    });
    const summary = results.map((r) => `${name(r.id)} ${r.grade}`).join(' · ');
    feed(`Performance reviews are in: ${summary}`, undefined, 'good');
    pushToast({ kind: 'memo', title: 'Performance reviews are in', body: summary });
    await sleep(5200);
    clearBanner(bannerKey);
    reviewing = false;
  })();
  return true;
}

// --- ambient life -----------------------------------------------------------------

const IDLE_WEIGHTS: [IdleAnim, number][] = [
  ['none', 0.18],
  ['coffee', 0.14],
  ['stretch', 0.1],
  ['nap', 0.1],
  ['spin', 0.1],
  ['phone', 0.12],
  ['juggle', 0.08],
  ['music', 0.11],
  ['plane', 0.07],
];

function randomIdle(focus: boolean): IdleAnim {
  if (focus) return pick(['none', 'coffee'] as const);
  let r = Math.random();
  for (const [anim, w] of IDLE_WEIGHTS) {
    if ((r -= w) <= 0) return anim;
  }
  return 'none';
}

let started = false;

export function startDirector() {
  if (started) return;
  started = true;
  setInterval(() => {
    if (document.hidden) return;
    const s = office.get();
    const scene = useScene.getState().agents;
    const hour = Math.floor(s.clock / 60);
    let typing = 0;
    for (const id of activeAgents(s)) {
      const a = s.agents[id];
      const sa = scene[id];
      if (!a || !sa) continue;
      const task = a.taskId ? s.tasks[a.taskId] : undefined;
      const minutes = task?.startedMin != null ? s.clock + s.day * 1440 - task.startedMin : 0;
      const tired = a.status === 'working' && minutes > 28;
      if (tired !== sa.tired) patch(id, { tired });
      if (!sa.seated) continue;
      if (a.status === 'working') typing++;
      if (a.status !== 'idle') {
        if (sa.idle !== 'none') patch(id, { idle: 'none' });
        continue;
      }
      if (chance(0.5)) {
        const next = randomIdle(s.settings.focus);
        patch(id, { idle: next });
        if (next === 'plane') throwPlane(id);
      }
      if (chance(0.1)) say(id, (hour >= 22 || hour < 5) && chance(0.5) ? 'night' : 'idle', { n: rand(2, 9) });
    }
    if (typing && chance(0.6) && !s.settings.focus) play('typing');

    if (!s.settings.focus) {
      // End-of-day awards at 5 PM, reviews every Friday afternoon, plus the odd coffee break or rivalry.
      if (hour === 17 && lastCeremonyDay !== s.day) startCeremony();
      else if (s.day % 7 === 5 && hour === 15 && lastReviewDay !== s.day) startReview();
      else if (chance(0.07)) startGossip();
      else if (chance(0.015)) startRivalry();
    }
  }, 3500);
}
