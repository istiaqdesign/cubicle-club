import type { CSSProperties } from 'react';
import type { RoleId } from '../../core/types';
import { activeAgents, office } from '../../core/store';
import { achievementById, levelTitle } from '../../core/progression';
import { FUNNY_CATEGORIES } from '../../content/lines';
import { ROLES, lookFor } from '../../content/roster';
import { AgentSprite } from '../../scene/AgentSprite';
import { Avatar, LogoMark, Pin } from '../bits';

export type Format = 'square' | 'story';
export const SIZES: Record<Format, { w: number; h: number }> = { square: { w: 1080, h: 1080 }, story: { w: 1080, h: 1920 } };

export interface ReportData {
  date: string;
  day: number;
  done: number;
  handoffs: number;
  fixed: number;
  approvals: number;
  hours: string;
  eod?: { id: string; name: string; role: RoleId; title: string; doneToday: number };
  quote: { text: string; id?: string; name: string; role?: RoleId };
  team: { id: string; name: string; role: RoleId; doneToday: number }[];
  pins: string[];
}

export function buildReport(): ReportData {
  const s = office.get();
  const order = activeAgents(s);
  const team = order.map((id) => ({ id, name: s.agents[id].info.name, role: s.agents[id].info.role, doneToday: s.agents[id].doneToday }));
  const best = [...order].sort((a, b) => s.agents[b].doneToday - s.agents[a].doneToday || s.agents[b].lifetimeDone - s.agents[a].lifetimeDone)[0];
  const funny = s.spoken.filter((l) => FUNNY_CATEGORIES.includes(l.category as never));
  const pool = funny.length ? funny : s.spoken;
  const picked = pool[Math.floor(Math.random() * pool.length)];
  const quoteAgent = picked ? s.agents[picked.agentId] : undefined;
  return {
    date: new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
    day: s.day,
    done: s.stats.done,
    handoffs: s.stats.handoffs,
    fixed: s.stats.fixed,
    approvals: s.stats.approved + s.stats.rejected,
    hours: (s.stats.workedMinutes / 60).toFixed(1),
    eod: best
      ? { id: best, name: s.agents[best].info.name, role: s.agents[best].info.role, title: levelTitle(s.agents[best].lifetimeDone), doneToday: s.agents[best].doneToday }
      : undefined,
    quote: picked && quoteAgent
      ? { text: picked.text, id: quoteAgent.info.id, name: quoteAgent.info.name, role: quoteAgent.info.role }
      : { text: 'Rewrote the intro for the 4th time. Send snacks.', name: 'The whole team' },
    team,
    pins: [...new Set(order.flatMap((id) => s.agents[id].achievements))],
  };
}

export function Poster({ data, format }: { data: ReportData; format: Format }) {
  const { eod, quote } = data;
  return (
    <div className={`poster poster-${format}`}>
      <div className="p-inner">
        <header className="p-head">
          <span className="p-brand">
            <LogoMark size={46} /> Cubicle Club
          </span>
          <span className="p-date">
            {data.date} · Day {data.day}
          </span>
        </header>

        <div className="p-hero">
          <div className="p-left">
            <div className="p-kicker">Daily shift report</div>
            <div className="p-big">
              <span className="p-num">{data.done}</span>
              <span className="p-lbl">tasks shipped today</span>
            </div>
            <div className="p-stats">
              <div>
                <b>{data.handoffs}</b>
                <span>handoffs</span>
              </div>
              <div>
                <b>{data.fixed}</b>
                <span>bugs squashed</span>
              </div>
              <div>
                <b>{data.approvals}</b>
                <span>stamps by the boss</span>
              </div>
              <div>
                <b>{data.hours}</b>
                <span>hours worked</span>
              </div>
            </div>
          </div>
          {eod && (
            <div className="p-eod">
              <div className="p-burst" style={{ '--c': ROLES[eod.role].color } as CSSProperties}>
                <AgentSprite look={lookFor(eod.id)} role={eod.role} arms="up" expression="joy" />
              </div>
              <div className="p-ribbon">Employee of the Day</div>
              <div className="p-eod-name">{eod.name}</div>
              <div className="p-eod-sub">
                {eod.title} {ROLES[eod.role].label} · {eod.doneToday} tasks
              </div>
            </div>
          )}
        </div>

        <div className="p-quote">
          <div className="p-bubble">“{quote.text}”</div>
          <div className="p-quote-by">
            {quote.id && quote.role && <Avatar id={quote.id} role={quote.role} size={56} />}
            <span>
              Line of the day · <b>{quote.name}</b>
            </span>
          </div>
        </div>

        <footer className="p-foot">
          <div className="p-team">
            {data.team.map((m) => (
              <span key={m.id} className="p-member">
                <Avatar id={m.id} role={m.role} size={format === 'story' ? 92 : 64} />
                <b>{m.doneToday}</b>
              </span>
            ))}
          </div>
          {data.pins.length > 0 && (
            <div className="p-pins">
              {data.pins.slice(0, 6).map((p) => (
                <span key={p} className="p-pin">
                  <Pin id={p} size={format === 'story' ? 64 : 46} />
                  {format === 'story' && <small>{achievementById[p]?.name}</small>}
                </span>
              ))}
            </div>
          )}
          <span className="p-watermark">
            <LogoMark size={26} /> Made with Cubicle Club
          </span>
        </footer>
      </div>
    </div>
  );
}
