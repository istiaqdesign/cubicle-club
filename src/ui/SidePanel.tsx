import { useShallow } from 'zustand/react/shallow';
import { formatClock, openProfile, pendingApprovals, useOffice } from '../core/store';
import { levelProgress, levelTitle } from '../core/progression';
import { ROLES } from '../content/roster';
import { Avatar, Pin } from './bits';

function Tiles() {
  const stats = useOffice((s) => s.stats);
  const waiting = useOffice(useShallow(pendingApprovals)).length;
  const tiles = [
    { label: 'Done today', value: stats.done, tone: 'good' },
    { label: 'Handoffs', value: stats.handoffs, tone: 'move' },
    { label: 'Bugs squashed', value: stats.fixed, tone: 'bad' },
    { label: 'Waiting on you', value: waiting, tone: waiting ? 'ask pulse' : 'ask' },
  ];
  return (
    <div className="tiles">
      {tiles.map((t) => (
        <div key={t.label} className={`tile tone-${t.tone}`}>
          <span className="tile-num">{t.value}</span>
          <span className="tile-label">{t.label}</span>
        </div>
      ))}
    </div>
  );
}

function Team() {
  const order = useOffice((s) => s.agentOrder);
  const agents = useOffice((s) => s.agents);
  return (
    <ul className="team">
      {order.map((id) => {
        const a = agents[id];
        const role = ROLES[a.info.role];
        return (
          <li key={id}>
            <button className="team-row" onClick={() => openProfile(id)}>
              <Avatar id={id} role={a.info.role} size={38} />
              <span className="team-text">
                <span className="team-name">
                  {a.info.name} <span className={`status-dot s-${a.status}`} title={a.status} />
                </span>
                <span className="team-title">
                  {levelTitle(a.lifetimeDone)} {role.label}
                </span>
                <span className="xp">
                  <i style={{ width: `${Math.round(levelProgress(a.lifetimeDone) * 100)}%`, background: role.color }} />
                </span>
              </span>
              <span className="team-pins">
                {a.achievements.slice(-3).map((p) => (
                  <Pin key={p} id={p} size={22} />
                ))}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Feed() {
  const feed = useOffice((s) => s.feed);
  const agents = useOffice((s) => s.agents);
  return (
    <ol className="feed">
      {feed.slice(0, 25).map((f) => {
        const a = f.agentId ? agents[f.agentId] : undefined;
        return (
          <li key={f.id} className={`memo tone-${f.tone}`}>
            {a && <Avatar id={a.info.id} role={a.info.role} size={24} />}
            <span className="memo-text">{f.text}</span>
            <time>{formatClock(f.clock)}</time>
          </li>
        );
      })}
    </ol>
  );
}

export function SidePanel() {
  return (
    <aside className="panel">
      <Tiles />
      <section>
        <h3>The team</h3>
        <Team />
      </section>
      <section className="feed-section">
        <h3>Office memos</h3>
        <Feed />
      </section>
    </aside>
  );
}
