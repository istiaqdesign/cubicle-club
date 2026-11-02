import type { CSSProperties } from 'react';
import type { CardData } from '../../share/build';
import { ROLES, lookFor } from '../../content/roster';
import { AgentSprite } from '../../scene/AgentSprite';
import { LogoMark, Pin } from '../bits';

/** An agent trading card on a 1080×1350 post. Rarity follows their level. */
export function TradingCard({ data }: { data: CardData }) {
  const role = ROLES[data.role];
  const holo = data.rarity.gems >= 3;
  return (
    <div className="tc-post" style={{ '--rar': data.rarity.color, '--rar-deep': data.rarity.deep, '--c': role.color, '--c-dark': role.dark } as CSSProperties}>
      <div className="tc-sparkles" aria-hidden="true">
        {Array.from({ length: 14 }, (_, i) => (
          <i key={i} style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, transform: `scale(${0.6 + ((i * 7) % 5) / 6})` }} />
        ))}
      </div>
      <div className={`tc-card rar-${data.rarity.id}`}>
        <div className="tc-face">
          <header className="tc-top">
            <span className="tc-name">{data.name}</span>
            <span className="tc-power">
              <small>PWR</small>
              {data.power}
            </span>
          </header>
          <div className="tc-art">
            <div className="tc-burst" />
            <AgentSprite look={lookFor(data.id)} role={data.role} arms="up" expression="joy" />
            {holo && <div className="tc-holo" />}
            <span className="tc-level">{data.title}</span>
          </div>
          <div className="tc-type">
            <span>
              {data.title} {role.label}
            </span>
            <span className="tc-gems">
              {Array.from({ length: 5 }, (_, i) => (
                <i key={i} className={i < data.rarity.gems ? 'on' : ''} />
              ))}
              {data.rarity.label}
            </span>
          </div>
          <div className="tc-move">
            <b>{data.move.name}</b>
            <span>{data.move.text}</span>
          </div>
          <div className="tc-stats">
            {data.stats.map((st) => (
              <div key={st.name} className="tc-stat">
                <span>{st.name}</span>
                <i>
                  <b style={{ width: `${st.value}%` }} />
                </i>
                <em>{st.value}</em>
              </div>
            ))}
          </div>
          <p className="tc-quote">“{data.quote}”</p>
          <footer className="tc-foot">
            <span>
              #{String(data.number).padStart(3, '0')}/{String(data.total).padStart(3, '0')} · Series 1 · Day {data.day}
            </span>
            <span className="tc-pins">
              {data.pins.slice(0, 4).map((p) => (
                <Pin key={p} id={p} size={34} />
              ))}
            </span>
          </footer>
        </div>
      </div>
      <div className="tc-collect">
        <LogoMark size={40} />
        <span>
          Collect the whole office · <b>Made with Cubicle Club</b>
        </span>
      </div>
    </div>
  );
}
