import type { OfficeEvent, RoleId, TaskMeta } from '../../core/types';

/**
 * Grok Bot has no public API for reading bot activity (checked Oct 2026).
 * The planned real connection is "self-reporting":
 *
 *   1. Each bot gets a custom instruction: "after every step, append one JSON
 *      line to ~/CubicleClub/grok-log.jsonl" (bots can run local commands on
 *      the Mac when local access is on).
 *   2. Cubicle Club reads that file (folder picker or a tiny local helper).
 *   3. Approvals go back by triggering a Grok Bot routine webhook.
 *
 * This file defines that line format and turns it into OfficeEvents. The demo
 * generator writes the exact same lines, so demo and real data share one path.
 */

export type GrokLineKind =
  | 'hello'
  | 'new_task'
  | 'started'
  | 'step'
  | 'handoff'
  | 'ask'
  | 'answer'
  | 'stuck'
  | 'unstuck'
  | 'finished'
  /** The bot was deleted or switched off for good. */
  | 'bye';

export interface GrokLogLine {
  ts: number;
  bot: string;
  kind: GrokLineKind;
  role?: RoleId;
  lifetimeDone?: number;
  task?: string;
  title?: string;
  /** Receiving bot for a handoff. */
  to?: string;
  note?: string;
  routine?: string;
  trigger?: TaskMeta['trigger'];
  tool?: string;
  approved?: boolean;
  replay?: boolean;
}

export const botId = (name: string) => name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

export function grokLineToEvent(line: GrokLogLine, seq: number): OfficeEvent | null {
  const base = { id: `grok-${seq}`, ts: line.ts, source: 'grok', replay: line.replay };
  const agentId = botId(line.bot);
  const taskId = line.task ?? '';

  switch (line.kind) {
    case 'hello':
      return {
        ...base,
        type: 'agent.joined',
        agent: { id: agentId, name: line.bot, role: line.role ?? 'researcher' },
        lifetimeDone: line.lifetimeDone,
      };
    case 'new_task':
      return {
        ...base,
        type: 'task.created',
        taskId,
        title: line.title ?? 'Untitled task',
        agentId,
        meta: { routine: line.routine, trigger: line.trigger, tool: line.tool },
      };
    case 'started':
      return { ...base, type: 'task.started', taskId, agentId };
    case 'step':
      return { ...base, type: 'task.progress', taskId, agentId, note: line.note };
    case 'handoff':
      if (!line.to) return null;
      return { ...base, type: 'task.handoff', taskId, fromId: agentId, toId: botId(line.to), note: line.note };
    case 'ask':
      return { ...base, type: 'task.needs_approval', taskId, agentId, request: line.note ?? 'Okay to continue?' };
    case 'answer':
      return { ...base, type: 'task.approval_resolved', taskId, agentId, approved: !!line.approved };
    case 'stuck':
      return { ...base, type: 'task.error', taskId, agentId, message: line.note ?? 'Something went wrong' };
    case 'unstuck':
      return { ...base, type: 'task.recovered', taskId, agentId };
    case 'finished':
      return { ...base, type: 'task.done', taskId, agentId };
    case 'bye':
      return { ...base, type: 'agent.left', agentId };
  }
}
