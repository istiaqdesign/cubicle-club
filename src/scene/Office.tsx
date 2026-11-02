import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { openBoard, useOffice } from '../core/store';
import { COLUMNS } from '../core/board';
import { ROLES } from '../content/roster';
import { Backdrop, hourOf, isNight } from './Backdrop';
import { BossDesk, Desk } from './Desk';
import { Character } from './Character';
import { CAKE_SPOT, FACE_OFF, PODIUM, STAGE, desk } from './layout';
import { useScene } from './sceneStore';
import { RecordingBadge } from '../ui/ClipModal';
import { OfficePet } from './Pet';

function MiniBoard() {
  const tasks = useOffice((s) => s.tasks);
  const order = useOffice((s) => s.taskOrder);
  const agents = useOffice((s) => s.agents);
  return (
    <button className="miniboard" onClick={openBoard} aria-label="Open the task board">
      <span className="mb-title">TEAM BOARD</span>
      <span className="mb-cols">
        {COLUMNS.map((col) => {
          const ids = order.filter((id) => tasks[id]?.status === col.id);
          return (
            <span className="mb-col" key={col.id}>
              <span className="mb-head">{col.short}</span>
              <span className="mb-notes">
                {ids.slice(-6).map((id) => {
                  const role = agents[tasks[id].agentId]?.info.role;
                  return <i key={id} style={{ background: role ? ROLES[role].color : '#ddd' }} />;
                })}
              </span>
              <span className="mb-count">{ids.length}</span>
            </span>
          );
        })}
      </span>
      <span className="mb-hint">Open the board</span>
    </button>
  );
}

function NightLight() {
  const hour = useOffice((s) => hourOf(s.clock));
  const slots = useOffice(useShallow((s) => s.agentOrder.map((id) => s.agents[id].slot)));
  const night = isNight(hour);
  const dusk = hour >= 17 && hour < 19;
  return (
    <>
      <div className="night-tint" style={{ opacity: night ? 1 : dusk ? 0.35 : 0 }} />
      <div className="lamp-glows" style={{ opacity: night ? 1 : 0 }}>
        {slots.map((slot) => {
          const d = desk(slot);
          return <i key={slot} style={{ left: d.x - 130, top: d.deskTop - 90 }} />;
        })}
      </div>
    </>
  );
}

function PaperPlanes() {
  const planes = useScene((s) => s.planes);
  return (
    <>
      {planes.map((p) => (
        <div
          key={p.key}
          className="plane-x"
          style={{ left: p.from.x, top: p.from.y, '--dx': `${p.to.x - p.from.x}px` } as CSSProperties}
        >
          <div className="plane-y" style={{ '--dy': `${p.to.y - p.from.y}px` } as CSSProperties}>
            <svg viewBox="0 0 40 24" width="40" height="24" style={{ transform: `scaleX(${p.to.x < p.from.x ? -1 : 1})` }}>
              <path d="M2 12 L38 2 L18 22 L15 14 Z" fill="#fff" stroke="#B8A898" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M15 14 L38 2" stroke="#B8A898" strokeWidth="1.2" />
            </svg>
          </div>
        </div>
      ))}
    </>
  );
}

const CONFETTI_COLORS = ['#FF7B8A', '#52B8FF', '#FFC53D', '#3CCB9A', '#A88BFF', '#FF8A3D'];

/** Ribbon banner across the top of the room for big moments. */
function Banner() {
  const banner = useScene((s) => s.banner);
  if (!banner) return null;
  return (
    <div key={banner.key} className={`eod-banner tone-${banner.tone}`}>
      <small>{banner.kicker}</small>
      <strong>{banner.title}</strong>
    </div>
  );
}

/** Spotlight and podium for the award ceremony. */
function Ceremony() {
  const ceremony = useScene((s) => s.ceremony);
  if (!ceremony) return null;
  return (
    <>
      <div className="podium" style={{ left: PODIUM.x - 70, top: PODIUM.y - 12, zIndex: PODIUM.y + 2 }}>
        <svg viewBox="0 0 140 56" width="140" height="56" aria-hidden="true">
          <rect x="6" y="12" width="128" height="42" rx="8" fill="#E0A215" />
          <ellipse cx="70" cy="12" rx="64" ry="10" fill="#FFC53D" />
          <text x="70" y="44" textAnchor="middle" className="podium-text">
            1
          </text>
        </svg>
      </div>
      <div className={`spotlight ${ceremony.live ? 'live' : ''}`} style={{ left: PODIUM.x - 150 }} />
      <div className="stage-dim" />
    </>
  );
}

