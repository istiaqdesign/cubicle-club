import type { ReactNode } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useOffice, openApproval, pendingApprovals } from '../core/store';
import { levelTitle } from '../core/progression';
import { ROLES, useLook, type DeskItem } from '../content/roster';
import { BOSS, desk } from './layout';
import { DeskBug } from './Effects';

const DESK_ITEMS: Record<DeskItem, ReactNode> = {
  plant: (
    <g>
      <path d="M30 12 Q22 0 26 -8 Q32 0 30 12 M30 12 Q36 -4 44 -4 Q40 6 30 12 M30 12 Q20 4 14 6 Q20 14 30 12" fill="#5DBB7A" />
      <path d="M21 12 H39 L37 28 H23 Z" fill="#E9876A" />
    </g>
  ),
  books: (
    <g>
      <rect x="14" y="20" width="34" height="8" rx="2" fill="#52B8FF" />
      <rect x="17" y="12" width="30" height="8" rx="2" fill="#FF7B8A" />
      <rect x="15" y="4" width="28" height="8" rx="2" fill="#FFC53D" />
    </g>
  ),
  lamp: (
    <g>
      <rect x="20" y="24" width="22" height="5" rx="2.5" fill="#5A4A5E" />
      <path d="M31 24 L26 6" stroke="#5A4A5E" strokeWidth="3" strokeLinecap="round" />
      <path d="M16 8 Q26 -6 38 6 Z" fill="#FFC53D" />
    </g>
  ),
  cactus: (
    <g>
      <path d="M31 14 V-4 Q31 -10 26 -10 Q21 -10 21 -4 V14 M21 4 Q14 4 14 -2 M31 2 Q37 2 37 -4" stroke="#4CAF6E" strokeWidth="7" strokeLinecap="round" fill="none" />
      <circle cx="26" cy="-11" r="3" fill="#FF7B8A" />
      <path d="M16 12 H36 L34 28 H18 Z" fill="#A88BFF" />
    </g>
  ),
  pens: (
    <g>
      <path d="M22 10 L18 -6 M28 10 V-8 M34 10 L39 -4" stroke="#3A2E2A" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="18" cy="-6" r="2.2" fill="#FF7B8A" />
      <circle cx="28" cy="-8" r="2.2" fill="#52B8FF" />
      <circle cx="39" cy="-4" r="2.2" fill="#FFC53D" />
      <rect x="18" y="8" width="22" height="20" rx="4" fill="#3CCB9A" />
    </g>
  ),
};

export function Desk({ id }: { id: string }) {
  const agent = useOffice((s) => s.agents[id]);
  const look = useLook(id);
  if (!agent) return null;
  const d = desk(agent.slot);
  const role = ROLES[agent.info.role];

  return (
    <>
      <div className="chair" style={{ left: d.x - 38, top: d.seatY - 94, zIndex: d.z - 12 }}>
        <svg viewBox="0 0 76 70" width="76" height="70" aria-hidden="true">
          <rect x="4" y="0" width="68" height="66" rx="22" style={{ fill: role.dark }} />
          <rect x="13" y="8" width="50" height="44" rx="15" fill="#fff" opacity="0.16" />
        </svg>
      </div>
      <div className="desk" style={{ left: d.x - 110, top: d.deskTop - 12, zIndex: d.z }}>
        <svg viewBox="0 -12 220 132" width="220" height="132" aria-hidden="true">
          <g transform="translate(0 0)">{DESK_ITEMS[look.deskItem]}</g>
          <g>
            <rect x="60" y="15" width="13" height="14" rx="3" fill="#fff" stroke="#D9C9B6" strokeWidth="1.4" />
            <path d="M73 18 q5 0 5 4.5 q0 4.5 -5 4.5" fill="none" stroke="#D9C9B6" strokeWidth="2" />
          </g>
          <rect x="132" y="2" width="58" height="28" rx="4" fill="#ECE6F2" stroke="#CFC6DA" strokeWidth="1.5" />
          <circle cx="161" cy="15" r="4.5" style={{ fill: role.color }} />
          <rect x="126" y="28" width="70" height="4" rx="2" fill="#CFC6D8" />
          <rect x="2" y="28" width="216" height="16" rx="8" style={{ fill: 'var(--scene-desk-top)', stroke: 'var(--scene-desk-edge)' }} strokeWidth="1.5" />
          <path d="M8 42 H212 V108 Q212 118 202 118 H18 Q8 118 8 108 Z" style={{ fill: 'var(--scene-desk-front)' }} />
          <rect x="8" y="42" width="204" height="6" style={{ fill: role.color }} />
          <rect x="16" y="60" width="42" height="40" rx="7" fill="#000" opacity="0.06" />
          <circle cx="37" cy="72" r="3" fill="#fff" opacity="0.7" />
          <rect x="162" y="60" width="42" height="40" rx="7" fill="#000" opacity="0.06" />
          <circle cx="183" cy="72" r="3" fill="#fff" opacity="0.7" />
          <rect x="66" y="58" width="88" height="40" rx="9" fill="#FFFDF8" style={{ stroke: role.color }} strokeWidth="2.5" />
          <text x="110" y="77" textAnchor="middle" className="np-name">
            {agent.info.name}
          </text>
          <text x="110" y="91" textAnchor="middle" className="np-title">
            {levelTitle(agent.lifetimeDone)} {role.label}
          </text>
          {agent.status === 'error' && (
            <g transform="translate(100 30)">
              <DeskBug />
            </g>
          )}
        </svg>
      </div>
    </>
  );
}

