import { useEffect, useState } from 'react';
import { closeApproval, useOffice } from '../core/store';
import { resolveApproval } from '../core/runtime';
import { ROLES } from '../content/roster';
import { play } from '../audio/sfx';
import { Avatar, Modal } from './bits';

type Verdict = 'approved' | 'rejected';

export function ApprovalModal() {
  const taskId = useOffice((s) => s.ui.approvalTaskId);
  const task = useOffice((s) => (taskId ? s.tasks[taskId] : undefined));
  const agent = useOffice((s) => (task ? s.agents[task.agentId] : undefined));
  const [stamp, setStamp] = useState<Verdict | null>(null);

  useEffect(() => setStamp(null), [taskId]);

  if (!taskId || !task || !agent) return null;
  const pending = task.approval?.state === 'pending';

  const decide = (verdict: Verdict) => {
    if (stamp || !pending) return;
    setStamp(verdict);
    setTimeout(() => play('stamp'), 140);
    setTimeout(() => resolveApproval(taskId, verdict === 'approved'), 400);
    setTimeout(closeApproval, 1400);
  };

  const role = ROLES[agent.info.role];
  return (
    <Modal onClose={closeApproval} className="approval-modal" label="Approval request">
      <div className={`paper ${stamp ? 'stamped' : ''}`}>
        <div className="paper-head">
          <span className="paper-kicker">Request for approval</span>
          <span className="paper-no">No. {task.id.replace(/\D/g, '').padStart(4, '0')}</span>
        </div>
        <div className="paper-from">
          <Avatar id={agent.info.id} role={agent.info.role} size={46} />
          <div>
            <strong>{agent.info.name}</strong>
            <span>
              {role.label} · working on “{task.title}”
            </span>
          </div>
        </div>
        <p className="paper-request">{task.approval?.request ?? 'Okay to continue?'}</p>
        <dl className="paper-meta">
          {task.meta.tool && (
            <>
              <dt>Using</dt>
              <dd>{task.meta.tool}</dd>
            </>
          )}
          {task.meta.routine && (
            <>
              <dt>Routine</dt>
              <dd>{task.meta.routine}</dd>
            </>
          )}
          {task.meta.trigger && (
            <>
              <dt>Started by</dt>
              <dd>{task.meta.trigger}</dd>
            </>
          )}
        </dl>
        {pending || stamp ? (
          <div className="paper-actions">
            <button className="btn btn-bad btn-big" onClick={() => decide('rejected')} disabled={!!stamp}>
              Reject
            </button>
            <button className="btn btn-good btn-big" onClick={() => decide('approved')} disabled={!!stamp}>
              Approve
            </button>
          </div>
        ) : (
          <p className="paper-done">Already handled. {task.approval?.state === 'approved' ? 'You said yes.' : 'You said no.'}</p>
        )}
        {stamp && <div className={`stamp stamp-${stamp}`}>{stamp === 'approved' ? 'APPROVED' : 'REJECTED'}</div>}
      </div>
    </Modal>
  );
}