/** Confetti raining over the whole room. */
function Shower() {
  const key = useScene((s) => s.shower);
  const bits = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        left: Math.random() * STAGE.w,
        delay: Math.random() * 2.4,
        dur: 2.6 + Math.random() * 1.8,
        r: Math.random() * 720,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      })),
    // New shower each time.
    [key],
  );
  if (!key) return null;
  return (
    <div className="confetti-shower">
      {bits.map((c, i) => (
        <i key={i} style={{ left: c.left, background: c.color, animationDelay: `${c.delay}s`, animationDuration: `${c.dur}s`, '--r': `${c.r}deg` } as CSSProperties} />
      ))}
    </div>
  );
}

/** Farewell cake on a little table in the aisle. */
function Cake() {
  const cake = useScene((s) => s.cake);
  if (!cake) return null;
  return (
    <div className="cake" style={{ left: CAKE_SPOT.x - 50, top: CAKE_SPOT.y - 112, zIndex: CAKE_SPOT.y }}>
      <svg viewBox="0 0 100 112" width="100" height="112" aria-hidden="true">
        <rect x="46" y="70" width="8" height="38" fill="#8C6E5A" />
        <rect x="22" y="104" width="56" height="7" rx="3.5" fill="#8C6E5A" />
        <ellipse cx="50" cy="70" rx="44" ry="8" fill="#FFFDF8" stroke="#E0D3C3" strokeWidth="2" />
        <rect x="20" y="40" width="60" height="28" rx="6" fill="#FFB3C1" />
        <path d="M20 48 q7.5 8 15 0 q7.5 8 15 0 q7.5 8 15 0 q7.5 8 15 0" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
        <rect x="28" y="24" width="44" height="18" rx="5" fill="#FFE3EA" />
        {[38, 50, 62].map((x) => (
          <g key={x}>
            <rect x={x - 2} y="10" width="4" height="15" rx="2" fill="#52B8FF" />
            <path className="flame" d={`M${x} 2 q4 5 0 8 q-4 -3 0 -8`} fill="#FFC53D" />
          </g>
        ))}
      </svg>
    </div>
  );
}

/** Welcome balloons tied to a new hire's desk. */
function Balloons() {
  const slot = useScene((s) => s.balloons);
  if (slot == null) return null;
  const d = desk(slot);
  return (
    <div className="balloons" style={{ left: d.x + 52, top: d.deskTop - 150, zIndex: d.z + 1 }}>
      <svg viewBox="0 0 90 170" width="90" height="170" aria-hidden="true">
        <path d="M22 70 Q30 120 40 160 M50 56 Q46 110 40 160 M74 74 Q56 120 40 160" fill="none" stroke="#B8A898" strokeWidth="1.5" />
        <ellipse cx="22" cy="46" rx="18" ry="22" fill="#FF7B8A" />
        <ellipse cx="50" cy="32" rx="18" ry="22" fill="#FFC53D" />
        <ellipse cx="74" cy="50" rx="16" ry="20" fill="#52B8FF" />
        <path d="M16 36 q3 -6 8 -8 M44 22 q3 -6 8 -8 M69 41 q3 -6 7 -7" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6" />
      </svg>
    </div>
  );
}

/** Live scoreboard while two agents are racing each other. */
function RivalryChip() {
  const r = useScene((s) => s.rivalry);
  const agents = useOffice((s) => s.agents);
  if (!r || !agents[r.a] || !agents[r.b]) return null;
  return (
    <>
      <div className="rivalry-chip">
        <span style={{ color: ROLES[agents[r.a].info.role].color }}>{agents[r.a].info.name}</span>
        <b>{r.scoreA}</b>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M13 2L5 13h6l-1 9 8-11h-6z" fill="#FFC53D" stroke="#3A2E2A" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
        <b>{r.scoreB}</b>
        <span style={{ color: ROLES[agents[r.b].info.role].color }}>{agents[r.b].info.name}</span>
        <small>first to {r.target}</small>
      </div>
      {r.stare && (
        <div className="stare-bolt" style={{ left: (FACE_OFF[0].x + FACE_OFF[1].x) / 2 - 30, top: FACE_OFF[0].y - 150 }}>
          <svg viewBox="0 0 60 60" width="60" height="60" aria-hidden="true">
            <path d="M34 2L12 34h14l-4 24 26-34H34z" fill="#FFC53D" stroke="#3A2E2A" strokeWidth="3" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </>
  );
}

export function Office() {
  const wrap = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const order = useOffice((s) => s.agentOrder);

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setScale(Math.min(width / STAGE.w, height / STAGE.h));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="stage-wrap" ref={wrap}>
      <div className="stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        <Backdrop />
        <MiniBoard />
        <BossDesk />
        {order.map((id) => (
          <Desk key={id} id={id} />
        ))}
        {order.map((id) => (
          <Character key={id} id={id} />
        ))}
        <OfficePet />
        <PaperPlanes />
        <Ceremony />
        <Cake />
        <Balloons />
        <Shower />
        <Banner />
        <RivalryChip />
        <NightLight />
      </div>
      <RecordingBadge />
    </div>
  );
}
