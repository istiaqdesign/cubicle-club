import type { OfficeEvent } from './types';
import { nextId, office, type AgentState, type FeedItem, type TaskState, type Toast } from './store';
import { achievementById, levelIndex, levelTitle } from './progression';

/** Big moments the scene should celebrate on top of the plain event. */
export type Moment =
  | { kind: 'levelup'; agentId: string; title: string }
  | { kind: 'achievement'; agentId: string; id: string };

/** Applies one event to the office data. Pure bookkeeping, no animation. */
export function applyEvent(e: OfficeEvent): Moment[] {
  const s = office.get();
  const agents = { ...s.agents };
  const tasks = { ...s.tasks };
  const stats = { ...s.stats };
  let { agentOrder, taskOrder } = s;
  let toasts = s.toasts;
  const feed: Omit<FeedItem, 'id' | 'clock'>[] = [];
  const newToasts: Toast[] = [];
  const moments: Moment[] = [];
  const nowMin = s.clock + s.day * 1440;

  const name = (id: string) => agents[id]?.info.name ?? id;
  const title = (id: string) => tasks[id]?.title ?? 'a task';
  const patchAgent = (id: string, p: Partial<AgentState>) => {
    if (agents[id]) agents[id] = { ...agents[id], ...p };
  };
  const patchTask = (id: string, p: Partial<TaskState>) => {
    if (tasks[id]) tasks[id] = { ...tasks[id], ...p };
  };

  switch (e.type) {
    case 'agent.joined': {
      const prev = agents[e.agent.id];
      const onFloor = prev && agentOrder.includes(e.agent.id) && !prev.leaving;
      const taken = new Set(agentOrder.filter((id) => id !== e.agent.id).map((id) => agents[id].slot));
      let slot = 0;
      while (taken.has(slot)) slot++;
      if (!agentOrder.includes(e.agent.id)) agentOrder = [...agentOrder, e.agent.id];
      agents[e.agent.id] = {
        info: e.agent,
        slot: onFloor ? prev.slot : slot,
        lifetimeDone: e.lifetimeDone ?? prev?.lifetimeDone ?? 0,
        doneToday: 0,
        errorsToday: 0,
        handoffsToday: 0,
        fixedToday: 0,
        doneWeek: 0,
        errorsWeek: 0,
        streak: 0,
        status: 'idle',
        achievements: prev?.achievements ?? [],
        joinedDay: s.day,
      };
      if (!e.replay) feed.push({ agentId: e.agent.id, text: `Say hi to ${e.agent.name}, the newest member of the team!`, tone: 'good' });
      break;
    }
    case 'agent.left': {
      patchAgent(e.agentId, { leaving: true, status: 'idle', taskId: undefined });
      feed.push({ agentId: e.agentId, text: `${name(e.agentId)} is retiring. Cake in the aisle!`, tone: 'info' });
      break;
    }
    case 'task.created': {
      if (!tasks[e.taskId]) taskOrder = [...taskOrder, e.taskId];
      tasks[e.taskId] = {
        id: e.taskId,
        title: e.title,
        agentId: e.agentId,
        status: 'todo',
        meta: e.meta ?? {},
        createdAt: e.ts,
        hadError: false,
        handoffs: 0,
      };
      break;
    }
    case 'task.started': {
      patchTask(e.taskId, { status: 'in_progress', agentId: e.agentId, startedMin: nowMin });
      patchAgent(e.agentId, { status: 'working', taskId: e.taskId });
      feed.push({ agentId: e.agentId, text: `${name(e.agentId)} started “${title(e.taskId)}”`, tone: 'info' });
      break;
    }
    case 'task.progress':
      break;
    case 'task.handoff': {
      patchTask(e.taskId, { agentId: e.toId, status: 'todo', handoffs: (tasks[e.taskId]?.handoffs ?? 0) + 1 });
      if (agents[e.fromId]?.taskId === e.taskId) patchAgent(e.fromId, { status: 'idle', taskId: undefined });
      stats.handoffs++;
      for (const id of [e.fromId, e.toId]) if (agents[id]) patchAgent(id, { handoffsToday: agents[id].handoffsToday + 1 });
      const verb = e.note === 'assigned' ? 'assigned' : 'handed';
      feed.push({ agentId: e.fromId, text: `${name(e.fromId)} ${verb} “${title(e.taskId)}” to ${name(e.toId)}`, tone: 'move' });
      break;
    }
    case 'task.needs_approval': {
      patchTask(e.taskId, { status: 'review', approval: { request: e.request, state: 'pending' } });
      patchAgent(e.agentId, { status: 'waiting' });
      feed.push({ agentId: e.agentId, text: `${name(e.agentId)} is waiting for your OK: ${e.request}`, tone: 'ask' });
      if (!e.replay) {
        newToasts.push({
          id: nextId('toast'),
          kind: 'approval',
          title: `${name(e.agentId)} needs your OK`,
          body: e.request,
          agentId: e.agentId,
          taskId: e.taskId,
        });
      }
      break;
    }
    case 'task.approval_resolved': {
      const t = tasks[e.taskId];
      if (t?.approval) patchTask(e.taskId, { status: 'in_progress', approval: { ...t.approval, state: e.approved ? 'approved' : 'rejected' } });
      patchAgent(e.agentId, { status: 'working' });
      if (e.approved) stats.approved++;
      else stats.rejected++;
      toasts = toasts.filter((x) => x.taskId !== e.taskId);
      feed.push({
        agentId: e.agentId,
        text: e.approved ? `You approved “${title(e.taskId)}”` : `You sent “${title(e.taskId)}” back for another pass`,
        tone: e.approved ? 'good' : 'bad',
      });
      break;
    }
    case 'task.error': {
      const a = agents[e.agentId];
      patchTask(e.taskId, { hadError: true, error: e.message });
      if (a) patchAgent(e.agentId, { status: 'error', streak: 0, errorsToday: a.errorsToday + 1, errorsWeek: a.errorsWeek + 1 });
      stats.errors++;
      feed.push({ agentId: e.agentId, text: `${name(e.agentId)} hit a snag: ${e.message}`, tone: 'bad' });
      break;
    }
    case 'task.recovered': {
      patchTask(e.taskId, { error: undefined });
      if (agents[e.agentId]) patchAgent(e.agentId, { status: 'working', fixedToday: agents[e.agentId].fixedToday + 1 });
      stats.fixed++;
      feed.push({ agentId: e.agentId, text: `${name(e.agentId)} squashed the bug`, tone: 'good' });
      break;
    }
    case 'task.done': {
      const a = agents[e.agentId];
      const t = tasks[e.taskId];
      if (!a) break;
      const before = a.lifetimeDone;
      const after = before + 1;
      const worked = e.replay || t?.startedMin == null ? 45 : Math.max(1, nowMin - t.startedMin);
      const streak = a.streak + 1;
      patchTask(e.taskId, { status: 'done', agentId: e.agentId, doneAt: e.ts });
      patchAgent(e.agentId, {
        status: 'idle',
        taskId: undefined,
        lifetimeDone: after,
        doneToday: a.doneToday + 1,
        doneWeek: a.doneWeek + 1,
        streak,
      });
      stats.done++;
      stats.workedMinutes += worked;
      feed.push({ agentId: e.agentId, text: `${name(e.agentId)} finished “${title(e.taskId)}”`, tone: 'good' });
      if (e.replay) break;

      if (levelIndex(after) > levelIndex(before)) {
        const newTitle = levelTitle(after);
        moments.push({ kind: 'levelup', agentId: e.agentId, title: newTitle });
        newToasts.push({
          id: nextId('toast'),
          kind: 'levelup',
          title: 'Level up!',
          body: `${a.info.name} is now ${newTitle}`,
          agentId: e.agentId,
        });
      }

      const unlock = (id: string) => {
        const current = agents[e.agentId];
        if (current.achievements.includes(id)) return;
        patchAgent(e.agentId, { achievements: [...current.achievements, id] });
        moments.push({ kind: 'achievement', agentId: e.agentId, id });
        newToasts.push({
          id: nextId('toast'),
          kind: 'achievement',
          title: achievementById[id].name,
          body: `${a.info.name} · ${achievementById[id].blurb}`,
          agentId: e.agentId,
          achievementId: id,
        });
      };
      if (after >= 100) unlock('century');
      if (Math.floor(s.clock / 60) < 5) unlock('night_shift');
      if (a.doneToday + 1 >= 8 && a.errorsToday === 0) unlock('zero_error');
      if (worked < 15) unlock('speed_demon');
      if (t?.hadError) unlock('comeback_kid');
      if (streak >= 5) unlock('hot_streak');
      break;
    }
  }

  const stamped = feed.map((f) => ({ ...f, id: nextId('feed'), clock: s.clock }));
  office.set({
    agents,
    agentOrder,
    tasks,
    taskOrder,
    stats,
    feed: [...stamped.reverse(), ...s.feed].slice(0, 60),
    toasts: [...toasts, ...newToasts],
  });
  return moments;
}

/** Midnight: daily counters start over (weekly ones wait for the review). */
export function newDay() {
  office.set((s) => {
    const agents = { ...s.agents };
    for (const id of s.agentOrder) agents[id] = { ...agents[id], doneToday: 0, errorsToday: 0, handoffsToday: 0, fixedToday: 0 };
    return {
      agents,
      stats: { done: 0, handoffs: 0, errors: 0, fixed: 0, approved: 0, rejected: 0, workedMinutes: 0 },
      feed: [{ id: nextId('feed'), clock: s.clock, text: `Day ${s.day} begins. Fresh coffee, fresh chaos.`, tone: 'info' as const }, ...s.feed].slice(0, 60),
    };
  });
}
