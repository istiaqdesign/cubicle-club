// The common event format. Every data source (Grok Bot, Claude Code, demo…)
// is turned into these events by an adapter, so the office never needs to
// know where the data came from.

export type RoleId = 'manager' | 'researcher' | 'writer' | 'coder' | 'designer';

export interface AgentInfo {
  id: string;
  name: string;
  role: RoleId;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export interface TaskMeta {
  /** Name of the routine / workflow that created the task, if any. */
  routine?: string;
  trigger?: 'schedule' | 'webhook' | 'chat';
  /** Tool or connector the agent is using (Browser, Email, Terminal…). */
  tool?: string;
}

interface EventBase {
  id: string;
  ts: number;
  source: string;
  /** Historical event loaded on start-up: update the data, skip the animation. */
  replay?: boolean;
}

export type OfficeEvent = EventBase &
  (
    | { type: 'agent.joined'; agent: AgentInfo; lifetimeDone?: number }
    | { type: 'agent.left'; agentId: string }
    | { type: 'task.created'; taskId: string; title: string; agentId: string; meta?: TaskMeta }
    | { type: 'task.started'; taskId: string; agentId: string }
    | { type: 'task.progress'; taskId: string; agentId: string; note?: string }
    | { type: 'task.handoff'; taskId: string; fromId: string; toId: string; note?: string }
    | { type: 'task.needs_approval'; taskId: string; agentId: string; request: string }
    | { type: 'task.approval_resolved'; taskId: string; agentId: string; approved: boolean }
    | { type: 'task.error'; taskId: string; agentId: string; message: string }
    | { type: 'task.recovered'; taskId: string; agentId: string }
    | { type: 'task.done'; taskId: string; agentId: string }
  );

export type OfficeEventType = OfficeEvent['type'];

/** Demo-only buttons that force a moment of drama. */
export type DramaKind = 'handoff' | 'error' | 'approval' | 'done' | 'hire' | 'retire';
