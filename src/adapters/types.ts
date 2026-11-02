import type { DramaKind, OfficeEvent } from '../core/types';

export type Emit = (event: OfficeEvent) => void;

/**
 * A data source for the office. To support a new agent tool (Claude Code,
 * Codex, CrewAI…) write a new adapter that emits OfficeEvents; nothing in the
 * scene or UI has to change.
 */
export interface Adapter {
  id: string;
  label: string;
  /** Plain-language note on where the data comes from. */
  description: string;
  start(emit: Emit): void;
  stop(): void;
  setSpeed?(speed: number): void;
  /** The user stamped an approval. Real sources forward it to the agent tool. */
  resolveApproval?(taskId: string, approved: boolean): void;
  /** Demo-only: force a moment of drama. */
  trigger?(kind: DramaKind): void;
}
