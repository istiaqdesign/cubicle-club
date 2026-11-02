import { ACHIEVEMENTS, levelProgress, levelTitle, nextLevelAt } from '../core/progression';
import { closeProfile, openDressingRoom, openShare, useOffice } from '../core/store';
import { ROLES, useLook } from '../content/roster';
import { AgentSprite } from '../scene/AgentSprite';
import { Icon, Pin } from './bits';

const STATUS_TEXT = {
  idle: 'On a break',
  working: 'Working',
  error: 'Fighting a bug',
  waiting: 'Waiting for your OK',
} as const;

export function Profile() {
  const id = useOffice((s) => s.ui.profileAgentId);
  const agent = useOffice((s) => (id ? s.agents[id] : undefined));
  const task = useOffice((s) => (agent?.taskId ? s.tasks[agent.taskId] : undefined));
  const look = useLook(id ?? '');
  if (!id || !agent) return null;

  const role = ROLES[agent.info.role];
  const next = nextLevelAt(agent.lifetimeDone);
  return (
    <div className="profile" role="dialog" aria-label={`${agent.info.name}'s profile`}>
      <button className="modal-close btn-icon" onClick={closeProfile} aria-label="Close">
        <Icon name="close" />
      </button>
      <div className="profile-hero" style={{ background: role.color }}>
        <AgentSprite look={look} role={agent.info.role} arms="up" expression="joy" />
      </div>
      <h3>{agent.info.name}</h3>
      <p className="profile-title">
        {levelTitle(agent.lifetimeDone)} {role.label}
      </p>
      <div className="xp big">
        <i style={{ width: `${Math.round(levelProgress(agent.lifetimeDone) * 100)}%`, background: role.color }} />
      </div>
      <p className="profile-next">{next ? `${next - agent.lifetimeDone} tasks to ${levelTitle(next)}` : 'Max level. A true legend.'}</p>
      <dl className="profile-stats">
        <div>
          <dt>Today</dt>
          <dd>{agent.doneToday}</dd>
        </div>
        <div>
          <dt>All time</dt>
          <dd>{agent.lifetimeDone}</dd>
        </div>
        <div>
          <dt>Streak</dt>
          <dd>{agent.streak}</dd>
        </div>
      </dl>
      <p className="profile-status">
        <strong>{STATUS_TEXT[agent.status]}</strong>
        {task ? ` · ${task.title}` : ''}
      </p>
      <div className="profile-pins">
        {ACHIEVEMENTS.map((a) => (
          <span key={a.id} className={agent.achievements.includes(a.id) ? '' : 'locked'}>
            <Pin id={a.id} size={34} title />
          </span>
        ))}
      </div>
      {agent.review && <p className="profile-review">Last review: <b>{agent.review.grade}</b></p>}
      <div className="profile-actions">
        <button className="btn btn-paper btn-small" onClick={() => openDressingRoom(id)}>
          <Icon name="shirt" /> Dress up
        </button>
        <button className="btn btn-paper btn-small" onClick={() => openShare('card', id)}>
          <Icon name="camera" /> Trading card
        </button>
      </div>
    </div>
  );
}
