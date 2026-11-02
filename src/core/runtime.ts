import type { Adapter } from '../adapters/types';
import { GrokDemoAdapter } from '../adapters/grok/demo';
import type { DramaKind } from './types';
import { applyEvent, newDay } from './engine';
import { office, updateSettings, type Settings } from './store';
import { handle, startDirector } from '../scene/director';
import { petOnEvent, startPet } from '../pet/petBrain';

// Wires a data source to the office: adapter → engine (data) → director (show).

let adapter: Adapter | null = null;
let started = false;

/** Office clock: 2 office minutes per real second at 1× speed. */
function startClock() {
  setInterval(() => {
    if (document.hidden) return;
    const day = office.get().day;
    office.set((s) => {
      let clock = s.clock + 0.5 * s.settings.speed;
      let day = s.day;
      if (clock >= 1440) {
        clock -= 1440;
        day++;
      }
      return { clock, day };
    });
    if (office.get().day !== day) newDay();
  }, 250);
}

export function startRuntime() {
  if (started) return;
  started = true;
  adapter = new GrokDemoAdapter();
  office.set({ sourceLabel: adapter.label, sourceDescription: adapter.description });
  adapter.setSpeed?.(office.get().settings.speed);
  startDirector();
  startPet();
  startClock();
  adapter.start((event) => {
    const moments = applyEvent(event);
    handle(event, moments);
    petOnEvent(event);
  });

  // Pause CSS animations while the tab is hidden.
  document.addEventListener('visibilitychange', () => {
    document.documentElement.classList.toggle('paused', document.hidden);
  });
}

export function resolveApproval(taskId: string, approved: boolean) {
  const task = office.get().tasks[taskId];
  if (task?.approval?.state !== 'pending') return;
  adapter?.resolveApproval?.(taskId, approved);
}

export const triggerDrama = (kind: DramaKind) => adapter?.trigger?.(kind);

export function setSpeed(speed: Settings['speed']) {
  updateSettings({ speed });
  adapter?.setSpeed?.(speed);
}
