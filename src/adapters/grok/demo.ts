import type { Adapter, Emit } from '../types';
import type { DramaKind, RoleId } from '../../core/types';
import { grokLineToEvent, type GrokLogLine } from './protocol';
import { DEMO_BOTS, ERRORS, FOLLOW_UP_ASKS, NEW_HIRES, ROUTINES, templatesFor, type TaskTemplate } from './demoContent';

const MAX_TEAM = 6;

interface SimTask {
  id: string;
  title: string;
  tool: string;
  routine: string;
  handoffTo?: RoleId;
  approval?: string;
  asked: boolean;
  /** Receivers wait until the folder has physically arrived. */
  readyAt: number;
}

interface Bot {
  name: string;
  role: RoleId;
  state: 'idle' | 'working' | 'stuck' | 'waiting';
  ticks: number;
  task?: SimTask;
  inbox: SimTask[];
}

const rand = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];
const chance = (p: number) => Math.random() < p;

/**
 * Simulates a busy Grok Bot team by writing the same self-report lines a real
 * bot would (see protocol.ts), one tick per second.
 */
export class GrokDemoAdapter implements Adapter {
  id = 'grok-demo';
  label = 'Grok Bot · demo data';
  description =
    'A pretend Grok Bot team. Every event uses the self-report format real bots would write, so swapping in live data needs no UI changes.';

  private emit: Emit | null = null;
  private timer?: number;
  private speed = 1;
  private seq = 0;
  private taskSeq = 0;
  private bots: Bot[] = [];
  private openTitles = new Set<string>();

  start(emit: Emit) {
    this.emit = emit;
    this.bots = DEMO_BOTS.map((b) => ({ name: b.name, role: b.role, state: 'idle', ticks: rand(2, 5), inbox: [] }));
    this.seed();
    this.schedule();
  }

  stop() {
    window.clearTimeout(this.timer);
    this.emit = null;
  }

  setSpeed(speed: number) {
    this.speed = speed;
  }

  resolveApproval(taskId: string, approved: boolean) {
    const bot = this.bots.find((b) => b.state === 'waiting' && b.task?.id === taskId);
    if (!bot || !bot.task) return;
    this.log({ bot: bot.name, kind: 'answer', task: taskId, approved });
    bot.state = 'working';
    if (approved) {
      bot.task.approval = undefined;
      bot.ticks = rand(4, 6);
    } else {
      bot.task.asked = false;
      bot.task.approval = bot.task.approval?.replace(/\?$/, ' (take two)?');
      bot.ticks = rand(6, 9);
    }
  }

  trigger(kind: DramaKind) {
    const free = this.bots.filter((b) => b.state === 'idle' || b.state === 'working');
    const working = free.filter((b) => b.state === 'working');
    switch (kind) {
      case 'handoff': {
        const bot = pick(free.filter((b) => b.role !== 'manager').length ? free.filter((b) => b.role !== 'manager') : free);
        if (!bot) return;
        const task = this.ensureTask(bot);
        if (!task.handoffTo) task.handoffTo = pick(this.bots.filter((b) => b !== bot)).role;
        this.finish(bot);
        return;
      }
      case 'error': {
        const bot = pick(working.length ? working : free);
        if (!bot) return;
        const task = this.ensureTask(bot);
        this.log({ bot: bot.name, kind: 'stuck', task: task.id, note: pick(ERRORS)(task.tool) });
        bot.state = 'stuck';
        bot.ticks = rand(5, 8);
        return;
      }
      case 'approval': {
        const bot = pick(free);
        if (!bot) return;
        const task = this.ensureTask(bot);
        task.handoffTo = undefined;
        task.approval = task.approval ?? FOLLOW_UP_ASKS[bot.role];
        task.asked = false;
        this.finish(bot, false, true);
        return;
      }
      case 'done': {
        const bot = pick(working.length ? working : free);
        if (!bot) return;
        this.ensureTask(bot);
        this.finish(bot, true);
        return;
      }
      case 'hire':
        this.hire();
        return;
      case 'retire':
        this.retire();
        return;
    }
  }

