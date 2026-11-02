import { closeBoard, openApproval, useOffice, type TaskState } from '../core/store';
import { COLUMNS } from '../core/board';
import { ROLES } from '../content/roster';
import { Avatar, Modal } from './bits';

// Stable little tilt per card so the board feels hand-pinned.
const tilt = (id: string) => ((id.charCodeAt(id.length - 1) % 5) - 2) * 0.6;

function Card({ task }: { task: TaskState }) {
  const agent = useOffice((s) => s.agents[task.agentId]);
  if (!agent) return null;
  const role = ROLES[agent.info.role];
  return (
    <article className="card" style={{ ['--tilt' as string]: `${tilt(task.id)}deg`, ['--tape' as string]: role.color }}>
      <header>
        <Avatar id={agent.info.id} role={agent.info.role} size={30} />
        <span className="card-who">
          {agent.info.name}
          <small>{role.label}</small>
        </span>
      </header>
      <p className="card-title">{task.title}</p>
      <footer>
        {task.meta.tool && <span className="tag">{task.meta.tool}</span>}
        {task.handoffs > 0 && <span className="tag">↪ {task.handoffs}</span>}
        {task.error && <span className="tag tag-bad">bug!</span>}
        {task.hadError && !task.error && task.status === 'done' && <span className="tag tag-good">fixed</span>}
        {task.status === 'review' && (
          <button className="btn btn-primary btn-small" onClick={() => openApproval(task.id)}>
            Review
          </button>
        )}
      </footer>
      {task.meta.routine && <span className="card-routine">{task.meta.routine}</span>}
    </article>
  );
}

export function Board() {
  const open = useOffice((s) => s.ui.board);
  const tasks = useOffice((s) => s.tasks);
  const order = useOffice((s) => s.taskOrder);
  if (!open) return null;

  return (
    <Modal onClose={closeBoard} className="board-modal" label="Team board">
      <div className="whiteboard">
        <h2>Team board</h2>
        <div className="columns">
          {COLUMNS.map((col) => {
            let ids = order.filter((id) => tasks[id]?.status === col.id);
            const total = ids.length;
            ids = col.id === 'done' ? ids.slice(-12).reverse() : ids;
            return (
              <section key={col.id} className={`column col-${col.id}`}>
                <h3>
                  {col.label} <span className="count">{total}</span>
                </h3>
                <div className="column-cards">
                  {ids.map((id) => (
                    <Card key={id} task={tasks[id]} />
                  ))}
                  {ids.length === 0 && <p className="empty">Nothing here. Suspiciously calm.</p>}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
