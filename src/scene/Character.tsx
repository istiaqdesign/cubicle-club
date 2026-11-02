import { useOffice, openApproval, openProfile } from '../core/store';
import { ROLES, useLook } from '../content/roster';
import { AgentSprite, type ArmPose, type Expression } from './AgentSprite';
import { useScene } from './sceneStore';
import { CHAR, STAGE, seatZ } from './layout';
import { Confetti, ProudStar, RainCloud } from './Effects';

const cx = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(' ');

const IDLE_ARMS: Partial<Record<string, ArmPose>> = {
  coffee: 'mug',
  stretch: 'up',
  plane: 'up',
  phone: 'phone',
  juggle: 'juggle',
};

export function Character({ id }: { id: string }) {
  const sa = useScene((s) => s.agents[id]);
  const agent = useOffice((s) => s.agents[id]);
  const focus = useOffice((s) => s.settings.focus);
  const rival = useScene((s) => !!s.rivalry && (s.rivalry.a === id || s.rivalry.b === id));
  const look = useLook(id);
  if (!sa || !agent) return null;

  const role = agent.info.role;
  const seated = sa.seated;
  const idleAtDesk = seated && agent.status === 'idle';
  const idle = idleAtDesk ? sa.idle : 'none';
  const working = seated && agent.status === 'working';
  const napping = idle === 'nap';
  const waitingAtBoss = agent.status === 'waiting' && !seated && !sa.walking && sa.prop === 'paper';

  let arms: ArmPose = 'rest';
  if (sa.prop === 'mug') arms = 'mug';
  else if (sa.prop !== 'none') arms = 'hold';
  else if (sa.pose === 'clap') arms = 'clap';
  else if (sa.react === 'joy' && !seated) arms = 'up';
  else if (working) arms = 'type';
  else arms = IDLE_ARMS[idle] ?? 'rest';

  let expression: Expression = 'neutral';
  if (sa.react === 'joy' || sa.pose === 'clap') expression = 'joy';
  else if (sa.react === 'sad' || agent.status === 'error') expression = 'sad';
  else if (napping) expression = 'sleep';
  else if (sa.tired) expression = 'tired';
  else if (idle === 'stretch' || idle === 'plane' || idle === 'music') expression = 'joy';
  else if (idle === 'phone' || agent.streak >= 3) expression = 'smug';
  else if (working) expression = 'focus';

  // Keep bubbles inside the room when standing near a wall.
  const edge = sa.x < 150 ? 'edge-left' : sa.x > STAGE.w - 150 ? 'edge-right' : undefined;

  const onClick = () => {
    if (agent.status === 'waiting' && agent.taskId && !seated) openApproval(agent.taskId);
    else openProfile(id);
  };

  return (
    <div
      className={cx('char', edge)}
      style={{
        transform: `translate(${sa.x - CHAR.w / 2}px, ${sa.y - CHAR.h}px)`,
        transitionDuration: `${sa.dur}ms`,
        zIndex: seated ? seatZ(sa.slot) : sa.z,
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`${agent.info.name}, ${ROLES[role].label}`}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
    >
      <div className="char-flip" style={{ transform: `scaleX(${sa.facing})` }}>
        <div key={sa.jump} className={cx('char-anim', sa.walking && 'walking', sa.jump > 0 && 'jump', idle !== 'none' && `idle-${idle}`)}>
          <AgentSprite look={look} role={role} arms={arms} expression={expression} prop={sa.prop} />
          {working && <div className="screen-glow" style={{ background: ROLES[role].color }} />}
        </div>
      </div>
      {napping && (
        <div className="zzz" aria-hidden="true">
          <span>z</span>
          <span>z</span>
          <span>Z</span>
        </div>
      )}
      {idle === 'music' && (
        <div className="notes" aria-hidden="true">
          <span>♪</span>
          <span>♫</span>
          <span>♪</span>
        </div>
      )}
      {agent.streak >= 3 && !napping && <ProudStar />}
      {sa.rain && <RainCloud />}
      {waitingAtBoss && <div className="needs-you">!</div>}
      {sa.bubble ? (
        <div key={`bubble-${sa.bubble.key}`} className="bubble">
          {sa.bubble.text}
        </div>
      ) : (
        working &&
        !focus && (
          <div className="thought" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        )
      )}
      {sa.confetti > 0 && <Confetti key={`confetti-${sa.confetti}`} />}
      {sa.ribbon && (
        <div key={`ribbon-${sa.ribbon.key}`} className="ribbon">
          {sa.ribbon.text}
        </div>
      )}
      {sa.sticker && (
        <div key={`sticker-${sa.sticker.key}`} className={`grade-sticker tone-${sa.sticker.tone}`}>
          {sa.sticker.text}
        </div>
      )}
      {rival && !sa.bubble && (
        <svg className="rival-mark" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M13 2L5 13h6l-1 9 8-11h-6z" fill="#FFC53D" stroke="#3A2E2A" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}