  /** Onboarding day: a brand-new bot says hello. */
  private hire() {
    if (this.bots.length >= MAX_TEAM) return;
    const taken = new Set(this.bots.map((b) => b.name));
    const name = NEW_HIRES.find((n) => !taken.has(n));
    if (!name) return;
    const roles: RoleId[] = ['researcher', 'writer', 'coder', 'designer'];
    const role = [...roles].sort((a, b) => this.bots.filter((x) => x.role === a).length - this.bots.filter((x) => x.role === b).length)[0];
    this.log({ bot: name, role, kind: 'hello', lifetimeDone: 0 });
    // Give them a few seconds to find their desk before the first task.
    this.bots.push({ name, role, state: 'idle', ticks: rand(9, 12), inbox: [] });
  }

  /** Someone hangs up their headset. Their unfinished work goes to a teammate first. */
  private retire() {
    const candidates = this.bots.filter((b) => b.role !== 'manager' && b.state !== 'waiting');
    if (this.bots.length <= 3 || !candidates.length) return;
    const bot = candidates.find((b) => b.state === 'idle' && !b.inbox.length) ?? pick(candidates);
    const others = this.bots.filter((b) => b !== bot);
    if (bot.task) this.finish(bot, true);
    for (const task of bot.inbox) {
      const to = others.find((b) => b.role === bot.role) ?? pick(others);
      this.log({ bot: bot.name, kind: 'handoff', task: task.id, to: to.name });
      to.inbox.push({ ...task, readyAt: this.readyIn() });
    }
    this.bots = others;
    this.log({ bot: bot.name, kind: 'bye' });
  }

  // ---------------------------------------------------------------------------

  private schedule() {
    this.timer = window.setTimeout(() => {
      if (!document.hidden) this.tick();
      this.schedule();
    }, 1000 / this.speed);
  }

  private log(line: Omit<GrokLogLine, 'ts'> & { ts?: number }) {
    const event = grokLineToEvent({ ts: Date.now(), ...line }, ++this.seq);
    if (event && this.emit) this.emit(event);
  }

  /** A template for this role whose title isn't already open on the board. */
  private template(role: RoleId) {
    const all = templatesFor(role);
    const fresh = all.filter((t) => !this.openTitles.has(t.title));
    return pick(fresh.length ? fresh : all);
  }

  /** A bot with this role (new hires share the work with veterans). */
  private botFor(role: RoleId) {
    const matches = this.bots.filter((b) => b.role === role);
    return matches.length ? pick(matches) : undefined;
  }

  private newTask(tpl: TaskTemplate, owner: Bot, opts: { replay?: boolean; trigger?: GrokLogLine['trigger'] } = {}) {
    const task: SimTask = {
      id: `t${++this.taskSeq}`,
      title: tpl.title,
      tool: tpl.tool,
      routine: ROUTINES[tpl.role],
      handoffTo: tpl.handoff,
      approval: tpl.approval,
      asked: false,
      readyAt: 0,
    };
    this.openTitles.add(task.title);
    this.log({
      bot: owner.name,
      kind: 'new_task',
      task: task.id,
      title: task.title,
      routine: task.routine,
      trigger: opts.trigger ?? pick(['schedule', 'schedule', 'webhook', 'chat'] as const),
      tool: task.tool,
      replay: opts.replay,
    });
    return task;
  }

  private ensureTask(bot: Bot) {
    if (!bot.task) this.startTask(bot, this.newTask(this.template(bot.role), bot));
    return bot.task!;
  }

  private startTask(bot: Bot, task: SimTask) {
    bot.task = task;
    bot.state = 'working';
    bot.ticks = rand(6, 12);
    this.log({ bot: bot.name, kind: 'started', task: task.id });
  }

  private readyIn() {
    return Date.now() + 6500 / Math.sqrt(this.speed);
  }

