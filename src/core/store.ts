import { create } from 'zustand';
import type { AgentInfo, TaskMeta, TaskStatus } from './types';

export type AgentStatus = 'idle' | 'working' | 'error' | 'waiting';

export interface AgentState {
  info: AgentInfo;
  /** Which desk they sit at. Stays put when others join or leave. */
  slot: number;
  lifetimeDone: number;
  doneToday: number;
  errorsToday: number;
  handoffsToday: number;
  fixedToday: number;
  /** Since the last performance review. */
  doneWeek: number;
  errorsWeek: number;
  streak: number;
  status: AgentStatus;
  taskId?: string;
  achievements: string[];
  joinedDay: number;
  /** Packing up their desk for the retirement party. */
  leaving?: boolean;
  review?: { grade: string; day: number };
}

export interface TaskState {
  id: string;
  title: string;
  agentId: string;
  status: TaskStatus;
  meta: TaskMeta;
  createdAt: number;
  /** Office-clock minute the task was started (for "hours worked"). */
  startedMin?: number;
  doneAt?: number;
  hadError: boolean;
  error?: string;
  handoffs: number;
  approval?: { request: string; state: 'pending' | 'approved' | 'rejected' };
}

export interface FeedItem {
  id: string;
  clock: number;
  agentId?: string;
  text: string;
  tone: 'info' | 'good' | 'bad' | 'ask' | 'move';
}

export interface SpokenLine {
  agentId: string;
  text: string;
  category: string;
  ts: number;
}

export interface Toast {
  id: string;
  kind: 'approval' | 'levelup' | 'achievement' | 'memo';
  title: string;
  body?: string;
  agentId?: string;
  taskId?: string;
  achievementId?: string;
}

export interface Settings {
  sound: boolean;
  volume: number;
  focus: boolean;
  speed: 1 | 2 | 4;
}

export interface Stats {
  done: number;
  handoffs: number;
  errors: number;
  fixed: number;
  approved: number;
  rejected: number;
  workedMinutes: number;
}

export interface OfficeState {
  sourceLabel: string;
  sourceDescription: string;
  agents: Record<string, AgentState>;
  agentOrder: string[];
  tasks: Record<string, TaskState>;
  taskOrder: string[];
  feed: FeedItem[];
  spoken: SpokenLine[];
  stats: Stats;
  toasts: Toast[];
  /** Office clock in minutes since midnight. */
  clock: number;
  day: number;
  settings: Settings;
  ui: { board: boolean; share?: ShareTab; shareAgentId?: string; approvalTaskId?: string; profileAgentId?: string; dressAgentId?: string; pet?: boolean };
}

export type ShareTab = 'report' | 'card' | 'news' | 'comic';

const SETTINGS_KEY = 'cubicle-club:settings';
const DEFAULT_SETTINGS: Settings = { sound: false, volume: 0.6, focus: false, speed: 1 };

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    // Sound always starts muted until the user turns it on.
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw), sound: false };
  } catch {
    /* storage blocked: use defaults */
  }
  return DEFAULT_SETTINGS;
}

export const useOffice = create<OfficeState>(() => ({
  sourceLabel: '',
  sourceDescription: '',
  agents: {},
  agentOrder: [],
  tasks: {},
  taskOrder: [],
  feed: [],
  spoken: [],
  stats: { done: 0, handoffs: 0, errors: 0, fixed: 0, approved: 0, rejected: 0, workedMinutes: 0 },
  toasts: [],
  clock: 9 * 60,
  day: 1,
  settings: loadSettings(),
  ui: { board: false },
}));

export const office = { get: useOffice.getState, set: useOffice.setState };

useOffice.subscribe((state, prev) => {
  if (state.settings === prev.settings) return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
  } catch {
    /* ignore */
  }
});

let seq = 0;
export const nextId = (prefix: string) => `${prefix}-${++seq}`;

export function dismissToast(id: string) {
  office.set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
}

export function updateSettings(patch: Partial<Settings>) {
  office.set((s) => ({ settings: { ...s.settings, ...patch } }));
}

export function setUi(patch: Partial<OfficeState['ui']>) {
  office.set((s) => ({ ui: { ...s.ui, ...patch } }));
}

export const openBoard = () => setUi({ board: true, profileAgentId: undefined });
export const closeBoard = () => setUi({ board: false });
export const openShare = (tab: ShareTab = 'report', agentId?: string) => setUi({ share: tab, shareAgentId: agentId, profileAgentId: undefined, pet: false });
export const closeShare = () => setUi({ share: undefined });
export const openDressingRoom = (agentId: string) => setUi({ dressAgentId: agentId, profileAgentId: undefined });
export const closeDressingRoom = () => setUi({ dressAgentId: undefined });
export const openApproval = (taskId: string) => setUi({ approvalTaskId: taskId, profileAgentId: undefined });
export const closeApproval = () => setUi({ approvalTaskId: undefined });
export const openProfile = (agentId: string) => setUi({ profileAgentId: agentId, pet: false });
export const closeProfile = () => setUi({ profileAgentId: undefined });

/** Agents currently in the office (not counting anyone mid-retirement). */
export const activeAgents = (s: OfficeState) => s.agentOrder.filter((id) => !s.agents[id]?.leaving);

/** Takes an agent off the floor once their farewell is over. History stays. */
export function removeAgent(id: string) {
  office.set((s) => ({ agentOrder: s.agentOrder.filter((x) => x !== id) }));
}

export function pushToast(t: Omit<Toast, 'id'>) {
  office.set((s) => ({ toasts: [...s.toasts, { ...t, id: nextId('toast') }] }));
}

export const pendingApprovals = (s: OfficeState) =>
  s.taskOrder.filter((id) => s.tasks[id]?.approval?.state === 'pending');

export function formatClock(minutes: number) {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = Math.floor(minutes % 60);
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}
