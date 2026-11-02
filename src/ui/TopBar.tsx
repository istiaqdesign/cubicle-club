import { useEffect, useRef, useState } from 'react';
import { formatClock, openBoard, openShare, updateSettings, useOffice } from '../core/store';
import { setSpeed, triggerDrama } from '../core/runtime';
import { play, unlockAudio } from '../audio/sfx';
import { startCeremony, startGossip, startReview, startRivalry } from '../scene/director';
import { startClip, stopClip, useClip } from '../share/clipStore';
import { Icon, LogoMark } from './bits';

const DRAMA: { label: string; hint: string; run: () => void }[] = [
  { label: 'Pass a folder', hint: 'Someone delivers work to a teammate', run: () => triggerDrama('handoff') },
  { label: 'Break something', hint: 'A bug lands on a desk', run: () => triggerDrama('error') },
  { label: 'Ask the boss', hint: 'An agent walks over for your stamp', run: () => triggerDrama('approval') },
  { label: 'Finish a task', hint: 'Confetti time', run: () => triggerDrama('done') },
  { label: 'Coffee gossip', hint: 'Two agents chat about a third', run: () => startGossip(true) },
  { label: 'Award ceremony', hint: 'Crown the Employee of the Day', run: () => startCeremony() },
  { label: 'Start a rivalry', hint: 'Two agents race to 3 tasks', run: () => startRivalry(true) },
  { label: 'Performance review', hint: 'Everyone gets a grade sticker', run: () => startReview() },
  { label: 'Hire someone', hint: 'Onboarding day for a new agent', run: () => triggerDrama('hire') },
  { label: 'Retirement party', hint: 'Cake, speeches, a box of desk stuff', run: () => triggerDrama('retire') },
];

function OfficeClock() {
  const clock = useOffice((s) => Math.floor(s.clock));
  const day = useOffice((s) => s.day);
  return (
    <span className="clock-chip">
      Day {day} · <strong>{formatClock(clock)}</strong>
    </span>
  );
}

function useClickOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && close();
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [open, close]);
  return ref;
}

// Something worth filming the moment the camera starts rolling.
const CLIP_DRAMA = [() => triggerDrama('done'), () => triggerDrama('handoff'), () => triggerDrama('approval'), () => startGossip(true)];

function RecordMenu() {
  const [open, setOpen] = useState(false);
  const [seconds, setSeconds] = useState(6);
  const [drama, setDrama] = useState(true);
  const phase = useClip((s) => s.phase);
  const ref = useClickOutside(open, () => setOpen(false));
  const busy = phase === 'recording' || phase === 'developing';

  const start = () => {
    setOpen(false);
    void startClip(seconds);
    if (drama) setTimeout(() => CLIP_DRAMA[Math.floor(Math.random() * CLIP_DRAMA.length)](), 300);
  };

  return (
    <div className="menu-wrap" ref={ref}>
      <button className={`btn btn-paper ${phase === 'recording' ? 'recording' : ''}`} onClick={() => (phase === 'recording' ? stopClip() : setOpen((o) => !o))} disabled={phase === 'developing'} aria-expanded={open}>
        <Icon name="record" /> {phase === 'recording' ? 'Stop' : 'Record'}
      </button>
      {open && !busy && (
        <div className="menu record-menu">
          <strong className="menu-title">Record a clip</strong>
          <span className="menu-sub">Makes a GIF or video of the office with a small watermark.</span>
          <div className="seg wide" role="group" aria-label="Clip length">
            {[6, 10].map((n) => (
              <button key={n} className={seconds === n ? 'on' : ''} onClick={() => setSeconds(n)}>
                {n} seconds
              </button>
            ))}
          </div>
          <label className="check">
            <input type="checkbox" checked={drama} onChange={(e) => setDrama(e.target.checked)} />
            Kick off a little drama for the camera
          </label>
          <button className="btn btn-primary" onClick={start}>
            <Icon name="record" /> Start recording
          </button>
        </div>
      )}
    </div>
  );
}

export function TopBar() {
  const settings = useOffice((s) => s.settings);
  const source = useOffice((s) => s.sourceLabel);
  const sourceInfo = useOffice((s) => s.sourceDescription);
  const [dramaOpen, setDramaOpen] = useState(false);
  const [soundOpen, setSoundOpen] = useState(false);
  const dramaRef = useClickOutside(dramaOpen, () => setDramaOpen(false));
  const soundRef = useClickOutside(soundOpen, () => setSoundOpen(false));

  const toggleSound = () => {
    unlockAudio();
    const sound = !settings.sound;
    updateSettings({ sound });
    if (sound) setTimeout(() => play('pop'), 30);
  };

  return (
    <header className="topbar">
      <div className="brand">
        <LogoMark size={34} />
        <span>Cubicle Club</span>
      </div>
      <span className="source-chip" title={sourceInfo}>
        <i className="live-dot" /> {source}
      </span>
      <OfficeClock />
      <div className="spacer" />
      <div className="actions">
        <button className="btn btn-paper" onClick={openBoard}>
          <Icon name="board" /> Board
        </button>
        <button className="btn btn-paper" onClick={() => openShare()}>
          <Icon name="camera" /> Share
        </button>
        <RecordMenu />
        <div className="menu-wrap" ref={dramaRef}>
          <button className="btn btn-primary" onClick={() => setDramaOpen((o) => !o)} aria-expanded={dramaOpen}>
            <Icon name="bolt" /> Make drama
          </button>
          {dramaOpen && (
            <div className="menu drama-menu" role="menu">
              {DRAMA.map((d) => (
                <button
                  key={d.label}
                  role="menuitem"
                  className="menu-item"
                  onClick={() => {
                    d.run();
                    setDramaOpen(false);
                  }}
                >
                  <strong>{d.label}</strong>
                  <span>{d.hint}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="seg" role="group" aria-label="Speed">
          {([1, 2, 4] as const).map((s) => (
            <button key={s} className={settings.speed === s ? 'on' : ''} onClick={() => setSpeed(s)} aria-pressed={settings.speed === s}>
              {s}×
            </button>
          ))}
        </div>
        <button
          className={`btn btn-paper btn-toggle ${settings.focus ? 'on' : ''}`}
          onClick={() => updateSettings({ focus: !settings.focus })}
          aria-pressed={settings.focus}
          title="Focus mode: fewer bubbles and animations"
        >
          <Icon name="focus" /> Focus
        </button>
        <div className="menu-wrap" ref={soundRef}>
          <button
            className={`btn btn-paper btn-square ${settings.sound ? 'on' : ''}`}
            onClick={toggleSound}
            onContextMenu={(e) => {
              e.preventDefault();
              setSoundOpen(true);
            }}
            aria-label={settings.sound ? 'Mute sound' : 'Turn sound on'}
            title={settings.sound ? 'Sound on' : 'Sound off'}
          >
            <Icon name={settings.sound ? 'sound' : 'mute'} />
          </button>
          <button className="volume-caret" onClick={() => setSoundOpen((o) => !o)} aria-label="Volume">
            ▾
          </button>
          {soundOpen && (
            <div className="menu volume-menu">
              <label>
                Volume
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.volume}
                  onChange={(e) => updateSettings({ volume: Number(e.target.value) })}
                  onMouseUp={() => play('ding')}
                />
              </label>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