  private seed() {
    for (const b of DEMO_BOTS) this.log({ bot: b.name, role: b.role, kind: 'hello', lifetimeDone: b.lifetimeDone, replay: true });

    // Work finished earlier in the shift.
    for (const bot of this.bots.filter((b) => b.role !== 'writer')) {
      const task = this.newTask(this.template(bot.role), bot, { replay: true });
      this.log({ bot: bot.name, kind: 'started', task: task.id, replay: true });
      this.log({ bot: bot.name, kind: 'finished', task: task.id, replay: true });
      this.openTitles.delete(task.title);
    }

    // A small backlog.
    for (const role of ['writer', 'coder', 'designer'] as RoleId[]) {
      const bot = this.botFor(role)!;
      bot.inbox.push(this.newTask(this.template(role), bot, { replay: true }));
    }

    // Already busy when you walk in.
    for (const role of ['researcher', 'coder', 'writer'] as RoleId[]) {
      const bot = this.botFor(role)!;
      this.startTask(bot, this.newTask(this.template(role), bot));
    }
  }

  private tick() {
    const now = Date.now();
    for (const bot of this.bots) {
      switch (bot.state) {
        case 'idle': {
          if (--bot.ticks > 0) break;
          const ready = bot.inbox.findIndex((t) => t.readyAt <= now);
          if (ready >= 0) this.startTask(bot, bot.inbox.splice(ready, 1)[0]);
          else if (bot.role === 'manager' && chance(0.6)) this.assign(bot);
          else if (chance(0.45)) this.startTask(bot, this.newTask(this.template(bot.role), bot));
          else bot.ticks = rand(2, 5);
          break;
        }
        case 'working': {
          const task = bot.task!;
          if (chance(0.2)) this.log({ bot: bot.name, kind: 'step', task: task.id });
          if (chance(0.035)) {
            this.log({ bot: bot.name, kind: 'stuck', task: task.id, note: pick(ERRORS)(task.tool) });
            bot.state = 'stuck';
            bot.ticks = rand(4, 8);
            break;
          }
          if (--bot.ticks <= 0) this.finish(bot);
          break;
        }
        case 'stuck':
          if (--bot.ticks <= 0) {
            this.log({ bot: bot.name, kind: 'unstuck', task: bot.task!.id });
            bot.state = 'working';
            bot.ticks = rand(2, 4);
          }
          break;
        case 'waiting':
          break;
      }
    }
  }

  /** Manager hands a fresh task to whoever has the shortest queue. */
  private assign(mgr: Bot) {
    const target = this.bots
      .filter((b) => b !== mgr && b.state !== 'waiting')
      .sort((a, b) => a.inbox.length - b.inbox.length)[0];
    if (!target) {
      mgr.ticks = 3;
      return;
    }
    const task = this.newTask(this.template(target.role), mgr, { trigger: 'chat' });
    this.log({ bot: mgr.name, kind: 'handoff', task: task.id, to: target.name, note: 'assigned' });
    target.inbox.push({ ...task, readyAt: this.readyIn() });
    mgr.ticks = rand(9, 13);
  }

  /** force = skip handoffs and approvals; pushy = ask even if someone is already waiting. */
  private finish(bot: Bot, force = false, pushy = false) {
    const task = bot.task!;
    if (!force && task.handoffTo) {
      const to = this.botFor(task.handoffTo);
      if (to && to !== bot) {
        this.log({ bot: bot.name, kind: 'handoff', task: task.id, to: to.name });
        to.inbox.push({
          ...task,
          handoffTo: undefined,
          approval: task.approval ?? (chance(0.2) ? FOLLOW_UP_ASKS[to.role] : undefined),
          readyAt: this.readyIn(),
        });
        bot.task = undefined;
        bot.state = 'idle';
        bot.ticks = rand(6, 9);
        return;
      }
    }
    const queueFull = this.bots.some((b) => b.state === 'waiting');
    if (!force && task.approval && !task.asked && (pushy || !queueFull)) {
      task.asked = true;
      this.log({ bot: bot.name, kind: 'ask', task: task.id, note: task.approval });
      bot.state = 'waiting';
      return;
    }
    this.log({ bot: bot.name, kind: 'finished', task: task.id });
    this.openTitles.delete(task.title);
    bot.task = undefined;
    bot.state = 'idle';
    bot.ticks = rand(3, 7);
  }
}
