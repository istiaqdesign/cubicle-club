import { useEffect } from 'react';
import { dismissToast, openApproval, useOffice, type Toast } from '../core/store';
import { Avatar, Pin } from './bits';

function ToastItem({ toast, more = 0 }: { toast: Toast; more?: number }) {
  const agent = useOffice((s) => (toast.agentId ? s.agents[toast.agentId] : undefined));

  useEffect(() => {
    if (toast.kind === 'approval') return;
    const t = setTimeout(() => dismissToast(toast.id), 6500);
    return () => clearTimeout(t);
  }, [toast.id, toast.kind]);

  if (toast.kind === 'approval') {
    return (
      <div className="toast toast-sticky" role="status">
        {agent && <Avatar id={agent.info.id} role={agent.info.role} size={34} />}
        <div className="toast-text">
          <strong>{toast.title}</strong>
          <span>{toast.body}</span>
          {more > 0 && <small className="toast-more">+{more} more waiting at your desk</small>}
        </div>
        <button className="btn btn-primary btn-small" onClick={() => toast.taskId && openApproval(toast.taskId)}>
          Review
        </button>
      </div>
    );
  }

  if (toast.kind === 'levelup') {
    return (
      <div className="toast toast-ribbon" role="status" onClick={() => dismissToast(toast.id)}>
        <span className="ribbon-tail left" />
        {agent && <Avatar id={agent.info.id} role={agent.info.role} size={34} />}
        <div className="toast-text">
          <strong>{toast.title}</strong>
          <span>{toast.body}</span>
        </div>
        <span className="ribbon-tail right" />
      </div>
    );
  }

  if (toast.kind === 'memo') {
    return (
      <div className="toast toast-memo" role="status" onClick={() => dismissToast(toast.id)}>
        <div className="toast-text">
          <small>Office memo</small>
          <strong>{toast.title}</strong>
          <span>{toast.body}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="toast toast-pin" role="status" onClick={() => dismissToast(toast.id)}>
      {toast.achievementId && <Pin id={toast.achievementId} size={44} />}
      <div className="toast-text">
        <small>Achievement unlocked</small>
        <strong>{toast.title}</strong>
        <span>{toast.body}</span>
      </div>
    </div>
  );
}

export function Toasts() {
  const toasts = useOffice((s) => s.toasts);
  const approvals = toasts.filter((t) => t.kind === 'approval');
  const others = toasts.filter((t) => t.kind !== 'approval').slice(-3);
  return (
    <div className="toasts" aria-live="polite">
      {others.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
      {approvals[0] && <ToastItem key={approvals[0].id} toast={approvals[0]} more={approvals.length - 1} />}
    </div>
  );
}
