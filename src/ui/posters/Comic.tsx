import type { ReactNode } from 'react';
import type { ComicData, ComicPanel, ComicSet } from '../../share/build';
import { lookFor } from '../../content/roster';
import { AgentSprite } from '../../scene/AgentSprite';
import { LogoMark } from '../bits';

const INK = '#2b2320';

/** Simple flat backgrounds for each panel. */
const SETS: Record<ComicSet, ReactNode> = {
  desk: (
    <g>
      <rect width="500" height="300" fill="#FCE6CF" />
      <rect x="40" y="40" width="150" height="100" rx="10" fill="#FFFDF8" />
      <rect x="48" y="48" width="134" height="84" rx="6" fill="#BFE6FF" />
      <rect x="112" y="48" width="5" height="84" fill="#FFFDF8" />
      <circle cx="400" cy="90" r="34" fill="#FFFDF8" stroke="#E2775A" strokeWidth="6" />
      <path d="M400 90 V68 M400 90 H416" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <rect y="300" width="500" height="200" fill="#EFCFA2" />
    </g>
  ),
  coffee: (
    <g>
      <rect width="500" height="300" fill="#F8DCC0" />
      <rect x="30" y="34" width="110" height="34" rx="8" fill="#C98F5E" />
      <text x="85" y="58" textAnchor="middle" className="cm-sign">
        FUEL
      </text>
      <rect y="300" width="500" height="200" fill="#EFCFA2" />
      <rect x="10" y="210" width="230" height="100" rx="12" fill="#E2A877" />
      <rect x="0" y="198" width="250" height="18" rx="9" fill="#FFF1DD" />
      <rect x="40" y="110" width="80" height="90" rx="14" fill="#5A4A5E" />
      <rect x="52" y="122" width="56" height="22" rx="6" fill="#3D3241" />
      <circle cx="64" cy="133" r="5" fill="#3CCB9A" />
      <rect x="70" y="174" width="26" height="22" rx="4" fill="#fff" />
    </g>
  ),
  boss: (
    <g>
      <rect width="500" height="300" fill="#FDE3D0" />
      <rect x="290" y="40" width="160" height="110" rx="10" fill="#FFFDF8" stroke="#E8C9A6" strokeWidth="4" />
      <text x="370" y="104" textAnchor="middle" className="cm-sign dark">
        BOSS
      </text>
      <rect y="300" width="500" height="200" fill="#F7C6B6" />
      <rect x="240" y="330" width="300" height="24" rx="12" fill="#F7E3C8" />
      <rect x="250" y="350" width="280" height="160" fill="#B97A4B" />
      <rect x="250" y="350" width="280" height="10" fill="#FFC53D" />
    </g>
  ),
  party: (
    <g>
      <rect width="500" height="300" fill="#FFE7C4" />
      <path d="M0 40 Q125 90 250 40 T500 40" fill="none" stroke="#8C6E5A" strokeWidth="3" />
      {[30, 90, 150, 210, 270, 330, 390, 450].map((x, i) => (
        <path key={x} d={`M${x - 14} ${50 + Math.abs(Math.sin(x / 80)) * 18} l14 28 l14 -28 z`} fill={['#FF7B8A', '#52B8FF', '#FFC53D', '#3CCB9A', '#A88BFF'][i % 5]} />
      ))}
      <rect y="300" width="500" height="200" fill="#D3E8D5" />
    </g>
  ),
};

const CONFETTI = ['#FF7B8A', '#52B8FF', '#FFC53D', '#3CCB9A', '#A88BFF'];

function Fx({ fx }: { fx: ComicPanel['fx'] }) {
  if (fx === 'confetti')
    return (
      <div className="cm-confetti">
        {Array.from({ length: 34 }, (_, i) => (
          <i key={i} style={{ left: `${(i * 29) % 100}%`, top: `${(i * 47) % 70}%`, background: CONFETTI[i % 5], transform: `rotate(${i * 37}deg)` }} />
        ))}
      </div>
    );
  if (fx === 'rain')
    return (
      <svg className="cm-rain" viewBox="0 0 140 110" aria-hidden="true">
        <path d="M20 54 a18 18 0 0 1 8 -34 a26 26 0 0 1 50 -6 a20 20 0 0 1 36 18 a16 16 0 0 1 -4 32 z" fill="#8F9BB0" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M40 74 l-6 14 M70 74 l-6 14 M100 74 l-6 14 M55 92 l-5 12 M85 92 l-5 12" stroke="#52B8FF" strokeWidth="5" strokeLinecap="round" />
      </svg>
    );
  if (fx === 'stamp-ok' || fx === 'stamp-no')
    return <div className={`cm-stamp ${fx === 'stamp-ok' ? 'ok' : 'no'}`}>{fx === 'stamp-ok' ? 'APPROVED' : 'TRY AGAIN'}</div>;
  if (fx === 'sparkle')
    return (
      <svg className="cm-sparkle" viewBox="0 0 60 60" aria-hidden="true">
        <path d="M30 2 L36 24 L58 30 L36 36 L30 58 L24 36 L2 30 L24 24 Z" fill="#FFC53D" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      </svg>
    );
  return null;
}

function Panel({ panel, index }: { panel: ComicPanel; index: number }) {
  const two = panel.actors.length > 1;
  return (
    <div className={`cm-panel set-${panel.set}`}>
      <svg className="cm-bg" viewBox="0 0 500 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {SETS[panel.set]}
      </svg>
      <div className="cm-caption">
        <b>{index + 1}</b> {panel.caption}
      </div>
      {panel.actors.map((a, i) => (
        <div key={a.id + i} className={`cm-actor ${two ? (i === 0 ? 'left' : 'right') : 'solo'}`}>
          {a.says && <div className={`cm-bubble ${two ? (i === 0 ? 'tail-left' : 'tail-right') : ''}`}>{a.says}</div>}
          <div className="cm-figure" style={{ transform: a.flip ? 'scaleX(-1)' : undefined }}>
            <AgentSprite look={lookFor(a.id)} role={a.role} arms={a.arms} expression={a.expression} prop={a.prop} />
          </div>
        </div>
      ))}
      {panel.set === 'desk' && <div className="cm-desk" />}
      <Fx fx={panel.fx} />
    </div>
  );
}

/** A four-panel comic of the day. 1080×1080. */
export function Comic({ data }: { data: ComicData }) {
  return (
    <div className="cm-post">
      <header className="cm-head">
        <span className="cm-title">“{data.title}”</span>
        <span className="cm-issue">Cubicle Club Comics · Day {data.day}</span>
      </header>
      <div className="cm-grid">
        {data.panels.map((p, i) => (
          <Panel key={i} panel={p} index={i} />
        ))}
      </div>
      <footer className="cm-foot">
        <LogoMark size={30} /> Made with Cubicle Club
      </footer>
    </div>
  );
}