export function BossDesk() {
  const pending = useOffice(useShallow(pendingApprovals));
  const open = () => pending[0] && openApproval(pending[0]);

  return (
    <>
      <div className="chair boss-chair" style={{ left: BOSS.x - 50, top: BOSS.deskTop - 72, zIndex: BOSS.z - 12 }}>
        <svg viewBox="0 0 100 90" width="100" height="90" aria-hidden="true">
          <rect x="6" y="0" width="88" height="86" rx="28" fill="#B9475A" />
          <rect x="18" y="10" width="64" height="58" rx="20" fill="#fff" opacity="0.14" />
          <circle cx="50" cy="28" r="5" fill="#FFD36B" />
        </svg>
      </div>
      <div
        className={`desk boss-desk ${pending.length ? 'has-pending' : ''}`}
        style={{ left: BOSS.x - 140, top: BOSS.deskTop - 14, zIndex: BOSS.z }}
        onClick={open}
        role="button"
        tabIndex={0}
        aria-label={pending.length ? `Your desk: ${pending.length} approvals waiting` : 'Your desk'}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && open()}
      >
        <svg viewBox="0 -14 280 144" width="280" height="144" aria-hidden="true">
          {/* inbox tray */}
          <g>
            <path d="M18 14 H78 L74 30 H22 Z" fill="#8C6E5A" />
            {pending.length > 0 && (
              <g className="inbox-papers">
                <rect x="26" y="0" width="44" height="18" rx="2" fill="#fff" stroke="#E0D3C3" transform="rotate(-4 48 9)" />
                <rect x="28" y="4" width="44" height="16" rx="2" fill="#FFFDF8" stroke="#E0D3C3" />
              </g>
            )}
          </g>
          {/* rubber stamp + ink pad */}
          <rect x="196" y="22" width="44" height="9" rx="3" fill="#3A2E2A" />
          <rect x="199" y="20" width="38" height="5" rx="2" fill="#F2545B" />
          <g transform="translate(216 -4)">
            <rect x="-11" y="16" width="22" height="8" rx="2" fill="#5A4A5E" />
            <rect x="-4" y="2" width="8" height="15" fill="#C98F5E" />
            <circle cx="0" cy="0" r="7" fill="#E07A5F" />
          </g>
          {/* mug */}
          <rect x="112" y="13" width="16" height="17" rx="4" fill="#FFC53D" />
          <path d="M128 17 q6 0 6 5 q0 5 -6 5" fill="none" stroke="#FFC53D" strokeWidth="2.4" />
          <rect x="2" y="30" width="276" height="18" rx="9" fill="#F7E3C8" stroke="#C9935F" strokeWidth="1.5" />
          <path d="M8 46 H272 V116 Q272 128 260 128 H20 Q8 128 8 116 Z" fill="#B97A4B" />
          <rect x="8" y="46" width="264" height="7" fill="#FFC53D" />
          <rect x="88" y="66" width="104" height="44" rx="10" fill="#FFF6D6" stroke="#E0A215" strokeWidth="2.5" />
          <text x="140" y="86" textAnchor="middle" className="np-name">
            THE BOSS
          </text>
          <text x="140" y="101" textAnchor="middle" className="np-title">
            (that's you)
          </text>
        </svg>
        {pending.length > 0 && <span className="inbox-badge">{pending.length}</span>}
      </div>
    </>
  );
}
