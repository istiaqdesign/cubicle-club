import type { TaskStatus } from './types';

export const COLUMNS: { id: TaskStatus; label: string; short: string }[] = [
  { id: 'todo', label: 'To Do', short: 'TO DO' },
  { id: 'in_progress', label: 'In Progress', short: 'DOING' },
  { id: 'review', label: 'Needs You', short: 'REVIEW' },
  { id: 'done', label: 'Done', short: 'DONE' },
];
